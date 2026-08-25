// Supabase Edge Function: subscribe-newsletter
// Deploy: Supabase Dashboard → Edge Functions → New function → paste this file → name it "subscribe-newsletter"
// No new secrets needed — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-provided by Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const MAX_PER_WINDOW = 5
const WINDOW_MINUTES = 60

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeadersFor(req) })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders(req) })
  }
  if (!isOriginAllowed(req)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403, headers: jsonHeaders(req) })
  }

  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), { status: 400, headers: jsonHeaders(req) })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const key = `newsletter:${ip}`
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

    const { count } = await supabase
      .from('rate_limit_events')
      .select('id', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', windowStart)

    if ((count ?? 0) >= MAX_PER_WINDOW) {
      return new Response(JSON.stringify({ error: "Too many signup attempts — please try again in a bit." }), { status: 429, headers: jsonHeaders(req) })
    }

    await supabase.from('rate_limit_events').insert({ key })

    const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim().toLowerCase() })
    if (error && error.code !== '23505') {
      console.error('newsletter insert failed:', error)
      return new Response(JSON.stringify({ error: "Couldn't subscribe — please try again." }), { status: 500, headers: jsonHeaders(req) })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders(req) })
  } catch (err) {
    console.error('subscribe-newsletter error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders(req) })
  }
})
