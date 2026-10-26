// Supabase Edge Function: paddle-webhook
// Receives Paddle notifications. Deploy with JWT verification OFF (Paddle calls it, not a browser).
// Secrets (Dashboard → Edge Functions → Secrets):
//   PADDLE_WEBHOOK_SECRET — the "secret key" of the Paddle notification destination
//   PADDLE_API_KEY        — server API key (used only to look up the buyer's email)
//   PADDLE_ENV            — 'sandbox' (default) or 'live' — must match the Paddle account sending events
//   RESEND_API_KEY        — for the order confirmation email (already set for lemon-webhook)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-provided.
//
// Access is granted ONLY from a signature-verified `transaction.completed` event, never from the browser.
// What was bought is read from the Paddle price ids on the transaction (not from custom_data), so
// nobody can claim a different pattern by editing custom data.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildOrderConfirmationEmail, siteBaseUrl } from '../_shared/orderConfirmationEmail.ts'
import { sendResendEmail } from '../_shared/resend.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const PADDLE_ENV = (Deno.env.get('PADDLE_ENV') ?? 'sandbox') === 'live' ? 'live' : 'sandbox'
const PADDLE_API = PADDLE_ENV === 'live' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com'
const PRICE_COL = PADDLE_ENV === 'live' ? 'paddle_price_id' : 'paddle_price_id_sandbox'
const SIGNATURE_TOLERANCE_SECONDS = 300
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function hex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(text: string) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))
}

const GUEST_LINK_DAYS = 30
const GUEST_TOKEN_RE = /^[A-Za-z0-9_-]{32,64}$/

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Paddle-Signature: "ts=1671552777;h1=<hex>" (h1 can appear more than once during secret rotation). */
async function verifySignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false
  let ts = ''
  const hashes: string[] = []
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    const k = part.slice(0, i).trim()
    const v = part.slice(i + 1).trim()
    if (k === 'ts') ts = v
    if (k === 'h1') hashes.push(v)
  }
  if (!ts || hashes.length === 0) return false
  const age = Math.abs(Date.now() / 1000 - Number(ts))
  if (!Number.isFinite(age) || age > SIGNATURE_TOLERANCE_SECONDS) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}:${rawBody}`)))
  return hashes.some((h) => safeEqual(h, mac))
}

async function fetchCustomerEmail(customerId: string): Promise<string> {
  const key = (Deno.env.get('PADDLE_API_KEY') ?? '').trim().replace(/^Bearer\s+/i, '').replace(/^["']+|["']+$/g, '').trim()
  if (!key || !customerId) return ''
  try {
    const res = await fetch(`${PADDLE_API}/customers/${customerId}`, { headers: { Authorization: `Bearer ${key}` } })
    const json = await res.json()
    return typeof json?.data?.email === 'string' ? json.data.email.trim().toLowerCase() : ''
  } catch (err) {
    console.error('paddle-webhook: customer lookup failed', err)
    return ''
  }
}

async function sendConfirmation(opts: { email: string; orderNumber: string; amount: number; currency: string; productIds: string[]; downloadsUrl?: string }) {
  const to = opts.email.trim().toLowerCase()
  if (!to) return
  const { data } = await supabase.from('products').select('id, title, price').in('id', opts.productIds)
  const byId = new Map((data ?? []).map((p) => [p.id as string, p]))
  const products = opts.productIds.map((id) => {
    const row = byId.get(id)
    return { title: (row?.title as string) || 'Crochet pattern', price: row?.price as number | null }
  })
  const built = buildOrderConfirmationEmail({
    customerEmail: to,
    orderNumber: opts.orderNumber,
    amount: opts.amount,
    currency: opts.currency,
    products: products.length ? products : [{ title: 'Your crochet pattern(s)' }],
    downloadsUrl: opts.downloadsUrl ?? `${siteBaseUrl()}/account/downloads`,
    guest: !!opts.downloadsUrl,
  })
  const result = await sendResendEmail({ to, subject: built.subject, html: built.html, text: built.text, idempotencyKey: `order-confirm-${opts.orderNumber}` })
  if (!result.ok) console.error('paddle-webhook: confirmation email failed', result.error)
}

async function handleTransactionCompleted(data: Record<string, any>): Promise<string | null> {
  const txnId = String(data.id ?? '')
  if (!txnId) throw new Error('transaction.completed without id')

  // What was bought: map the Paddle price ids on the transaction back to our products.
  const priceIds: string[] = (data.items ?? []).map((i: any) => i?.price?.id ?? i?.price_id).filter(Boolean)
  const { data: rows, error: prodErr } = await supabase.from('products').select(`id, ${PRICE_COL}`).in(PRICE_COL, priceIds)
  if (prodErr) throw prodErr
  let productIds = (rows ?? []).map((r: any) => r.id as string)

  const totals = data.details?.totals ?? {}
  const currency = String(data.currency_code ?? 'USD')
  const divisor = ['JPY', 'KRW', 'VND', 'CLP', 'HUF'].includes(currency) ? 1 : 100
  const amount = Number(totals.total ?? totals.grand_total ?? 0) / divisor
  const tax = totals.tax != null ? Number(totals.tax) / divisor : null

  if (productIds.length !== priceIds.length) {
    // One-off (non-catalog) prices created by create-paddle-checkout have no price id in our database. For those,
    // the server put the product ids in custom_data. Accept them only if every product exists and the amount paid
    // covers their database prices, so nobody can claim a dearer pattern than they paid for.
    let claimed: string[] = []
    try {
      const raw = data.custom_data?.product_ids
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (Array.isArray(parsed)) claimed = parsed.filter((id: unknown): id is string => typeof id === 'string' && UUID_RE.test(id))
    } catch { /* ignore */ }
    if (claimed.length > 0 && claimed.length === (data.items ?? []).length) {
      const { data: cps } = await supabase.from('products').select('id, price').in('id', claimed).eq('active', true)
      const expected = (cps ?? []).reduce((sum: number, p: any) => sum + Number(p.price), 0)
      if ((cps ?? []).length === claimed.length && amount + 0.01 >= expected) productIds = claimed
      else console.error('paddle-webhook: claimed products do not match the amount paid', { claimed, expected, amount })
    } else {
      console.error('paddle-webhook: some price ids are not mapped to a product', { priceIds, mapped: productIds.length })
    }
  }

  // Who bought: user id was set on the server when the transaction was created.
  let userId: string | null = null
  const rawUser = data.custom_data?.user_id
  if (typeof rawUser === 'string' && UUID_RE.test(rawUser)) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', rawUser).maybeSingle()
    if (profile?.id) userId = profile.id
  }

  const email = await fetchCustomerEmail(String(data.customer_id ?? ''))
  const displayNumber = String(data.invoice_number ?? txnId)

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .upsert(
      {
        provider: 'paddle',
        provider_order_id: txnId,
        display_order_number: displayNumber,
        environment: PADDLE_ENV,
        user_id: userId,
        customer_email: email || 'unknown@paddle.invalid',
        amount,
        currency,
        tax_amount: tax,
        status: 'paid',
        product_ids: productIds,
      },
      { onConflict: 'provider,provider_order_id' },
    )
    .select('id')
    .single()
  if (orderErr) throw orderErr

  // Guest (no account): store the hashed download token that was created with the checkout, so /d/<token> works.
  let guestToken: string | null = null
  if (!userId) {
    const raw = data.custom_data?.grant_token
    if (typeof raw === 'string' && GUEST_TOKEN_RE.test(raw)) guestToken = raw
  }
  if (guestToken) {
    const { error: grantErr } = await supabase.from('download_grants').upsert(
      {
        order_id: order.id,
        token_hash: await sha256Hex(guestToken),
        expires_at: new Date(Date.now() + GUEST_LINK_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'token_hash', ignoreDuplicates: true },
    )
    if (grantErr) throw grantErr
  }

  if (userId && productIds.length > 0) {
    const { error: purchaseErr } = await supabase
      .from('purchases')
      .upsert(productIds.map((productId) => ({ user_id: userId, product_id: productId, order_id: order.id })), { onConflict: 'order_id,product_id' })
    if (purchaseErr) throw purchaseErr
    await supabase.from('cart_items').delete().eq('user_id', userId).in('product_id', productIds)
  }

  if (email) {
    // Paddle wants a 2xx within 5 seconds, so the email is sent in the background after the order is saved.
    const downloadsUrl = guestToken ? `${siteBaseUrl()}/d/${guestToken}` : undefined
    const emailJob = sendConfirmation({ email, orderNumber: displayNumber, amount, currency, productIds, downloadsUrl }).catch((err) =>
      console.error('paddle-webhook: confirmation email threw', err),
    )
    const runtime = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime
    if (runtime?.waitUntil) runtime.waitUntil(emailJob)
    else await emailJob
  }
  return order.id as string
}

/** Full, approved refunds (and chargebacks) revoke access. Partial refunds leave access in place. */
async function handleAdjustment(data: Record<string, any>): Promise<string | null> {
  const action = String(data.action ?? '')
  const status = String(data.status ?? '')
  const txnId = String(data.transaction_id ?? '')
  if (!txnId || status !== 'approved') return null
  if (!['refund', 'chargeback', 'chargeback_warning'].includes(action) || action === 'chargeback_warning') return null
  // Paddle can label a refund of the whole item "partial" at the top level (seen on a live $1.00 refund) while every
  // line is "full", so a refund counts as full when the top-level type is full or when every line item is full.
  const items: Array<{ type?: string }> = Array.isArray(data.items) ? data.items : []
  const allItemsFull = items.length > 0 && items.every((i) => i?.type === 'full')
  if (action === 'refund' && data.type && data.type !== 'full' && !allItemsFull) return null

  const { data: order, error } = await supabase
    .from('orders')
    .update({ status: 'refunded' })
    .eq('provider', 'paddle')
    .eq('provider_order_id', txnId)
    .select('id')
    .maybeSingle()
  if (error) throw error
  if (order?.id) {
    const { error: revokeErr } = await supabase.from('purchases').delete().eq('order_id', order.id)
    if (revokeErr) throw revokeErr
    return order.id as string
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  // Tolerate stray spaces / newlines / quotes from pasting the secret.
  const secret = (Deno.env.get('PADDLE_WEBHOOK_SECRET') ?? '').trim().replace(/^["']+|["']+$/g, '').trim()
  if (!secret) {
    console.error('paddle-webhook: PADDLE_WEBHOOK_SECRET is not set')
    return new Response('Webhook not configured', { status: 500 })
  }
  const rawBody = await req.text()
  if (!(await verifySignature(rawBody, req.headers.get('Paddle-Signature'), secret))) {
    console.error('paddle-webhook: invalid signature', 'secretLength', secret.length, 'secretPrefix', secret.slice(0, 10), 'hasHeader', !!req.headers.get('Paddle-Signature'))
    return new Response('Invalid signature', { status: 401 })
  }

  let event: Record<string, any>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  const eventId = String(event.event_id ?? '')
  const eventType = String(event.event_type ?? '')
  if (!eventId || !eventType) return new Response('Bad request', { status: 400 })

  // Idempotency: Paddle delivers at least once. Already-processed events are acknowledged and skipped.
  const { error: insertErr } = await supabase.from('payment_events').insert({ provider: 'paddle', event_id: eventId, event_type: eventType, payload: event })
  if (insertErr) {
    if (insertErr.code !== '23505') {
      console.error('paddle-webhook: could not record event', insertErr.message)
      return new Response('Internal error', { status: 500 })
    }
    const { data: existing } = await supabase.from('payment_events').select('processed_at').eq('provider', 'paddle').eq('event_id', eventId).maybeSingle()
    if (existing?.processed_at) return new Response('ok (duplicate)', { status: 200 })
  }

  try {
    let orderId: string | null = null
    if (eventType === 'transaction.completed') orderId = await handleTransactionCompleted(event.data ?? {})
    else if (eventType === 'adjustment.created' || eventType === 'adjustment.updated') orderId = await handleAdjustment(event.data ?? {})
    await supabase.from('payment_events').update({ processed_at: new Date().toISOString(), order_id: orderId, error: null }).eq('provider', 'paddle').eq('event_id', eventId)
    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('paddle-webhook error:', err)
    await supabase.from('payment_events').update({ error: String((err as Error)?.message ?? err).slice(0, 500) }).eq('provider', 'paddle').eq('event_id', eventId)
    return new Response('Internal error', { status: 500 })
  }
})
