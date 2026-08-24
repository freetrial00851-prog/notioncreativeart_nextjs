// Supabase Edge Function: chat-support
// Deploy: npx supabase functions deploy chat-support --project-ref anlsellghialszuuvipw
// Required secret: GROQ_API_KEY (console.groq.com)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-provided.
//
// Phase 1: FAQ answers (grounded in site FAQ/refund policy) + secure order
// lookup that requires BOTH lemon_order_id AND customer_email before minting
// signed PDF download URLs.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')

const MAX_PER_WINDOW = 40
const WINDOW_MINUTES = 60
const SIGNED_URL_TTL_SEC = 300

/** Grounded in src/views/Faq.tsx + RefundPolicy.tsx — do not invent policies. */
const SITE_KNOWLEDGE = `
You are the Notion Creative Art (NCA) support assistant for a small crochet PDF pattern shop.
Be warm, concise, and practical. Never invent policies, prices, or features that are not listed below.
If you are unsure, say so and suggest the Contact page.

OFFICIAL FAQ (source of truth):
Q: How does delivery work?
A: Every pattern is delivered as an instant PDF download. As soon as payment is confirmed, it's available in the customer's account under My Orders — no waiting, no shipping.

Q: What format are the patterns in?
A: PDF, formatted to print or read on a phone or tablet while you work. Each listing notes the page count.

Q: Do I need to create an account to buy a pattern?
A: Yes — an account (Google or email) links the purchase to downloads, so customers can always come back and re-download if they lose the file.

Q: Can I get a refund?
A: Because patterns are downloaded instantly, refunds aren't available once a file has been downloaded. If something has gone wrong with an order, the customer should reach out and NCA will sort it out.

Q: What if I can't find a pattern I downloaded?
A: Sign in and go to My Orders — every purchased pattern is listed there with a fresh download link, any time.

Q: I'm stuck on a stitch — can I ask for help?
A: Yes — use the Contact page and NCA will help however they can.

REFUND POLICY (source of truth):
- All patterns are digital products, delivered as an instant PDF download.
- Refunds cannot be offered once a pattern has been downloaded.
- If the customer has NOT yet downloaded and wants a refund, or something went wrong (failed payment, corrupted file, wrong pattern), they should use the Contact page within 14 days of purchase.
- Free ($0) patterns use Download Free on the product page — they are not purchased through Lemon Squeezy checkout.

ORDER / DOWNLOAD HELP:
- Customers can re-download from Account → My Orders / Downloads after signing in.
- This chat can also look up an order when the customer provides BOTH their order number AND the email used at checkout. Never claim you looked up an order with only one of those.
- When the system provides [ORDER_LOOKUP] context below, follow it exactly. Do not invent download links.
- Never reveal whether an order number exists if the email does not match. Use a generic "please double-check your order number and email" message.
- Do not ask for passwords, card numbers, or payment details.

HUMAN ESCALATION:
- Vague order problems ("issue with my order", "download problem") are in-scope: ask for BOTH order number AND checkout email. Do not escalate on the first such message.
- Only offer a human if the user explicitly asks for a person/agent, or AFTER you already asked for order details / answered from the FAQ and still cannot help.
- When you recommend that (or they already asked for a human), end your reply with the exact token [[OFFER_HUMAN]] on its own line. Never invent a phone number or ticket ID.
`.trim()

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }
type DownloadLink = { title: string; signedUrl: string; filename: string }

type LookupResult =
  | { kind: 'incomplete'; missing: ('order' | 'email')[] }
  | { kind: 'no_match' }
  | { kind: 'verified'; orderLabel: string; downloads: DownloadLink[] }
  | { kind: 'error' }

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
// Lemon order ids are numeric strings; also accept "#12345" / "order 12345"
const ORDER_RE = /(?:order\s*(?:number|no\.?|#)?\s*[:#-]?\s*|#)\s*(\d{4,})|\b(\d{6,})\b/i

function extractEmail(text: string): string | null {
  const m = text.match(EMAIL_RE)
  return m ? m[0].toLowerCase() : null
}

function extractOrderNumber(text: string): string | null {
  const m = text.match(ORDER_RE)
  if (!m) return null
  return (m[1] || m[2] || '').replace(/\D/g, '') || null
}

function conversationText(messages: ChatMessage[]): string {
  return messages.filter((m) => m.role === 'user').map((m) => m.content).join('\n')
}

async function rateLimitOk(ip: string): Promise<boolean> {
  const key = `chat-support:${ip}`
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('rate_limit_events')
    .select('id', { count: 'exact', head: true })
    .eq('key', key)
    .gte('created_at', windowStart)
  if ((count ?? 0) >= MAX_PER_WINDOW) return false
  await supabase.from('rate_limit_events').insert({ key })
  return true
}

async function lookupOrder(orderNumber: string, email: string): Promise<LookupResult> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, lemon_order_id, customer_email, status, product_ids')
    .eq('lemon_order_id', orderNumber)
    .ilike('customer_email', email)
    .maybeSingle()

  // Same opaque failure whether the order is missing or the email does not match.
  if (error || !order) return { kind: 'no_match' }
  if (order.status === 'refunded') return { kind: 'no_match' }

  const productIds = (order.product_ids ?? []) as string[]
  if (productIds.length === 0) return { kind: 'no_match' }

  const { data: products } = await supabase
    .from('products')
    .select('id, title')
    .in('id', productIds)

  const byId = new Map((products ?? []).map((p) => [p.id, p.title as string]))
  const downloads: DownloadLink[] = []

  for (const productId of productIds) {
    const title = byId.get(productId) ?? 'Pattern'
    const filename = `${title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.pdf`
    const { data, error: signErr } = await supabase.storage
      .from('patterns')
      .createSignedUrl(`${productId}.pdf`, SIGNED_URL_TTL_SEC, { download: filename })
    if (signErr || !data?.signedUrl) continue
    downloads.push({ title, signedUrl: data.signedUrl, filename })
  }

  if (downloads.length === 0) return { kind: 'error' }

  return {
    kind: 'verified',
    orderLabel: order.lemon_order_id,
    downloads,
  }
}

function lookupContext(result: LookupResult | null, orderNumber: string | null, email: string | null): string {
  if (!result) {
    return `[ORDER_LOOKUP]\nstatus: not_requested\nNote: If the user wants help finding a purchase/download, ask them for BOTH their order number AND the email used at checkout.`
  }
  if (result.kind === 'incomplete') {
    const need = result.missing.join(' and ')
    return `[ORDER_LOOKUP]\nstatus: incomplete\nHave order number: ${orderNumber ? 'yes' : 'no'}\nHave email: ${email ? 'yes' : 'no'}\nAsk politely for the missing ${need}. Do not attempt to invent download links.`
  }
  if (result.kind === 'no_match') {
    return `[ORDER_LOOKUP]\nstatus: no_match\nTell the user you couldn't verify that order with the details provided. Ask them to double-check the order number and the email used at checkout. Do NOT say whether the order number exists. Suggest signing in to Account → My Orders, or the Contact page if it still fails.`
  }
  if (result.kind === 'error') {
    return `[ORDER_LOOKUP]\nstatus: error\nThe order matched but download files could not be prepared. Apologize and suggest Account → Downloads or the Contact page.`
  }
  const names = result.downloads.map((d) => d.title).join('; ')
  return `[ORDER_LOOKUP]\nstatus: verified\norder: ${result.orderLabel}\npatterns: ${names}\nTell the user their order was verified and fresh download link(s) are ready in the chat (the UI will show download buttons). Links expire in a few minutes. Also mention they can always re-download from Account → My Orders while signed in.`
}

async function callGroq(messages: ChatMessage[]): Promise<string> {
  if (!GROQ_API_KEY) {
    return "Support chat isn't fully configured yet. Please use the Contact page, or try again shortly."
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // llama-3.1-8b-instant was decommissioned 16 Aug 2026 for free/dev tiers.
      model: 'openai/gpt-oss-20b',
      temperature: 0.3,
      max_tokens: 800,
      reasoning_effort: 'low',
      messages,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Groq error:', res.status, errText)
    return "I'm having trouble answering right now. Please try again in a moment, or use the Contact page."
  }

  const json = await res.json()
  const msg = json?.choices?.[0]?.message
  const reply = typeof msg?.content === 'string' && msg.content.trim()
    ? msg.content
    : typeof msg?.reasoning === 'string'
      ? msg.reasoning
      : null
  if (!reply) {
    return "I couldn't form a reply — please try again, or visit the FAQ / Contact pages."
  }
  return reply.trim()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!(await rateLimitOk(ip))) {
      return new Response(JSON.stringify({ error: 'Too many messages — please wait a bit and try again.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const incoming = Array.isArray(body?.messages) ? body.messages as ChatMessage[] : []
    const cleaned = incoming
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 2000) }))
      .filter((m) => m.content.length > 0)
      .slice(-12)

    if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== 'user') {
      return new Response(JSON.stringify({ error: 'Send a user message to continue.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const blob = conversationText(cleaned)
    const email = extractEmail(blob)
    const orderNumber = extractOrderNumber(blob)

    const lower = blob.toLowerCase()
    const wantsLookup =
      Boolean(orderNumber && email) ||
      lower.includes('resend') ||
      lower.includes('re-download') ||
      lower.includes('redownload') ||
      lower.includes('order number') ||
      lower.includes('order no') ||
      lower.includes('my order') ||
      lower.includes('the order') ||
      lower.includes('order issue') ||
      lower.includes('order/download') ||
      lower.includes('download issue') ||
      lower.includes('receipt') ||
      lower.includes('invoice') ||
      lower.includes('lost my download') ||
      lower.includes('lost my file') ||
      lower.includes('lost my order') ||
      lower.includes("can't download") ||
      lower.includes('cant download') ||
      lower.includes("can't access") ||
      lower.includes('need my download') ||
      lower.includes('need my order') ||
      lower.includes("where's my download") ||
      lower.includes('where is my download') ||
      lower.includes('look up my order') ||
      lower.includes('lookup my order') ||
      (/\border\b/.test(lower) && /\b(issue|problem|help|wrong|stuck|missing)\b/.test(lower))

    let lookup: LookupResult | null = null
    if (orderNumber && email) {
      // Both required — never look up by order number alone.
      lookup = await lookupOrder(orderNumber, email)
    } else if (wantsLookup) {
      const missing: ('order' | 'email')[] = []
      if (!orderNumber) missing.push('order')
      if (!email) missing.push('email')
      lookup = { kind: 'incomplete', missing }
    }

    const system: ChatMessage = {
      role: 'system',
      content: `${SITE_KNOWLEDGE}\n\n${lookupContext(lookup, orderNumber, email)}`,
    }

    const rawReply = await callGroq([system, ...cleaned])
    const userAskedHuman =
      /\b(talk to (a )?(human|person|agent)|human|agent|customer service|support)\b/i.test(
        cleaned[cleaned.length - 1].content,
      )
    const modelOffersHuman = /\[\[OFFER_HUMAN\]\]/i.test(rawReply)
    const reply = rawReply.replace(/\s*\[\[OFFER_HUMAN\]\]\s*/gi, '').trim()
    const downloads = lookup?.kind === 'verified' ? lookup.downloads : undefined

    return new Response(
      JSON.stringify({
        reply,
        downloads: downloads ?? null,
        offerHuman: userAskedHuman || modelOffersHuman,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    console.error('chat-support error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
