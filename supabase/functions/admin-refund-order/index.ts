// Supabase Edge Function: admin-refund-order
// Deploy: Supabase Dashboard → Edge Functions → New function → paste this file → name it "admin-refund-order"
// Required secret: reuses LEMON_API_KEY (already set for create-cart-checkout — no new secret needed).
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-provided by Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const LEMON_API_KEY = Deno.env.get('LEMON_API_KEY')!

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
    if (!jwt) return new Response(JSON.stringify({ error: 'Not signed in' }), { status: 401, headers: jsonHeaders(req) })

    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Not signed in' }), { status: 401, headers: jsonHeaders(req) })
    }

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userData.user.id).single()
    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: jsonHeaders(req) })
    }

    const { orderId, revokeAccess } = await req.json()
    if (!orderId) return new Response(JSON.stringify({ error: 'Missing orderId' }), { status: 400, headers: jsonHeaders(req) })

    const { data: order, error: orderErr } = await supabase.from('orders').select('*').eq('id', orderId).single()
    if (orderErr || !order) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: jsonHeaders(req) })
    if (order.status === 'refunded') {
      return new Response(JSON.stringify({ error: 'Already refunded' }), { status: 400, headers: jsonHeaders(req) })
    }

    const lsRes = await fetch(`https://api.lemonsqueezy.com/v1/orders/${order.lemon_order_id}/refund`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${LEMON_API_KEY}`,
      },
      body: JSON.stringify({ data: { type: 'orders', id: order.lemon_order_id, attributes: {} } }),
    })

    if (!lsRes.ok) {
      const body = await lsRes.text()
      console.error('Lemon Squeezy refund failed:', lsRes.status, body)
      return new Response(
        JSON.stringify({
          error: `Lemon Squeezy declined the refund (${lsRes.status}). It may already be refunded there, or the order may be too old to refund automatically — check the order directly in Lemon Squeezy.`,
        }),
        { status: 502, headers: jsonHeaders(req) },
      )
    }

    await supabase.from('orders').update({ status: 'refunded' }).eq('id', orderId)

    if (revokeAccess) {
      await supabase.from('purchases').delete().eq('order_id', orderId)
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders(req) })
  } catch (err) {
    console.error('admin-refund-order error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders(req) })
  }
})
