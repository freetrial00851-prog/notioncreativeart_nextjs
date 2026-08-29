import type { Metadata, Viewport } from 'next'
import { Baloo_2, Manrope, Playfair_Display } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/Providers'
import { buildMetadata, SEO_KEYWORDS, SITE_URL, buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/seo'

/** Manrope — body, nav, UI. Self-hosted via next/font (no layout shift). */
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

/** Playfair Display — hero + section headings only. */
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

/** Baloo 2 — logo wordmark only (NCA / NotionCreativeArt). */
const baloo2 = Baloo_2({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-baloo-2',
  display: 'swap',
})

/** Critical for mobile — without this, browsers render at desktop width. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FCFBF8',
}

/** Root metadata — applies site-wide defaults; individual pages override via generateMetadata. */
export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Notion Creative Art',
    description:
      'Considered crochet patterns, delivered as instant PDF downloads. Shop amigurumi, wearables, home decor, and free crochet patterns from a small studio that tests every design.',
    path: '/',
    keywords: [...SEO_KEYWORDS],
  }),
  metadataBase: new URL(SITE_URL),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = buildOrganizationJsonLd()
  const siteJsonLd = buildWebSiteJsonLd()

  return (
    <html lang="en" className={`${manrope.variable} ${playfair.variable} ${baloo2.variable}`}>
      <head>
        {/* SVG favicon (public/) — raster + apple-touch icons auto-wired from src/app/ */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      <body className="font-body antialiased">
        <Providers>{children}</Providers>
        <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
