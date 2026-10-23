// Supabase Edge Function: resend-guest-download
// Deploy with JWT verification OFF (guests have no session).
// Secrets: RESEND_API_KEY (already set for the order emails). SUPABASE_URL / SERVICE_ROLE_KEY are automatic.
//
// "Send my download again": the buyer types the email they paid with. If paid Paddle orders from the last 60 days
// exist for it, each gets a NEW download link by email (old links keep working until they expire). The reply is always
// { ok: true } so the form never reveals whether an email has orders. Limited per IP and per email.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'
import { buildOrderConfirmationEmail, siteBaseUrl } from '../_shared/orderConfirmationEmail.ts'
import { sendResendEmail } from '../_shared/resend.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const MAX_PER_IP_PER_HOUR = 6
const MAX_PER_EMAIL_PER_HOUR = 3
const LINK_DAYS = 30
const EMAIL_RE = /^[^ @]+@[^ @]+[.][^ @]+$/

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).split('+').join('-').split('/').join('_').split('=').join('')
}

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function reply(req: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders(req) })
}

async function overLimit(key: string, max: number) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase.from('rate_limit_events').select('id', { count: 'exact', head: true }).eq('key', key).gte('created_at', since)
  if ((count ?? 0) >= max) return true
  await supabase.from('rate_limit_events').insert({ key })
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeadersFor(req) })
  if (req.method !== 'POST') return reply(req, 405, { error: 'Method not allowed' })
  if (!isOriginAllowed(req)) return reply(req, 403, { error: 'Origin not allowed' })

  try {
    const body = await req.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) return reply(req, 400, { error: 'Please enter a valid email address.' })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (await overLimit(`resend-download-ip:${ip}`, MAX_PER_IP_PER_HOUR) || await overLimit(`resend-download-email:${email}`, MAX_PER_EMAIL_PER_HOUR)) {
      return reply(req, 429, { error: 'Too many requests — please try again in an hour.' })
    }

    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const { data: orders } = await supabase
      .from('orders')
      .select('id, display_order_number, amount, currency, product_ids')
      .eq('provider', 'paddle')
      .eq('status', 'paid')
      .eq('customer_email', email)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(3)

    for (const order of orders ?? []) {
      const token = randomToken()
      const { error: grantErr } = await supabase.from('download_grants').insert({
        order_id: order.id,
        token_hash: await sha256Hex(token),
        expires_at: new Date(Date.now() + LINK_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      })
      if (grantErr) {
        console.error('resend-guest-download: could not create link', grantErr.message)
        continue
      }
      const ids = (order.product_ids ?? []) as string[]
      const { data: products } = await supabase.from('products').select('id, title, price').in('id', ids)
      const built = buildOrderConfirmationEmail({
        customerEmail: email,
        orderNumber: String(order.display_order_number ?? order.id),
        amount: Number(order.amount),
        currency: String(order.currency ?? 'USD'),
        products: (products ?? []).map((p) => ({ title: p.title as string, price: p.price as number | null })),
        downloadsUrl: `${siteBaseUrl()}/d/${token}`,
        guest: true,
      })
      const sent = await sendResendEmail({ to: email, subject: built.subject, html: built.html, text: built.text })
      if (!sent.ok) console.error('resend-guest-download: email failed', sent.error)
    }

    return reply(req, 200, { ok: true })
  } catch (err) {
    console.error('resend-guest-download error:', err)
    return reply(req, 500, { error: 'Internal error' })
  }
})
