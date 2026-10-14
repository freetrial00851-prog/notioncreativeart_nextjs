import type { Metadata } from 'next'
import { buildFaqPageJsonLd, buildItemListJsonLd, buildMetadata, SITE_URL } from '@/lib/seo'
import { Home } from '@/views/Home'
import { getHomeCatalogServer } from '@/lib/data/home'
import { mergeLayout } from '@/lib/defaultLayout'
import { getSiteSeoContext } from '@/lib/seoSettings'
import { isVercelProduction } from '@/lib/env'
import { HOME_FAQ } from '@/lib/homeFaq'

/**
 * ISR homepage — catalog is server-fetched and CDN-cached for 60s.
 * Soft navigations stay fast via the client homeCatalogCache module
 * (checked first in Home.tsx); do not call headers() here or the route
 * becomes fully dynamic and defeats revalidate.
 */
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const { seo, siteOgImage } = await getSiteSeoContext()
  return buildMetadata({
    title: seo.homepage_meta_title,
    description: seo.homepage_meta_description,
    path: '/',
    image: siteOgImage,
    exactTitle: true,
  })
}

export default async function HomePage() {
  const { snapshot, featuredError } = await getHomeCatalogServer()
  const featured = snapshot.trending.slice(0, 4)
  const faqJsonLd = buildFaqPageJsonLd(HOME_FAQ)
  const listJsonLd =
    featured.length > 0
      ? buildItemListJsonLd(
          featured.map((p) => ({
            name: p.title,
            url: `${SITE_URL}/pattern/${p.slug}`,
          })),
        )
      : null

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {listJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }} />
      )}
      <Home
        initialCatalog={snapshot}
        initialFeaturedError={featuredError}
        initialHero={snapshot.hero}
        initialLayout={snapshot.layout?.length ? snapshot.layout : mergeLayout([])}
        hideOwnerCopyPlaceholders={isVercelProduction()}
      />
    </>
  )
}
