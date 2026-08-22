import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { Providers } from '@/components/Providers'
import { buildMetadata, SEO_KEYWORDS, buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/seo'

/** Root metadata — applies site-wide defaults; individual pages override via generateMetadata. */
export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Notion Creative Art',
    description:
      'Considered crochet patterns, delivered as instant PDF downloads. Shop amigurumi, wearables, home decor, and free crochet patterns from a small studio that tests every design.',
    path: '/',
    keywords: [...SEO_KEYWORDS],
  }),
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://notioncreativeart.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = buildOrganizationJsonLd()
  const siteJsonLd = buildWebSiteJsonLd()

  return (
    <html lang="en">
      <head>
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
      <body>
        <Providers>{children}</Providers>
        {/* Lemon Squeezy checkout overlay — loaded once, deferred */}
        <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
