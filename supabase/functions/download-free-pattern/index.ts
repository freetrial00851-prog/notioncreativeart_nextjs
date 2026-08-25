// Supabase Edge Function: download-free-pattern
// Deploy: Supabase Dashboard → Edge Functions → New function → paste this file → name it "download-free-pattern"
// No new secrets needed — SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-provided by Supabase.
//
// Generates a short-lived signed URL for a $0 product PDF. Anonymous visitors
// can't create signed URLs client-side because the patterns bucket requires
// ownership; this function verifies price === 0 server-side and uses the
// service-role key to mint the URL.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const MAX_PER_WINDOW = 20
const WINDOW_MINUTES = 60

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: jsonHeaders(req)For(req) })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders(req) })
  }
  if (!isOriginAllowed(req)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403, headers: jsonHeaders(req) })
  }

  try {
    const { productId } = await req.json()
    if (!productId || typeof productId !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing product id.' }), { status: 400, headers: jsonHeaders(req) })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const key = `free-download:${ip}`
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

    const { count } = await supabase
      .from('rate_limit_events')
      .select('id', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', windowStart)

    if ((count ?? 0) >= MAX_PER_WINDOW) {
      return new Response(JSON.stringify({ error: 'Too many download attempts — please try again in a bit.' }), {
        status: 429,
        headers: jsonHeaders(req),
      })
    }

    await supabase.from('rate_limit_events').insert({ key })

    const { data: product, error: productErr } = await supabase
      .from('products')
      .select('id, price, title, sold_out')
      .eq('id', productId)
      .maybeSingle()

    if (productErr || !product) {
      return new Response(JSON.stringify({ error: 'Pattern not found.' }), { status: 404, headers: jsonHeaders(req) })
    }
    if (product.sold_out) {
      return new Response(JSON.stringify({ error: 'This pattern is no longer available.' }), { status: 403, headers: jsonHeaders(req) })
    }
    if (Number(product.price) !== 0) {
      return new Response(JSON.stringify({ error: 'This pattern is not free.' }), { status: 403, headers: jsonHeaders(req) })
    }

    const filename = `${(product.title ?? 'pattern').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.pdf`
    const { data, error } = await supabase.storage
      .from('patterns')
      .createSignedUrl(`${productId}.pdf`, 60, { download: filename })

    if (error || !data?.signedUrl) {
      console.error('signed URL failed:', error)
      return new Response(JSON.stringify({ error: 'File not available yet.' }), { status: 404, headers: jsonHeaders(req) })
    }

    return new Response(JSON.stringify({ signedUrl: data.signedUrl, filename }), { status: 200, headers: jsonHeaders(req) })
  } catch (err) {
    console.error('download-free-pattern error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders(req) })
  }
})
