import { headers } from 'next/headers'
import { buildMetadata, SEO_KEYWORDS } from '@/lib/seo'
import { Home } from '@/views/Home'
import { getHomeCatalogServer } from '@/lib/data/home'
import { mergeLayout } from '@/lib/defaultLayout'

/** Keep homepage SSR fresh enough that admin section toggles don't flash after save. */
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

/**
 * Homepage — full public catalog SSR on hard/document loads.
 * Soft navigations skip the catalog flight; Home seeds from homeCatalogCache
 * (or client-fetches) so logo→home feels instant when the cache is warm.
 */
export default async function HomePage() {
  const softNav = (await headers()).get('x-nca-soft-nav') === '1'

  if (softNav) {
    return <Home />
  }

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
