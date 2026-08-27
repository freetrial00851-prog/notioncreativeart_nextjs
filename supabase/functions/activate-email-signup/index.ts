// Supabase Edge Function: activate-email-signup
// Deploy with --no-verify-jwt (called right after signUp, before a session exists).
//
// Hosted Auth with "Confirm email" ON does not return a session from signUp.
// This function:
//   1) Confirms the brand-new user (service role)
//   2) Issues a real session via the Auth password grant (same process — no client race)
//   3) Returns access_token + refresh_token for supabase.auth.setSession on the client
// The confirmation email from signUp still goes out in the background (non-blocking).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const MAX_AGE_MS = 10 * 60 * 1000

async function issueSession(email: string, password: string): Promise<
  | { access_token: string; refresh_token: string }
  | { error: string }
> {
  // Prefer password grant: verifies credentials and returns tokens in one Auth call.
  const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ email, password }),
  })
  const tokenJson = await tokenRes.json().catch(() => ({})) as {
    access_token?: string
    refresh_token?: string
    error_description?: string
    msg?: string
    error?: string
  }
  if (tokenRes.ok && tokenJson.access_token && tokenJson.refresh_token) {
    return { access_token: tokenJson.access_token, refresh_token: tokenJson.refresh_token }
  }

  // Fallback: admin generateLink + verifyOtp (documented session-issuing path).
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  const hashed = linkData?.properties?.hashed_token
  if (linkErr || !hashed) {
    return {
      error:
        tokenJson.error_description ||
        tokenJson.msg ||
        tokenJson.error ||
        linkErr?.message ||
        'Could not create session.',
    }
  }

  const { data: otpData, error: otpErr } = await admin.auth.verifyOtp({
    token_hash: hashed,
    type: 'magiclink',
  })
  if (otpErr || !otpData.session?.access_token || !otpData.session?.refresh_token) {
    return { error: otpErr?.message || 'Could not create session.' }
  }
  return {
    access_token: otpData.session.access_token,
    refresh_token: otpData.session.refresh_token,
  }
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
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : ''
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!userId || !email || !password) {
      return new Response(JSON.stringify({ error: 'Missing signup details.' }), { status: 400, headers: jsonHeaders(req) })
    }

    const { data, error } = await admin.auth.admin.getUserById(userId)
    if (error || !data?.user) {
      return new Response(JSON.stringify({ error: 'Could not activate account.' }), { status: 400, headers: jsonHeaders(req) })
    }

    const user = data.user
    if ((user.email ?? '').toLowerCase() !== email) {
      return new Response(JSON.stringify({ error: 'Could not activate account.' }), { status: 400, headers: jsonHeaders(req) })
    }

    const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0
    if (!createdAt || Date.now() - createdAt > MAX_AGE_MS) {
      return new Response(JSON.stringify({ error: 'Signup expired — please try again.' }), { status: 400, headers: jsonHeaders(req) })
    }

    if (!user.email_confirmed_at) {
      const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      })
      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), { status: 400, headers: jsonHeaders(req) })
      }
    }

    const session = await issueSession(email, password)
    if ('error' in session) {
      return new Response(JSON.stringify({ error: session.error }), { status: 400, headers: jsonHeaders(req) })
    }

    return new Response(JSON.stringify({ ok: true, ...session }), { status: 200, headers: jsonHeaders(req) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: jsonHeaders(req) })
  }
})
