// Supabase Edge Function: download-guest-order
// Deploy with JWT verification OFF (guests have no session). No new secrets needed.
//
// A buyer who paid without an account opens /d/<token>. This function checks the token (only its SHA-256 hash is
// stored in download_grants), confirms the order is paid and the link has not expired or run out of downloads, and
// either lists the order's patterns or mints a 60-second signed URL for one PDF using the service role.
//
// Replies (HTTP 200 unless noted): { status: 'pending' } the order is not recorded yet (or the link is unknown —
// the two look identical on purpose), { status: 'ready', items } or { status: 'ready', signedUrl, filename },
// { status: 'expired' } (410), { status: 'refunded' } (403), { status: 'limit' } (429).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const MAX_PER_HOUR = 120
const TOKEN_RE = /^[A-Za-z0-9_-]{32,64}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function reply(req: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders(req) })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeadersFor(req) })
  if (req.method !== 'POST') return reply(req, 405, { error: 'Method not allowed' })
  if (!isOriginAllowed(req)) return reply(req, 403, { error: 'Origin not allowed' })

  try {
    const { token, productId } = await req.json()
    if (typeof token !== 'string' || !TOKEN_RE.test(token)) return reply(req, 400, { error: 'Invalid link.' })
    if (productId !== undefined && (typeof productId !== 'string' || !UUID_RE.test(productId))) return reply(req, 400, { error: 'Invalid pattern.' })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rlKey = `guest-download:${ip}`
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabase.from('rate_limit_events').select('id', { count: 'exact', head: true }).eq('key', rlKey).gte('created_at', since)
    if ((count ?? 0) >= MAX_PER_HOUR) return reply(req, 429, { status: 'limit', error: 'Too many attempts — please try again in a bit.' })
    await supabase.from('rate_limit_events').insert({ key: rlKey })

    const { data: grant } = await supabase
      .from('download_grants')
      .select('id, order_id, expires_at, max_downloads, downloads')
      .eq('token_hash', await sha256Hex(token))
      .maybeSingle()
    if (!grant) return reply(req, 200, { status: 'pending' })
    if (new Date(grant.expires_at).getTime() < Date.now()) return reply(req, 410, { status: 'expired' })

    const { data: order } = await supabase.from('orders').select('id, status, product_ids, display_order_number').eq('id', grant.order_id).maybeSingle()
    if (!order) return reply(req, 200, { status: 'pending' })
    if (order.status !== 'paid') return reply(req, 403, { status: 'refunded' })

    const ids = (order.product_ids ?? []) as string[]
    const { data: products } = await supabase.from('products').select('id, title, pdf_pages').in('id', ids)
    const byId = new Map((products ?? []).map((p) => [p.id as string, p]))

    if (!productId) {
      return reply(req, 200, {
        status: 'ready',
        orderNumber: order.display_order_number,
        items: ids.map((id) => ({ id, title: (byId.get(id)?.title as string) ?? 'Crochet pattern', pages: (byId.get(id)?.pdf_pages as number | null) ?? null })),
      })
    }

    if (!ids.includes(productId)) return reply(req, 404, { error: 'That pattern is not part of this order.' })
    if (grant.downloads >= grant.max_downloads) return reply(req, 429, { status: 'limit', error: 'This link has reached its download limit. Use “Send my download again” to get a new one.' })

    // Count the download first (optimistic lock so two clicks cannot both slip past the limit).
    const { data: bumped } = await supabase
      .from('download_grants')
      .update({ downloads: grant.downloads + 1 })
      .eq('id', grant.id)
      .eq('downloads', grant.downloads)
      .select('id')
    if (!bumped || bumped.length === 0) return reply(req, 429, { status: 'limit', error: 'Please try again.' })

    const title = (byId.get(productId)?.title as string) ?? 'pattern'
    const filename = `${title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.pdf`
    const { data: signed, error: signErr } = await supabase.storage.from('patterns').createSignedUrl(`${productId}.pdf`, 60, { download: filename })
    if (signErr || !signed?.signedUrl) {
      console.error('download-guest-order: signed URL failed', signErr)
      return reply(req, 404, { error: 'The file is not available yet. Please contact us.' })
    }
    return reply(req, 200, { status: 'ready', signedUrl: signed.signedUrl, filename })
  } catch (err) {
    console.error('download-guest-order error:', err)
    return reply(req, 500, { error: 'Internal error' })
  }
})
