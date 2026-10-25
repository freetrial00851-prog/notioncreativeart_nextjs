// Supabase Edge Function: contact-message
// Deploy with JWT verification OFF (visitors have no session).
// Secrets: RESEND_API_KEY (already set for the order emails). SUPABASE_URL / SERVICE_ROLE_KEY are automatic.
//
// Sends a message from the website's contact form to the support mailbox. The visitor's email is the Reply-To, so
// pressing Reply answers them. Limited per IP and per email; a hidden "website" field catches simple bots.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const SUPPORT_TO = 'patterns@notioncreativeart.com'
const FROM = 'Notion Creative Art <orders@notioncreativeart.com>'
const MAX_PER_IP_PER_HOUR = 5
const MAX_PER_EMAIL_PER_HOUR = 3
const EMAIL_RE = /^[^ @]+@[^ @]+[.][^ @]+$/

function esc(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
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
    // Bots fill every field: pretend it worked.
    if (typeof body?.website === 'string' && body.website.trim() !== '') return reply(req, 200, { ok: true })

    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 100) : ''
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const order = typeof body?.order === 'string' ? body.order.trim().slice(0, 60) : ''
    const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 4000) : ''

    if (!name) return reply(req, 400, { error: 'Please add your name.' })
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) return reply(req, 400, { error: 'Please enter a valid email address.' })
    if (message.length < 10) return reply(req, 400, { error: 'Please write a little more so we can help (at least 10 characters).' })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if ((await overLimit(`contact-ip:${ip}`, MAX_PER_IP_PER_HOUR)) || (await overLimit(`contact-email:${email}`, MAX_PER_EMAIL_PER_HOUR))) {
      return reply(req, 429, { error: 'Too many messages. Please try again in an hour, or email us directly.' })
    }

    const apiKey = Deno.env.get('RESEND_API_KEY')
    if (!apiKey) {
      console.error('contact-message: RESEND_API_KEY is not configured')
      return reply(req, 500, { error: 'We could not send your message. Please email us directly.' })
    }

    const subject = `Website message from ${name}${order ? ` (order ${order})` : ''}`
    const html = `<p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>${order ? `<p><strong>Order:</strong> ${esc(order)}</p>` : ''}<p style="white-space:pre-wrap">${esc(message)}</p>`
    const text = `From: ${name} <${email}>\n${order ? `Order: ${order}\n` : ''}\n${message}`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [SUPPORT_TO], reply_to: email, subject, html, text }),
    })
    if (!res.ok) {
      console.error('contact-message: Resend failed', res.status, await res.text())
      return reply(req, 500, { error: 'We could not send your message. Please email us directly.' })
    }
    return reply(req, 200, { ok: true })
  } catch (err) {
    console.error('contact-message error:', err)
    return reply(req, 500, { error: 'Something went wrong. Please try again.' })
  }
})
