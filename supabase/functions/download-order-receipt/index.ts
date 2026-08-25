// Supabase Edge Function: download-order-receipt
// JWT required — only the signed-in owner can download their receipt.
// Builds a PDF from orders + products + profile (same data the account pages show).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'https://esm.sh/pdf-lib@1.17.1'
import { corsHeadersFor, isOriginAllowed, jsonHeaders } from '../_shared/cors.ts'

const NAVY = rgb(31 / 255, 36 / 255, 156 / 255)
const INK = rgb(31 / 255, 41 / 255, 51 / 255)
const MUTED = rgb(91 / 255, 100 / 255, 114 / 255)
const LINE = rgb(231 / 255, 225 / 255, 216 / 255)
const CREAM = rgb(252 / 255, 251 / 255, 248 / 255)
const CORAL = rgb(214 / 255, 138 / 255, 62 / 255)

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

function ascii(value: string) {
  return value.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim()
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = ascii(text).split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next
    } else {
      if (line) lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function money(amount: number, currency: string) {
  const n = Number(amount)
  const formatted = Number.isFinite(n) ? n.toFixed(2) : '0.00'
  return currency.toUpperCase() === 'USD' ? `$${formatted}` : `${formatted} ${currency}`
}

async function buildPdf(opts: {
  orderNumber: string
  dateLabel: string
  customerName: string
  customerEmail: string
  currency: string
  total: number
  items: { title: string; price: number | null }[]
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 792])
  const helv = await doc.embedFont(StandardFonts.Helvetica)
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()
  const left = 48
  const right = width - 48

  page.drawRectangle({ x: 0, y: height - 88, width, height: 88, color: NAVY })
  page.drawRectangle({ x: left, y: height - 70, width: 28, height: 28, color: CREAM })
  page.drawText('N', {
    x: left + 7,
    y: height - 63,
    size: 16,
    font: helvBold,
    color: NAVY,
  })
  page.drawCircle({ x: left + 26, y: height - 46, size: 3.2, color: CORAL })
  page.drawText('Notion Creative Art', {
    x: left + 40,
    y: height - 58,
    size: 14,
    font: helvBold,
    color: CREAM,
  })
  page.drawText('RECEIPT', {
    x: right - helvBold.widthOfTextAtSize('RECEIPT', 12),
    y: height - 56,
    size: 12,
    font: helvBold,
    color: CREAM,
  })

  let y = height - 128
  page.drawText(`Order #${ascii(opts.orderNumber)}`, {
    x: left,
    y,
    size: 16,
    font: helvBold,
    color: INK,
  })
  y -= 18
  page.drawText(opts.dateLabel, { x: left, y, size: 10, font: helv, color: MUTED })

  y -= 36
  page.drawText('BILLED TO', { x: left, y, size: 8, font: helvBold, color: MUTED })
  y -= 16
  page.drawText(ascii(opts.customerName) || ascii(opts.customerEmail), {
    x: left,
    y,
    size: 11,
    font: helvBold,
    color: INK,
  })
  y -= 14
  page.drawText(ascii(opts.customerEmail), { x: left, y, size: 10, font: helv, color: MUTED })

  y -= 28
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1, color: LINE })
  y -= 18
  page.drawText('PATTERN', { x: left, y, size: 8, font: helvBold, color: MUTED })
  page.drawText('PRICE', {
    x: right - helvBold.widthOfTextAtSize('PRICE', 8),
    y,
    size: 8,
    font: helvBold,
    color: MUTED,
  })
  y -= 10
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.5, color: LINE })

  const titleWidth = 360
  for (const item of opts.items) {
    y -= 16
    const lines = wrap(helv, item.title, 10, titleWidth)
    const priceLabel = item.price == null ? '—' : money(item.price, opts.currency)
    page.drawText(priceLabel, {
      x: right - helv.widthOfTextAtSize(priceLabel, 10),
      y,
      size: 10,
      font: helv,
      color: INK,
    })
    page.drawText(lines[0], { x: left, y, size: 10, font: helv, color: INK })
    for (const extra of lines.slice(1)) {
      y -= 13
      page.drawText(extra, { x: left, y, size: 10, font: helv, color: INK })
    }
  }

  y -= 16
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 1, color: LINE })
  y -= 20
  page.drawText('Subtotal', { x: left, y, size: 10, font: helv, color: MUTED })
  const sub = money(opts.total, opts.currency)
  page.drawText(sub, {
    x: right - helv.widthOfTextAtSize(sub, 10),
    y,
    size: 10,
    font: helv,
    color: INK,
  })
  y -= 18
  page.drawText('Total', { x: left, y, size: 12, font: helvBold, color: INK })
  const tot = money(opts.total, opts.currency)
  page.drawText(tot, {
    x: right - helvBold.widthOfTextAtSize(tot, 12),
    y,
    size: 12,
    font: helvBold,
    color: NAVY,
  })

  y -= 32
  page.drawText('Paid via Lemon Squeezy', { x: left, y, size: 10, font: helv, color: MUTED })

  page.drawText('Digital crochet patterns  ·  No shipping required', {
    x: left,
    y: 56,
    size: 8,
    font: helv,
    color: MUTED,
  })
  page.drawText('notioncreativeartnextjs.vercel.app', {
    x: left,
    y: 42,
    size: 8,
    font: helv,
    color: MUTED,
  })

  return doc.save()
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
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Sign in to download your receipt.' }), {
        status: 401,
        headers: jsonHeaders(req),
      })
    }

    const { data: authData, error: authErr } = await supabase.auth.getUser(token)
    const user = authData?.user
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Sign in to download your receipt.' }), {
        status: 401,
        headers: jsonHeaders(req),
      })
    }

    const { orderId } = await req.json()
    if (!orderId || typeof orderId !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing order id.' }), { status: 400, headers: jsonHeaders(req) })
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, lemon_order_id, customer_email, amount, currency, product_ids, created_at, user_id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found.' }), { status: 404, headers: jsonHeaders(req) })
    }

    const productIds = (order.product_ids ?? []) as string[]
    let products: { id: string; title: string; price: number }[] = []
    if (productIds.length > 0) {
      const { data } = await supabase.from('products').select('id, title, price').in('id', productIds)
      products = (data ?? []) as { id: string; title: string; price: number }[]
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .maybeSingle()

    const customerName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
    const orderNumber = String(order.lemon_order_id || order.id.slice(0, 8))
    const items = productIds.map((id) => {
      const p = products.find((row) => row.id === id)
      return {
        title: p?.title ?? 'Pattern no longer available',
        price: p != null ? Number(p.price) : null,
      }
    })

    const pdfBytes = await buildPdf({
      orderNumber,
      dateLabel: new Date(order.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      customerName: customerName || order.customer_email,
      customerEmail: order.customer_email || user.email || '',
      currency: order.currency || 'USD',
      total: Number(order.amount),
      items,
    })

    const filename = `NCA-Receipt-${orderNumber.replace(/[^\w-]/g, '')}.pdf`
    let binary = ''
    const chunk = 8192
    for (let i = 0; i < pdfBytes.length; i += chunk) {
      binary += String.fromCharCode(...pdfBytes.subarray(i, i + chunk))
    }

    return new Response(JSON.stringify({ filename, pdfBase64: btoa(binary) }), {
      status: 200,
      headers: jsonHeaders(req),
    })
  } catch (err) {
    console.error('download-order-receipt error:', err)
    return new Response(JSON.stringify({ error: 'Could not generate receipt.' }), {
      status: 500,
      headers: jsonHeaders(req),
    })
  }
})
