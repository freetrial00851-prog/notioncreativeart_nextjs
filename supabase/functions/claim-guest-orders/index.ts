// Supabase Edge Function: claim-guest-orders
// Deploy with JWT verification OFF (the function checks the signed-in user itself).
//
// Moves orders paid as a guest onto the signed-in account, but only after proof that the account owns the email:
//   - Google sign-in whose verified email matches, or
//   - a one-time link emailed to the order email (the buyer opens it while signed in as that account).
// Password sign-ups are not trusted on their own: the email is auto-confirmed at sign-up, so it proves nothing.
//
// Body: {}         -> claims now if Google-verified, otherwise emails a link (only if there is something to claim)
//       { token }  -> claims using the emailed link
// Reply: { claimed: number } or { sent: true }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'
import { sendResendEmail } from '../_shared/resend.ts'

function siteBaseUrl(): string {
  return (
    Deno.env.get('SITE_URL')?.replace(/\/$/, '') ||
    Deno.env.get('NEXT_PUBLIC_SITE_URL')?.replace(/\/$/, '') ||
    'https://notioncreativeart.com'
  )
}

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const LINK_HOURS = 24
const MAX_MAILS_PER_USER_PER_HOUR = 3
const TOKEN_RE = /^[A-Za-z0-9_-]{32,64}$/

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

async function claim(userId: string, email: string): Promise<number> {
  const { data: orders } = await supabase
    .from('orders')
    .select('id, product_ids')
    .eq('provider', 'paddle')
    .eq('status', 'paid')
    .is('user_id', null)
    .ilike('customer_email', email)
  let claimed = 0
  for (const order of orders ?? []) {
    const { data: updated } = await supabase.from('orders').update({ user_id: userId }).eq('id', order.id).is('user_id', null).select('id')
    if (!updated?.length) continue
    const ids = (order.product_ids ?? []) as string[]
    if (ids.length > 0) {
      await supabase.from('purchases').upsert(ids.map((productId) => ({ user_id: userId, product_id: productId, order_id: order.id })), { onConflict: 'order_id,product_id' })
      await supabase.from('cart_items').delete().eq('user_id', userId).in('product_id', ids)
    }
    claimed += 1
  }
  return claimed
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeadersFor(req) })
  if (req.method !== 'POST') return reply(req, 405, { error: 'Method not allowed' })
  if (!isOriginAllowed(req)) return reply(req, 403, { error: 'Origin not allowed' })

  try {
    const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    const { data: authData } = jwt ? await supabase.auth.getUser(jwt) : { data: { user: null } }
    const user = authData?.user
    const email = user?.email?.trim().toLowerCase()
    if (!user || !email) return reply(req, 401, { error: 'Please sign in first.' })

    const body = await req.json().catch(() => ({}))
    const token = typeof body?.token === 'string' ? body.token : ''

    if (token) {
      if (!TOKEN_RE.test(token)) return reply(req, 400, { error: 'This link is not valid.' })
      const { data: row } = await supabase
        .from('claim_tokens')
        .select('id, user_id, email, expires_at, used_at')
        .eq('token_hash', await sha256Hex(token))
        .maybeSingle()
      if (!row || row.used_at || row.user_id !== user.id || row.email !== email || new Date(row.expires_at).getTime() < Date.now()) {
        return reply(req, 400, { error: 'This link has expired or belongs to a different account. Please request a new one.' })
      }
      await supabase.from('claim_tokens').update({ used_at: new Date().toISOString() }).eq('id', row.id)
      return reply(req, 200, { claimed: await claim(user.id, email) })
    }

    const googleVerified = (user.identities ?? []).some((i) => {
      const d = (i.identity_data ?? {}) as { email?: string; email_verified?: boolean }
      return i.provider === 'google' && d.email_verified === true && d.email?.trim().toLowerCase() === email
    })
    if (googleVerified) return reply(req, 200, { claimed: await claim(user.id, email) })

    // Nothing to claim: say so without sending mail.
    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('provider', 'paddle')
      .eq('status', 'paid')
      .is('user_id', null)
      .ilike('customer_email', email)
    if (!count) return reply(req, 200, { claimed: 0 })

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recent } = await supabase
      .from('claim_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since)
    if ((recent ?? 0) >= MAX_MAILS_PER_USER_PER_HOUR) return reply(req, 429, { error: 'Too many requests. Please try again in an hour.' })

    const newToken = randomToken()
    const { error: insErr } = await supabase.from('claim_tokens').insert({
      user_id: user.id,
      email,
      token_hash: await sha256Hex(newToken),
      expires_at: new Date(Date.now() + LINK_HOURS * 60 * 60 * 1000).toISOString(),
    })
    if (insErr) throw insErr

    const link = `${siteBaseUrl()}/account/orders?claim=${newToken}`
    const sent = await sendResendEmail({
      to: email,
      subject: 'Confirm your email to add your orders',
      html: `<p>Hi,</p><p>You paid for patterns as a guest with this email. Open this link while signed in to add them to your account:</p><p><a href="${link}">Add my orders to my account</a></p><p>The link works for ${LINK_HOURS} hours. If you did not ask for this, you can ignore this email.</p><p>Notion Creative Art</p>`,
      text: `You paid for patterns as a guest with this email. Open this link while signed in to add them to your account:\n${link}\n\nThe link works for ${LINK_HOURS} hours. If you did not ask for this, ignore this email.\n\nNotion Creative Art`,
    })
    if (!sent.ok) {
      console.error('claim-guest-orders: email failed', sent.error)
      return reply(req, 500, { error: 'We could not send the email. Please try again.' })
    }
    return reply(req, 200, { sent: true })
  } catch (err) {
    console.error('claim-guest-orders error:', err)
    return reply(req, 500, { error: 'Internal error' })
  }
})
