/** Shared Resend helpers for Edge Functions. */

export const RESEND_FROM = 'Notion Creative Art <orders@notioncreativeart.com>'

export async function sendResendEmail(opts: {
  to: string
  subject: string
  html: string
  text: string
  idempotencyKey?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
  if (opts.idempotencyKey) {
    headers['Idempotency-Key'] = opts.idempotencyKey
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    return { ok: false, error: `${res.status} ${errText}` }
  }
  return { ok: true }
}
