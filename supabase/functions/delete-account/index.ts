// Supabase Edge Function: delete-account
// JWT required. Verifies password (email users) or email confirmation (OAuth-only),
// then deletes auth.users via service role. FK migration account-deletion-fks.sql
// must be applied first.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function hasEmailPasswordIdentity(identities: { provider?: string }[] | undefined): boolean {
  return Boolean(identities?.some((i) => i.provider === 'email'))
}

async function verifyPassword(email: string, password: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ email, password }),
  })
  return res.ok
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
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Not signed in.' }), { status: 401, headers: jsonHeaders(req) })
    }

    const { data: userData, error: userErr } = await admin.auth.getUser(jwt)
    const user = userData?.user
    if (userErr || !user?.id || !user.email) {
      return new Response(JSON.stringify({ error: 'Not signed in.' }), { status: 401, headers: jsonHeaders(req) })
    }

    const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
    if (profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Admin accounts cannot be deleted here.' }), { status: 403, headers: jsonHeaders(req) })
    }

    const body = await req.json().catch(() => ({}))
    const password = typeof body?.password === 'string' ? body.password : ''
    const confirmEmail = typeof body?.confirmEmail === 'string' ? body.confirmEmail.trim().toLowerCase() : ''

    if (hasEmailPasswordIdentity(user.identities)) {
      if (!password) {
        return new Response(JSON.stringify({ error: 'Enter your current password to confirm.' }), { status: 400, headers: jsonHeaders(req) })
      }
      const ok = await verifyPassword(user.email, password)
      if (!ok) {
        return new Response(JSON.stringify({ error: 'Current password is incorrect.' }), { status: 401, headers: jsonHeaders(req) })
      }
    } else {
      if (!confirmEmail || confirmEmail !== user.email.toLowerCase()) {
        return new Response(JSON.stringify({ error: 'Type your email address exactly to confirm.' }), { status: 400, headers: jsonHeaders(req) })
      }
    }

    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id)
    if (deleteErr) {
      console.error('delete-account: deleteUser failed', deleteErr.message)
      return new Response(JSON.stringify({ error: 'Could not delete account. Please contact support.' }), { status: 500, headers: jsonHeaders(req) })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders(req) })
  } catch (err) {
    console.error('delete-account error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders(req) })
  }
})
