// Supabase Edge Function: chat-escalate
// Deploy: npx supabase functions deploy chat-escalate --project-ref anlsellghialszuuvipw --no-verify-jwt
// Required secret: RESEND_API_KEY (resend.com)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-provided.
//
// Sends a support escalation email (Talk to a human) to the site contact address.
// No DB / admin inbox — email delivery only.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const SUPPORT_TO = 'freetrail00851@gmail.com'
const FROM = 'Notion Creative Art <onboarding@resend.dev>'

const MAX_PER_WINDOW = 8
const WINDOW_MINUTES = 60
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function rateLimitOk(ip: string): Promise<boolean> {
  const key = `chat-escalate:${ip}`
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Human support email isn't configured yet — please use the Contact page." }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!(await rateLimitOk(ip))) {
      return new Response(JSON.stringify({ error: 'Too many messages — please wait a bit and try again.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 4000) : ''
    const history = Array.isArray(body?.history)
      ? body.history
          .filter((m: { role?: string; content?: string }) => m && typeof m.content === 'string')
          .slice(-10)
          .map((m: { role: string; content: string }) => `${m.role}: ${m.content.slice(0, 500)}`)
          .join('\n')
      : ''

    if (!EMAIL_RE.test(email)) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (message.length < 5) {
      return new Response(JSON.stringify({ error: 'Please include a short message for support.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const text = [
      'New support chat escalation from the NCA Help widget.',
      '',
      `From: ${email}`,
      '',
      'Message:',
      message,
      '',
      history ? `Recent chat:\n${history}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [SUPPORT_TO],
        reply_to: email,
        subject: `NCA support chat — ${email}`,
        text,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Resend error:', res.status, errText)
      return new Response(JSON.stringify({ error: "Couldn't send your message — please try again or use the Contact page." }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, email }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('chat-escalate error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
