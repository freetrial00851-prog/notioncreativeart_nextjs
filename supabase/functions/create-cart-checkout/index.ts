// Supabase Edge Function: create-cart-checkout
// Deploy: Supabase Dashboard → Edge Functions → New function → paste this file → name it "create-cart-checkout"
// Required secret (Dashboard → Edge Functions → create-cart-checkout → Secrets):
//   LEMON_API_KEY — from Lemon Squeezy → Settings → API → create an API key
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-provided by Supabase.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const LEMON_API_KEY = Deno.env.get('LEMON_API_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const { productIds, userId, email, name: customerName, billingCountry, billingState, billingZip } = await req.json()
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No products in cart' }), { status: 400, headers: corsHeaders })
    }

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, price, images, lemon_numeric_variant_id, checkout_mode')
      .in('id', productIds)
      .eq('active', true)

    if (productsError || !products || products.length === 0) {
      return new Response(JSON.stringify({ error: 'Could not load cart products' }), { status: 400, headers: corsHeaders })
    }

    const firstNumericId = products[0].lemon_numeric_variant_id
    const missing = products.filter((p) => !p.lemon_numeric_variant_id)
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: `Missing Lemon Squeezy numeric variant ID for: ${missing.map((p) => p.title).join(', ')}` }),
        { status: 400, headers: corsHeaders },
      )
    }

    const totalCents = Math.round(products.reduce((sum, p) => sum + Number(p.price), 0) * 100)
    const name = products.length === 1
      ? products[0].title
      : `${products.length} patterns — Notion Creative Art`
    // Lemon Squeezy's checkout has no true multi-line-item concept (one variant, one
    // name/description per checkout — confirmed via their own API docs and their still-open
    // "Cart (multiple products)" feature request). This is the closest we can get: a readable
    // itemized breakdown in the description, and every item's photo in the media carousel
    // (instead of just the first product's image).
    const description = products.map((p) => `${p.title} — $${Number(p.price).toFixed(2)}`).join('\n')
    const media = products.flatMap((p) => (p.images ?? []).slice(0, 1)).slice(0, 8)

    const lsHeaders = { Authorization: `Bearer ${LEMON_API_KEY}`, Accept: 'application/vnd.api+json' }

    // The stored number might be a variant ID or a product ID (both appear in Lemon Squeezy
    // dashboard URLs and are easy to mix up) — try it as a variant first, and if that doesn't
    // resolve, treat it as a product ID and use that product's first variant instead.
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
      return new Response(JSON.stringify({ error: 'Could not resolve store/variant from Lemon Squeezy — check the numeric variant ID on this product.' }), { status: 500, headers: corsHeaders })
    }

    const isHosted = products.some((p) => p.checkout_mode === 'hosted')

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
            product_options: { name, description, media, redirect_url: 'https://notioncreativeart.com/order-success' },
            checkout_options: { embed: !isHosted, desc: true },
            checkout_data: {
              email,
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
      return new Response(JSON.stringify({ error: 'Checkout creation failed' }), { status: 500, headers: corsHeaders })
    }

    const created = await createRes.json()
    return new Response(JSON.stringify({ url: created.data.attributes.url, hosted: isHosted }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('create-cart-checkout error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders })
  }
})
