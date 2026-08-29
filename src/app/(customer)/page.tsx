import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { Home } from '@/views/Home'
import { getHomeCatalogServer } from '@/lib/data/home'
import { mergeLayout } from '@/lib/defaultLayout'
import { getSiteSeoContext } from '@/lib/seoSettings'

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
  return (
    <Home
      initialCatalog={snapshot}
      initialFeaturedError={featuredError}
      initialHero={snapshot.hero}
      initialLayout={snapshot.layout?.length ? snapshot.layout : mergeLayout([])}
    />
  )
}
