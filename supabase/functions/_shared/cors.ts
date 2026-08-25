/** Allowed browser origins for Edge Functions (not lemon-webhook). */
const DEFAULT_ORIGINS = [
  'https://notioncreativeartnextjs.vercel.app',
  'https://notioncreativeart.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, '')
}

export function allowedOrigins(): string[] {
  const out = new Set(DEFAULT_ORIGINS.map(normalizeOrigin))
  const siteUrl = Deno.env.get('SITE_URL') ?? Deno.env.get('NEXT_PUBLIC_SITE_URL')
  if (siteUrl) out.add(normalizeOrigin(siteUrl))
  const extra = Deno.env.get('ALLOWED_ORIGINS')
  if (extra) {
    for (const o of extra.split(',')) {
      const trimmed = o.trim()
      if (trimmed) out.add(normalizeOrigin(trimmed))
    }
  }
  return [...out]
}

/** True when the request has no Origin (non-browser) or Origin is on the allow list. */
export function isOriginAllowed(req: Request): boolean {
  const origin = req.headers.get('Origin')
  if (!origin) return true
  return allowedOrigins().includes(normalizeOrigin(origin))
}

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin')
  const allowed = allowedOrigins()
  const match = origin && allowed.includes(normalizeOrigin(origin)) ? origin : null
  return {
    ...(match ? { 'Access-Control-Allow-Origin': match } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

export function jsonHeaders(req: Request): Record<string, string> {
  return { ...corsHeadersFor(req), 'Content-Type': 'application/json' }
}
