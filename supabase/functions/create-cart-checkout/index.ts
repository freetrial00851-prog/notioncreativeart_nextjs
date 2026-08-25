// Supabase Edge Function: create-cart-checkout
// Deploy: Supabase Dashboard → Edge Functions → New function → paste this file → name it "create-cart-checkout"
// Required secret (Dashboard → Edge Functions → create-cart-checkout → Secrets):
//   LEMON_API_KEY — from Lemon Squeezy → Settings → API → create an API key
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
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Sign in to checkout.' }), { status: 401, headers: jsonHeaders(req) })
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser(jwt)
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Sign in to checkout.' }), { status: 401, headers: jsonHeaders(req) })
    }
    const userId = userData.user.id

    const { productIds, email, name: customerName, billingCountry, billingState, billingZip } = await req.json()
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No products in cart' }), { status: 400, headers: jsonHeaders(req) })
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, price, images, lemon_numeric_variant_id, checkout_mode')
      .in('id', productIds)
      .eq('active', true)

    if (productsError || !products || products.length === 0) {
      return new Response(JSON.stringify({ error: 'Could not load cart products' }), { status: 400, headers: jsonHeaders(req) })
    }

    const free = products.filter((p) => Number(p.price) === 0)
    if (free.length > 0) {
      return new Response(
        JSON.stringify({
          error: `Free patterns can’t be checked out (${free.map((p) => p.title).join(', ')}). Use Download Free on the product page instead.`,
        }),
        { status: 400, headers: jsonHeaders(req) },
      )
    }

    const firstNumericId = products[0].lemon_numeric_variant_id
    const missing = products.filter((p) => !p.lemon_numeric_variant_id)
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: `Missing Lemon Squeezy numeric variant ID for: ${missing.map((p) => p.title).join(', ')}` }),
        { status: 400, headers: jsonHeaders(req) },
      )
    }

    const totalCents = Math.round(products.reduce((sum, p) => sum + Number(p.price), 0) * 100)
    const name = products.length === 1
      ? products[0].title
      : `${products.length} patterns — Notion Creative Art`
    const description = products.map((p) => `${p.title} — $${Number(p.price).toFixed(2)}`).join('\n')
    const media = products.flatMap((p) => (p.images ?? []).slice(0, 1)).slice(0, 8)

    const lsHeaders = { Authorization: `Bearer ${LEMON_API_KEY}`, Accept: 'application/vnd.api+json' }

    let storeId: number | string | undefined
    let variantId: number | string | undefined

    const variantRes = await fetch(`https://api.lemonsqueezy.com/v1/variants/${firstNumericId}`, { headers: lsHeaders })
    if (variantRes.ok) {
      const variantJson = await variantRes.json()
      variantId = variantJson.data.id
      const productRes = await fetch(`https://api.lemonsqueezy.com/v1/products/${variantJson.data.attributes.product_id}`, { headers: lsHeaders })
      if (productRes.ok) storeId = (await productRes.json()).data.attributes.store_id
    } else {
      const productRes = await fetch(`https://api.lemonsqueezy.com/v1/products/${firstNumericId}?include=variants`, { headers: lsHeaders })
      if (productRes.ok) {
        const productJson = await productRes.json()
        storeId = productJson.data.attributes.store_id
        variantId = productJson.included?.[0]?.id
      }
    }

    if (!storeId || !variantId) {
      return new Response(JSON.stringify({ error: 'Could not resolve store/variant from Lemon Squeezy — check the numeric variant ID on this product.' }), { status: 500, headers: jsonHeaders(req) })
    }

    const isHosted = products.some((p) => p.checkout_mode === 'hosted')
    const checkoutEmail = typeof email === 'string' && email.trim() ? email.trim() : userData.user.email ?? undefined

    const createRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LEMON_API_KEY}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            custom_price: totalCents,
            product_options: {
              name,
              description,
              media,
              redirect_url: 'https://notioncreativeartnextjs.vercel.app/order-success',
              receipt_link_url: 'https://notioncreativeartnextjs.vercel.app/order-success',
              receipt_button_text: 'View your order',
            },
            checkout_options: { embed: !isHosted, desc: true },
            checkout_data: {
              email: checkoutEmail,
              name: customerName,
              billing_address: (billingCountry || billingState || billingZip) ? { country: billingCountry || undefined, state: billingState || undefined, zip: billingZip || undefined } : undefined,
              custom: {
                user_id: userId,
                product_ids: JSON.stringify(products.map((p) => p.id)),
              },
            },
          },
          relationships: {
            store: { data: { type: 'stores', id: String(storeId) } },
            variant: { data: { type: 'variants', id: String(variantId) } },
          },
        },
      }),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      console.error('Lemon Squeezy checkout creation failed:', errText)
      return new Response(JSON.stringify({ error: 'Checkout creation failed' }), { status: 500, headers: jsonHeaders(req) })
    }

    const created = await createRes.json()
    return new Response(JSON.stringify({ url: created.data.attributes.url, hosted: isHosted }), {
      status: 200,
      headers: jsonHeaders(req),
    })
  } catch (err) {
    console.error('create-cart-checkout error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders(req) })
  }
})
