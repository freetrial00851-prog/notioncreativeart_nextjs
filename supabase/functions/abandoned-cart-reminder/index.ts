// Supabase Edge Function: abandoned-cart-reminder
// Deploy: npx supabase functions deploy abandoned-cart-reminder --project-ref anlsellghialszuuvipw --no-verify-jwt
// Secrets:
//   CRON_SECRET            — shared secret for cron / manual triggers (Authorization: Bearer …)
//   RESEND_API_KEY         — same as lemon-webhook
//   SUPABASE_URL           — auto-provided
//   SUPABASE_SERVICE_ROLE_KEY — auto-provided
//
// Prerequisite SQL: run supabase/abandoned-cart-reminder.sql in the SQL Editor.
//
// Manual test (dry run — no emails sent):
//   curl -X POST "https://anlsellghialszuuvipw.supabase.co/functions/v1/abandoned-cart-reminder?dryRun=1" \
//     -H "Authorization: Bearer YOUR_CRON_SECRET"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildAbandonedCartEmail,
  thumbImageUrl,
  type AbandonedCartItem,
} from '../_shared/abandonedCartEmail.ts'
import { siteBaseUrl } from '../_shared/orderConfirmationEmail.ts'
import { sendResendEmail } from '../_shared/resend.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

type Candidate = {
  user_id: string
  email: string
  cart_updated_at: string
  item_count: number
}

type CartRow = {
  product_id: string
  updated_at: string
  product: {
    title: string
    slug: string
    price: number
    images: string[] | string | null
  } | null
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function authorizeCron(req: Request): boolean {
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret) {
    console.error('abandoned-cart-reminder: CRON_SECRET is not set')
    return false
  }
  const auth = req.headers.get('Authorization') ?? ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const headerSecret = req.headers.get('x-cron-secret') ?? ''
  return bearer === cronSecret || headerSecret === cronSecret
}

function normalizeImages(images: string[] | string | null | undefined): string[] {
  if (!images) return []
  if (Array.isArray(images)) return images.filter((u) => typeof u === 'string' && u.length > 0)
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images) as unknown
      if (Array.isArray(parsed)) return parsed.filter((u) => typeof u === 'string')
    } catch {
      return [images]
    }
  }
  return []
}

async function loadCartItems(userId: string): Promise<AbandonedCartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('product_id, updated_at, product:products(title, slug, price, images)')
    .eq('user_id', userId)

  if (error) {
    throw new Error(`cart_items lookup failed for ${userId}: ${error.message}`)
  }

  const rows = (data ?? []) as CartRow[]
  return rows
    .filter((row) => row.product && Number(row.product.price) > 0)
    .map((row) => {
      const images = normalizeImages(row.product!.images)
      return {
        title: row.product!.title,
        slug: row.product!.slug,
        imageUrl: thumbImageUrl(images[0] ?? null),
      }
    })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  if (!authorizeCron(req)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dryRun') === '1'

  const { data: candidates, error: rpcError } = await supabase.rpc('get_abandoned_cart_candidates')
  if (rpcError) {
    console.error('abandoned-cart-reminder: RPC failed', rpcError.message)
    return jsonResponse({ error: rpcError.message }, 500)
  }

  const cartUrl = `${siteBaseUrl()}/cart`
  const results: Record<string, unknown>[] = []

  for (const raw of (candidates ?? []) as Candidate[]) {
    const email = raw.email?.trim().toLowerCase()
    if (!email) continue

    try {
      const items = await loadCartItems(raw.user_id)
      if (items.length === 0) {
        results.push({
          user_id: raw.user_id,
          email,
          skipped: true,
          reason: 'no_paid_items',
        })
        continue
      }

      if (dryRun) {
        results.push({
          user_id: raw.user_id,
          email,
          dryRun: true,
          item_count: items.length,
          cart_updated_at: raw.cart_updated_at,
          items: items.map((i) => i.title),
        })
        continue
      }

      const { subject, html, text } = buildAbandonedCartEmail({ items, cartUrl })
      const weekBucket = new Date().toISOString().slice(0, 10)
      const idempotencyKey = `abandoned-cart/${raw.user_id}/${weekBucket}`

      const sent = await sendResendEmail({
        to: email,
        subject,
        html,
        text,
        idempotencyKey,
      })

      if (!sent.ok) {
        console.error(`abandoned-cart-reminder: email failed for ${raw.user_id}`, sent.error)
        results.push({
          user_id: raw.user_id,
          email,
          sent: false,
          error: sent.error,
        })
        continue
      }

      const { error: logError } = await supabase.from('cart_abandoned_reminders').insert({
        user_id: raw.user_id,
        item_count: items.length,
      })

      if (logError) {
        console.error(`abandoned-cart-reminder: log insert failed for ${raw.user_id}`, logError.message)
      }

      results.push({
        user_id: raw.user_id,
        email,
        sent: true,
        item_count: items.length,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`abandoned-cart-reminder: user ${raw.user_id} failed`, message)
      results.push({
        user_id: raw.user_id,
        email,
        sent: false,
        error: message,
      })
    }
  }

  return jsonResponse({
    ok: true,
    dryRun,
    candidate_count: (candidates ?? []).length,
    results,
  })
})
