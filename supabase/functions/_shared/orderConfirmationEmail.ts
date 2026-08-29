/**
 * Branded order confirmation + download-ready email (HTML + plain text).
 * Palette: navy #243B5A, sage #6F8760 — Playfair Display + Manrope.
 */

const NAVY = '#243B5A'
const SAGE = '#6F8760'
const CANVAS = '#F7F5F1'
const INK = '#1A1A1A'
const MUTED = '#5C5C5C'
const LINE = '#E4E1DB'

export type OrderConfirmationProduct = {
  title: string
  price?: number | null
}

export type OrderConfirmationParams = {
  customerEmail: string
  orderNumber: string
  amount: number
  currency: string
  products: OrderConfirmationProduct[]
  downloadsUrl: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  } catch {
    return `$${amount.toFixed(2)}`
  }
}

export function buildOrderConfirmationEmail(params: OrderConfirmationParams): {
  subject: string
  html: string
  text: string
} {
  const { orderNumber, amount, currency, products, downloadsUrl } = params
  const paid = formatMoney(amount, currency)
  const subject = `Your Notion Creative Art order #${orderNumber} is ready`
  const productLines = products.length
    ? products.map((p) => escapeHtml(p.title)).join('<br />')
    : 'Your crochet pattern(s)'
  const productText = products.length
    ? products.map((p) => `• ${p.title}`).join('\n')
    : '• Your crochet pattern(s)'

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
                Order confirmation
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:700;color:${NAVY};">
                Thank you for your purchase
              </h1>
              <p style="margin:0 0 24px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${MUTED};">
                Your payment went through and your pattern PDF${products.length === 1 ? ' is' : 's are'} ready to download anytime from your account.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};border:1px solid ${LINE};border-radius:12px;margin:0 0 28px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 14px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${SAGE};font-weight:700;">
                      Order summary
                    </p>
                    <p style="margin:0 0 6px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:14px;color:${MUTED};">
                      Order number
                    </p>
                    <p style="margin:0 0 16px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:${INK};">
                      #${escapeHtml(orderNumber)}
                    </p>
                    <p style="margin:0 0 6px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:14px;color:${MUTED};">
                      Pattern${products.length === 1 ? '' : 's'}
                    </p>
                    <p style="margin:0 0 16px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;font-weight:600;color:${INK};">
                      ${productLines}
                    </p>
                    <p style="margin:0 0 6px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:14px;color:${MUTED};">
                      Amount paid
                    </p>
                    <p style="margin:0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:${NAVY};">
                      ${escapeHtml(paid)}
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td align="center" style="border-radius:10px;background:${SAGE};">
                    <a href="${escapeHtml(downloadsUrl)}" style="display:inline-block;padding:14px 28px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.04em;text-decoration:none;color:#ffffff;">
                      Download your patterns
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.55;color:${MUTED};">
                Prefer the account menu? Open <strong style="color:${INK};">My Downloads</strong> after signing in — the same files are always there.
              </p>
              <p style="margin:0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.55;color:${MUTED};">
                Happy making,<br />
                <span style="color:${NAVY};font-weight:600;">Notion Creative Art</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 24px;border-top:1px solid ${LINE};text-align:center;">
              <p style="margin:0;font-family:Manrope,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.5;color:${MUTED};">
                Digital PDF patterns — instant access after purchase. No physical item ships.
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
    'Notion Creative Art — Order confirmation',
    '',
    'Thank you for your purchase.',
    '',
    `Order number: #${orderNumber}`,
    'Patterns:',
    productText,
    `Amount paid: ${paid}`,
    '',
    `Download your patterns: ${downloadsUrl}`,
    '',
    'Happy making,',
    'Notion Creative Art',
  ].join('\n')

  return { subject, html, text }
}

export function siteBaseUrl(): string {
  return (
    Deno.env.get('SITE_URL')?.replace(/\/$/, '') ||
    Deno.env.get('NEXT_PUBLIC_SITE_URL')?.replace(/\/$/, '') ||
    'https://notioncreativeart.com'
  )
}
