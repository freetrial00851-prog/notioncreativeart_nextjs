/**
 * Branded abandoned-cart reminder email (HTML + plain text).
 * Palette: navy #243B5A, sage #6F8760 — Playfair Display + Manrope.
 */

import { siteBaseUrl } from './orderConfirmationEmail.ts'

const NAVY = '#243B5A'
const SAGE = '#6F8760'
const CANVAS = '#F7F5F1'
const INK = '#1A1A1A'
const MUTED = '#5C5C5C'
const LINE = '#E4E1DB'

export type AbandonedCartItem = {
  title: string
  imageUrl?: string | null
  slug?: string | null
}

export type AbandonedCartEmailParams = {
  items: AbandonedCartItem[]
  cartUrl: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Derive thumb WebP URL from stored card URL (same convention as the Next.js app). */
export function thumbImageUrl(cardUrl: string | null | undefined): string | null {
  if (!cardUrl || typeof cardUrl !== 'string') return null
  if (cardUrl.includes('-card.webp')) return cardUrl.replace('-card.webp', '-thumb.webp')
  return cardUrl
}

function renderItemRow(item: AbandonedCartItem, siteUrl: string): string {
  const title = escapeHtml(item.title)
  const href = item.slug ? `${siteUrl}/pattern/${encodeURIComponent(item.slug)}` : ''
  const titleHtml = href
    ? `<a href="${escapeHtml(href)}" style="color:${INK};text-decoration:none;font-weight:600;">${title}</a>`
    : `<span style="font-weight:600;color:${INK};">${title}</span>`

  const img = item.imageUrl
    ? `<td width="56" style="padding:0 14px 0 0;vertical-align:middle;">
        <img src="${escapeHtml(item.imageUrl)}" alt="" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid ${LINE};" />
      </td>`
    : ''

  return `<tr>
    ${img}
    <td style="padding:10px 0;vertical-align:middle;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.45;">
      ${titleHtml}
    </td>
  </tr>`
}

export function buildAbandonedCartEmail(params: AbandonedCartEmailParams): {
  subject: string
  html: string
  text: string
} {
  const { items, cartUrl } = params
  const siteUrl = siteBaseUrl()
  const subject = 'Your patterns are waiting — Notion Creative Art'
  const itemRows = items.map((item) => renderItemRow(item, siteUrl)).join('')
  const itemText = items.map((item) => `• ${item.title}`).join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:${CANVAS};color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:${NAVY};padding:28px 32px;text-align:center;">
              <p style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:0.02em;color:#ffffff;">
                Notion Creative Art
              </p>
              <p style="margin:8px 0 0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);">
                Your cart
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:700;color:${NAVY};">
                Your patterns are waiting
              </h1>
              <p style="margin:0 0 24px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${MUTED};">
                You left some beautiful crochet patterns in your cart. They&apos;re still saved — pick up where you left off whenever you&apos;re ready.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};border:1px solid ${LINE};border-radius:12px;margin:0 0 28px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 14px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${SAGE};font-weight:700;">
                      In your cart
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${itemRows}
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td align="center" style="border-radius:10px;background:${SAGE};">
                    <a href="${escapeHtml(cartUrl)}" style="display:inline-block;padding:14px 28px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.04em;text-decoration:none;color:#ffffff;">
                      Return to cart
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.55;color:${MUTED};">
                Happy making,<br />
                <span style="color:${NAVY};font-weight:600;">Notion Creative Art</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 24px;border-top:1px solid ${LINE};text-align:center;">
              <p style="margin:0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.5;color:${MUTED};">
                You&apos;re receiving this because items remain in your account cart. We send at most one reminder per week.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = [
    'Notion Creative Art — Your patterns are waiting',
    '',
    'You left some crochet patterns in your cart. They\'re still saved — pick up where you left off.',
    '',
    'In your cart:',
    itemText,
    '',
    `Return to cart: ${cartUrl}`,
    '',
    'Happy making,',
    'Notion Creative Art',
  ].join('\n')

  return { subject, html, text }
}
