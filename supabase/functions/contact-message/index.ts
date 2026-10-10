// Supabase Edge Function: contact-message
// Deploy: npx supabase functions deploy contact-message --project-ref anlsellghialszuuvipw --no-verify-jwt
// Required secrets: RESEND_API_KEY, CONTACT_NOTIFY_EMAIL
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-provided.
//
// Stores the contact form in `contact_messages` (service role) and emails
// CONTACT_NOTIFY_EMAIL. From address is the verified sender in _shared/resend.ts.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'
import { RESEND_FROM } from '../_shared/resend.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const NOTIFY_EMAIL = (Deno.env.get('CONTACT_NOTIFY_EMAIL') ?? '').trim()

const MAX_PER_WINDOW = 5
const WINDOW_MINUTES = 60
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOPICS = [
  'Problem with a download',
  'Question before buying',
  'Order or payment',
  'Refund',
  'Something else',
] as const

async function rateLimitOk(ip: string): Promise<boolean> {
  const key = `contact-message:${ip}`
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('rate_limit_events')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart)
  if ((count ?? 0) >= MAX_PER_WINDOW) return false
  await supabase.from('rate_limit_events').insert({ key })
  return true
}

function json(req: Request, body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders(req) })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeadersFor(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)
  if (!isOriginAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403)

  try {
    const body = await req.json()
    const honeypot = typeof body?.company === 'string' ? body.company.trim() : ''
    if (honeypot.length > 0) {
      return json(req, { ok: true }, 200)
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!(await rateLimitOk(ip))) {
      return json(req, { error: 'Too many messages — please wait a bit and try again.' }, 429)
    }

    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 80) : ''
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const topic = typeof body?.topic === 'string' ? body.topic.trim() : ''
    const orderNumber =
      typeof body?.order_number === 'string' ? body.order_number.trim().replace(/^#+/, '').slice(0, 40) : ''
    const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 4000) : ''

    if (name.length < 1) return json(req, { error: 'Please enter your name.' }, 400)
    if (!EMAIL_RE.test(email)) return json(req, { error: 'Please enter a valid email address.' }, 400)
    if (!(TOPICS as readonly string[]).includes(topic)) {
      return json(req, { error: 'Please choose a topic.' }, 400)
    }
    if (message.length < 10) {
      return json(req, { error: 'Please tell us a bit more about what happened.' }, 400)
    }

    const { error: insertError } = await supabase.from('contact_messages').insert({
      name,
      email,
      topic,
      order_number: orderNumber || null,
      message,
    })
    if (insertError) {
      console.error('contact_messages insert failed:', insertError)
      return json(req, { error: "Couldn't send your message — please try again." }, 500)
    }

    if (!RESEND_API_KEY || !NOTIFY_EMAIL) {
      console.error('contact-message: RESEND_API_KEY or CONTACT_NOTIFY_EMAIL is not set')
      return json(req, { ok: true }, 200)
    }

    const text = [
      'New message from the Notion Creative Art contact form.',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Topic: ${topic}`,
      orderNumber ? `Order number: ${orderNumber}` : 'Order number: (none)',
      '',
      'Message:',
      message,
    ].join('\n')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [NOTIFY_EMAIL],
        reply_to: email,
        subject: `Contact form — ${topic} — ${name}`,
        text,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Resend error:', res.status, errText)
    }

    return json(req, { ok: true }, 200)
  } catch (err) {
    console.error('contact-message error:', err)
    return json(req, { error: 'Internal error' }, 500)
  }
})
