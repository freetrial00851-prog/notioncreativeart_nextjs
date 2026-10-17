import type { Metadata, Viewport } from 'next'
import { Gelasio } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/Providers'
import { SITE_NAME, SITE_URL, buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/seo'
import { DEFAULT_HOMEPAGE_META_DESCRIPTION, getSiteSeoContext } from '@/lib/seoSettings'

/**
 * Gelasio — metric-compatible with Georgia, used for headings, the wordmark and
 * product names (`font-heading`). Matches the approved reference, which rendered Georgia.
 * Body/UI text uses the platform system font (no download, native optical sizing).
 */
const gelasio = Gelasio({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-gelasio',
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
    <html lang="en" className={gelasio.variable}>
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
