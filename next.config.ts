import type { NextConfig } from 'next'

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '*.supabase.co'

/**
 * Site-wide security headers (Next.js `headers()` — applied to all routes).
 * HSTS is left to Vercel (already set on the live edge); do not duplicate here.
 *
 * Framing: both X-Frame-Options: DENY (legacy) and CSP frame-ancestors 'none'
 * (modern). Prefer CSP for new browsers; XFO covers older ones.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next hydration + JSON-LD inline; GA gtag loader; Lemon.js overlay
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://assets.lemonsqueezy.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://notioncreativeart.com https://www.notioncreativeart.com https://images.unsplash.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com",
  // next/font self-hosts — no fonts.googleapis.com
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.lemonsqueezy.com",
  // Lemon checkout overlay (+ nested Stripe card iframe inside overlay)
  "frame-src https://*.lemonsqueezy.com https://lemonsqueezy.com https://js.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.lemonsqueezy.com",
  "object-src 'none'",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
]
  .join('; ')
  .replace(/\s+/g, ' ')
  .trim()

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
]

const nextConfig: NextConfig = {
  images: {
    // Origin storage sometimes sends Cache-Control: no-cache; keep optimized
    // /_next/image responses warm for a month so hero/product art isn't re-fetched every reload.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Next 16 defaults to [75] only — allowlist 85 for hero sharpness.
    qualities: [75, 85],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHost,
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'notioncreativeart.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
