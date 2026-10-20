// Supabase Edge Function: track-event
// Receives storefront analytics events and writes them to public.events with the
// service role (browsers cannot insert directly — see supabase/admin-analytics.sql).
//
// Deploy: Supabase Dashboard → Edge Functions → track-event → Code → replace everything with
// this ONE file → Deploy. No new secrets needed:
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// Privacy rules enforced HERE (not only in the browser):
//   * no consent → the event is stored anonymously: name, path, product only.
//     session id, referrer, utm, device, country and the signed-in user are dropped.
//   * with consent → session id (random, from sessionStorage), referrer hostname,
//     utm_*, device class, 2-letter country (from the request headers) and user id.
//   * props: max 10 keys, numbers/booleans/short strings only, no e-mail-looking values.
//   * no IP address is stored. Bots are ignored. Per-IP rate limit.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── CORS helpers (inlined so this function is ONE self-contained file and can be pasted
//    straight into the Supabase dashboard; same rules as supabase/functions/_shared/cors.ts) ──
const DEFAULT_ORIGINS = [
  'https://notioncreativeartnextjs.vercel.app',
  'https://notioncreativeart.com',
  'https://www.notioncreativeart.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]
const normalizeOrigin = (o: string) => o.replace(/\/$/, '')
function allowedOrigins(): string[] {
  const out = new Set(DEFAULT_ORIGINS.map(normalizeOrigin))
  const siteUrl = Deno.env.get('SITE_URL') ?? Deno.env.get('NEXT_PUBLIC_SITE_URL')
  if (siteUrl) out.add(normalizeOrigin(siteUrl))
  const extra = Deno.env.get('ALLOWED_ORIGINS')
  if (extra) for (const o of extra.split(',')) if (o.trim()) out.add(normalizeOrigin(o.trim()))
  return [...out]
}
function isOriginAllowed(req: Request): boolean {
  const origin = req.headers.get('Origin')
  if (!origin) return true
  return allowedOrigins().includes(normalizeOrigin(origin))
}
function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin')
  const match = origin && allowedOrigins().includes(normalizeOrigin(origin)) ? origin : null
  return {
    ...(match ? { 'Access-Control-Allow-Origin': match } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
function jsonHeaders(req: Request): Record<string, string> {
  return { ...corsHeadersFor(req), 'Content-Type': 'application/json' }
}

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const EVENTS = new Set([
  'page_view', 'view_item', 'add_to_cart', 'remove_from_cart', 'add_to_wishlist', 'remove_from_wishlist',
  'begin_checkout', 'purchase', 'free_download', 'download', 'search', 'sign_up', 'login',
  'newsletter_subscribe', 'chat_open', 'review_submit', 'share',
])
const DEVICES = new Set(['mobile', 'tablet', 'desktop'])
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|uptime|monitor|curl\/|wget|python-requests|httpclient|axios|node-fetch|go-http/i
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_PER_MINUTE = 90

const clip = (v: unknown, n: number): string | null => {
  if (typeof v !== 'string') return null
  const s = v.trim().slice(0, n)
  return s === '' ? null : s
}

function cleanProps(input: unknown): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out
  let n = 0
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (n >= 10) break
    if (!/^[a-z_]{1,24}$/i.test(k) || /mail|phone|name|address|token|password/i.test(k)) continue
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v
    else if (typeof v === 'boolean') out[k] = v
    else if (typeof v === 'string') {
      const s = v.slice(0, k === 'q' ? 64 : 80)
      if (!/@/.test(s)) out[k] = s
    } else continue
    n++
  }
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeadersFor(req) })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders(req) })
  if (!isOriginAllowed(req)) return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403, headers: jsonHeaders(req) })

  try {
    const ua = req.headers.get('user-agent') ?? ''
    if (!ua || BOT.test(ua)) return new Response(JSON.stringify({ ok: true, skipped: 'bot' }), { status: 200, headers: jsonHeaders(req) })

    const raw = await req.text()
    if (raw.length > 4096) return new Response(JSON.stringify({ error: 'Too large' }), { status: 413, headers: jsonHeaders(req) })
    const body = JSON.parse(raw) as Record<string, unknown>

    const eventName = typeof body.event_name === 'string' ? body.event_name : ''
    if (!EVENTS.has(eventName)) return new Response(JSON.stringify({ error: 'Unknown event' }), { status: 400, headers: jsonHeaders(req) })

    let path = clip(body.path, 512)
    if (path && (!path.startsWith('/') || path.startsWith('/admin'))) path = null
    if (path) path = path.split('?')[0].split('#')[0]
    if (eventName === 'page_view' && !path) return new Response(JSON.stringify({ error: 'path required' }), { status: 400, headers: jsonHeaders(req) })

    const productId = typeof body.product_id === 'string' && UUID.test(body.product_id) ? body.product_id : null
    const consent = body.consent === true

    // Per-IP rate limit (IP only lives inside the key of rate_limit_events, which is pruned daily).
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const key = `track:${ip}`
    const since = new Date(Date.now() - 60_000).toISOString()
    const { count } = await supabase.from('rate_limit_events').select('id', { count: 'exact', head: true }).eq('key', key).gte('created_at', since)
    if ((count ?? 0) >= MAX_PER_MINUTE) return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429, headers: jsonHeaders(req) })
    await supabase.from('rate_limit_events').insert({ key })

    const row: Record<string, unknown> = {
      event_name: eventName,
      path,
      product_id: productId,
      props: cleanProps(body.props),
    }

    if (consent) {
      row.session_id = clip(body.session_id, 64)
      row.referrer = clip(body.referrer, 255)
      row.utm_source = clip(body.utm_source, 100)
      row.utm_medium = clip(body.utm_medium, 100)
      row.utm_campaign = clip(body.utm_campaign, 150)
      row.device = typeof body.device === 'string' && DEVICES.has(body.device) ? body.device : null
      const country = (req.headers.get('cf-ipcountry') ?? req.headers.get('x-vercel-ip-country') ?? '').toUpperCase()
      row.country = /^[A-Z]{2}$/.test(country) ? country : null

      // Signed-in visitor → user id (verified from the JWT; ignore the anon key).
      const auth = req.headers.get('authorization') ?? ''
      const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : ''
      if (token && token.split('.').length === 3) {
        const { data } = await supabase.auth.getUser(token)
        if (data?.user?.id) row.user_id = data.user.id
      }
    }

    const { error } = await supabase.from('events').insert(row)
    if (error) {
      console.error('track-event insert failed:', error.message)
      return new Response(JSON.stringify({ error: 'insert failed' }), { status: 500, headers: jsonHeaders(req) })
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders(req) })
  } catch (err) {
    console.error('track-event error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders(req) })
  }
})
