// Supabase Edge Function: lemon-webhook
// Deploy target: Supabase Dashboard → Edge Functions → New function → paste this file
// Required secrets (set in Dashboard → Edge Functions → lemon-webhook → Secrets):
//   LEMON_WEBHOOK_SECRET      — Lemon Squeezy test-mode webhook signing secret
//   LEMON_WEBHOOK_SECRET_LIVE — Lemon Squeezy live-mode webhook signing secret
//   SUPABASE_URL           — auto-provided by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-provided by Supabase (bypasses RLS — never expose to frontend)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

async function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const digestHex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, '0')).join('')
  // constant-time-ish compare
  return digestHex.length === signature.length &&
    digestHex.split('').every((c, i) => c === signature[i])
}

/** Accept either test or live Lemon webhook secret — modes use different signing keys. */
async function verifyAgainstConfiguredSecrets(rawBody: string, signature: string | null) {
  const secrets = [
    Deno.env.get('LEMON_WEBHOOK_SECRET'),
    Deno.env.get('LEMON_WEBHOOK_SECRET_LIVE'),
  ].filter((s): s is string => Boolean(s))

  if (secrets.length === 0) {
    console.error('lemon-webhook: neither LEMON_WEBHOOK_SECRET nor LEMON_WEBHOOK_SECRET_LIVE is set')
    return { configured: false, valid: false }
  }

  for (const secret of secrets) {
    if (await verifySignature(rawBody, signature, secret)) {
      return { configured: true, valid: true }
    }
  }
  return { configured: true, valid: false }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const rawBody = await req.text()
  const signature = req.headers.get('x-signature')
  const { configured, valid } = await verifyAgainstConfiguredSecrets(rawBody, signature)
  if (!configured) {
    return new Response('Webhook not configured', { status: 500 })
  }
  if (!valid) {
    console.error('lemon-webhook: invalid signature')
    return new Response('Invalid signature', { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const eventName = payload.meta?.event_name as string
  const customData = payload.meta?.custom_data ?? {}
  const attrs = payload.data?.attributes ?? {}
  // Prefer the customer-facing order number (#43285338) so Account + support lookup match the receipt.
  const lemonOrderId = String(attrs.order_number ?? payload.data?.id ?? '')
  console.log('lemon-webhook event:', eventName, lemonOrderId || '(no id)')

  try {
    if (eventName === 'order_created') {
      const userId = customData.user_id
      // Two shapes depending on how checkout was created:
      //   single-item Buy Now → custom_data.product_id (one string)
      //   cart checkout      → custom_data.product_ids (JSON-stringified array)
      let productIds: string[] = []
      if (customData.product_ids) {
        try { productIds = JSON.parse(customData.product_ids) } catch { productIds = [] }
      } else if (customData.product_id) {
        productIds = [customData.product_id]
      }

      const amount = (attrs.total ?? 0) / 100 // Lemon Squeezy amounts are in cents
      const currency = attrs.currency ?? 'USD'
      const email = attrs.user_email ?? attrs.customer_email ?? ''
      const status = attrs.status === 'paid' ? 'paid' : 'pending'

      // Dedupe: upsert on lemon_order_id so webhook replays don't create duplicate orders
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .upsert(
          {
            lemon_order_id: lemonOrderId,
            user_id: userId ?? null,
            customer_email: email,
            amount,
            currency,
            status,
            product_ids: productIds,
          },
          { onConflict: 'lemon_order_id' },
        )
        .select()
        .single()

      if (orderErr) throw orderErr

      if (userId && productIds.length > 0 && status === 'paid') {
        const { error: purchaseErr } = await supabase
          .from('purchases')
          .upsert(
            productIds.map((productId) => ({ user_id: userId, product_id: productId, order_id: order.id })),
            { onConflict: 'order_id,product_id' },
          )
        if (purchaseErr) throw purchaseErr

        // Clear these items out of the cart now that they've been bought
        await supabase.from('cart_items').delete().eq('user_id', userId).in('product_id', productIds)
      }
    }

    if (eventName === 'order_refunded') {
      await supabase.from('orders').update({ status: 'refunded' }).eq('lemon_order_id', lemonOrderId)
      // Purchases intentionally left in place — pattern access on refund is a business decision;
      // revoke manually from Admin → Orders if needed.
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('lemon-webhook error:', err)
    return new Response('Internal error', { status: 500 })
  }
})
