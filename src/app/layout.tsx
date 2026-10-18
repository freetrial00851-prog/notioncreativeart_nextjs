import type { Metadata, Viewport } from 'next'
import { Fraunces, Caveat } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/Providers'
import { SITE_NAME, SITE_URL, buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/seo'
import { DEFAULT_HOMEPAGE_META_DESCRIPTION, getSiteSeoContext } from '@/lib/seoSettings'

/**
 * Fraunces — a soft, slightly wonky "old-style" serif (Cooper/Recoleta family feel) for
 * headings, the wordmark and product names (`font-heading`). SOFT + WONK axes give the
 * rounded, hand-cut character; opsz tunes it for big vs small sizes.
 * Caveat — a neat handwritten face, used ONLY for tiny personal notes (`font-hand`).
 * Body/UI text uses the platform system font (no download, native optical sizing).
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})
const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-caveat',
  display: 'swap',
})

/** Critical for mobile — without this, browsers render at desktop width. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FFFFFF',
}

/** Site-wide metadata defaults — child pages override title, description, canonical, and image. */
export async function generateMetadata(): Promise<Metadata> {
  const { seo, siteOgImage } = await getSiteSeoContext()
  const description = seo.homepage_meta_description.trim() || DEFAULT_HOMEPAGE_META_DESCRIPTION

  const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    description,
    // Pinterest Business domain verification (site-wide)
    other: {
      'p:domain_verify': 'e8b985884176f6922bcdd25b8e3e06b0',
    },
  }

  if (siteOgImage) {
    metadata.openGraph = {
      images: [{ url: siteOgImage, width: 1200, height: 630, alt: SITE_NAME }],
    }
    metadata.twitter = {
      card: 'summary_large_image',
      images: [siteOgImage],
    }
  }

  return metadata
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = buildOrganizationJsonLd()
  const siteJsonLd = buildWebSiteJsonLd()

  return (
    <html lang="en" className={`${fraunces.variable} ${caveat.variable}`}>
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
