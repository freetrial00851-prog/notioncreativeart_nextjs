import { buildMetadata, SEO_KEYWORDS } from '@/lib/seo'
import { Home } from '@/views/Home'
import { getHomeCatalogServer } from '@/lib/data/home'
import { mergeLayout } from '@/lib/defaultLayout'

/**
 * ISR homepage — catalog is server-fetched and CDN-cached for 60s.
 * Soft navigations stay fast via the client homeCatalogCache module
 * (checked first in Home.tsx); do not call headers() here or the route
 * becomes fully dynamic and defeats revalidate.
 */
export const revalidate = 60

export const metadata = buildMetadata({
  title: 'Notion Creative Art',
  description:
    'Considered crochet patterns, delivered as instant PDF downloads. Shop amigurumi, wearables, home decor, beginner-friendly designs, and free crochet patterns from a small studio that tests every design twice.',
  path: '/',
  keywords: [
    ...SEO_KEYWORDS,
    'crochet patterns online shop',
    'buy crochet patterns online',
    'crochet amigurumi patterns PDF',
  ],
})

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
