// Supabase Edge Function: create-paddle-checkout
// Creates a Paddle transaction on the SERVER (prices come from our database + Paddle price ids,
// never from the browser) and returns its id. The browser then opens it as an inline checkout.
//
// Deploy with JWT verification ON (signed-in buyers only for now; guest checkout is a later step).
// Secrets (Dashboard → Edge Functions → Secrets):
//   PADDLE_API_KEY — server API key for the matching Paddle account (sandbox key while testing)
//   PADDLE_ENV     — 'sandbox' (default) or 'live'
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-provided.
//
// While PADDLE_ENV = 'sandbox', ONLY admin accounts may create Paddle checkouts, so real customers
// never reach a test checkout. Everyone else gets code 'paddle_unavailable' and the site falls back
// to Lemon Squeezy for that product.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const PADDLE_API_KEY = Deno.env.get('PADDLE_API_KEY') ?? ''
const PADDLE_ENV = (Deno.env.get('PADDLE_ENV') ?? 'sandbox') === 'live' ? 'live' : 'sandbox'
const PADDLE_API = PADDLE_ENV === 'live' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com'

function reply(req: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders(req) })
}

const UNAVAILABLE = { error: 'Paddle checkout is not available for this item yet.', code: 'paddle_unavailable' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeadersFor(req) })
  if (req.method !== 'POST') return reply(req, 405, { error: 'Method not allowed' })
  if (!isOriginAllowed(req)) return reply(req, 403, { error: 'Origin not allowed' })

  try {
    if (!PADDLE_API_KEY) return reply(req, 503, UNAVAILABLE)

    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
    if (!jwt) return reply(req, 401, { error: 'Sign in to checkout.' })
    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
    if (userErr || !userData?.user) return reply(req, 401, { error: 'Sign in to checkout.' })
    const userId = userData.user.id

    if (PADDLE_ENV === 'sandbox') {
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userId).maybeSingle()
      if (!profile?.is_admin) return reply(req, 403, UNAVAILABLE)
    }

    const { productIds } = await req.json()
    if (!Array.isArray(productIds) || productIds.length === 0 || productIds.length > 25 ||
        !productIds.every((id) => typeof id === 'string')) {
      return reply(req, 400, { error: 'No products in cart' })
    }

    const priceCol = PADDLE_ENV === 'live' ? 'paddle_price_id' : 'paddle_price_id_sandbox'
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`id, title, price, checkout_provider, ${priceCol}`)
      .in('id', productIds)
      .eq('active', true)
      .is('deleted_at', null)
    if (productsError || !products || products.length !== new Set(productIds).size) {
      return reply(req, 400, { error: 'Could not load cart products' })
    }

    if (products.some((p) => Number(p.price) === 0)) {
      return reply(req, 400, { error: 'Free patterns can’t be checked out. Use Download Free on the product page.' })
    }
    // Every item must be a Paddle product with a price id for this environment.
    if (products.some((p) => p.checkout_provider !== 'paddle' || !(p as Record<string, unknown>)[priceCol])) {
      return reply(req, 400, UNAVAILABLE)
    }

    const res = await fetch(`${PADDLE_API}/transactions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${PADDLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: products.map((p) => ({ price_id: (p as Record<string, unknown>)[priceCol], quantity: 1 })),
        collection_mode: 'automatic',
        // Set here on the server so the webhook can trust who bought what.
        custom_data: { user_id: userId, product_ids: JSON.stringify(products.map((p) => p.id)) },
      }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.data?.id) {
      console.error('create-paddle-checkout: Paddle rejected the transaction', res.status, JSON.stringify(json?.error ?? json))
      return reply(req, 502, { error: 'Couldn’t start checkout — please try again in a moment.' })
    }

    return reply(req, 200, { transactionId: json.data.id, environment: PADDLE_ENV })
  } catch (err) {
    console.error('create-paddle-checkout error:', err)
    return reply(req, 500, { error: 'Internal error' })
  }
})
