// Supabase Edge Function: auth-rate-limit
// Deploy: --no-verify-jwt (called before the user has a session)
// Records attempts in rate_limit_events and returns 429 when over limit.
// Client must call this before login / signup / password-reset.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const WINDOW_MINUTES = 60
const LIMITS: Record<string, { ip: number; email?: number }> = {
  login: { ip: 10, email: 10 },
  signup: { ip: 5 },
  reset: { ip: 5, email: 5 },
}

type Action = keyof typeof LIMITS

async function countKey(key: string, windowStart: string): Promise<number> {
  const { count } = await supabase
    .from('rate_limit_events')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart)
  return count ?? 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeadersFor(req) })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders(req) })
  }
  if (!isOriginAllowed(req)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403, headers: jsonHeaders(req) })
  }

  try {
    const body = await req.json()
    const action = typeof body?.action === 'string' ? body.action.trim().toLowerCase() : ''
    if (!(action in LIMITS)) {
      return new Response(JSON.stringify({ error: 'Invalid action.' }), { status: 400, headers: jsonHeaders(req) })
    }

    const limits = LIMITS[action as Action]
    const email =
      typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : ''
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

    const ipKey = `auth:${action}:ip:${ip}`
    if ((await countKey(ipKey, windowStart)) >= limits.ip) {
      return new Response(
        JSON.stringify({ error: 'Too many attempts — please wait a bit and try again.' }),
        { status: 429, headers: jsonHeaders(req) },
      )
    }

    if (limits.email && email) {
      const emailKey = `auth:${action}:email:${email}`
      if ((await countKey(emailKey, windowStart)) >= limits.email) {
        return new Response(
          JSON.stringify({ error: 'Too many attempts for this email — please wait a bit and try again.' }),
          { status: 429, headers: jsonHeaders(req) },
        )
      }
      await supabase.from('rate_limit_events').insert({ key: emailKey })
    }

    await supabase.from('rate_limit_events').insert({ key: ipKey })

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders(req) })
  } catch (err) {
    console.error('auth-rate-limit error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders(req) })
  }
})
