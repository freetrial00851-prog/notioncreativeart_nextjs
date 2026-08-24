import { Suspense } from 'react'
import { buildMetadata, SEO_KEYWORDS } from '@/lib/seo'
import { Shop } from '@/views/Shop'
import { getShopCatalogServer } from '@/lib/data/shop'
import { parseShopFilters } from '@/lib/shopCatalog'

/** Keep shop listings fresh enough that admin product changes appear without a full redeploy. */
export const revalidate = 60

export const metadata = buildMetadata({
  title: 'Shop All Patterns',
  description:
    'Browse all crochet PDF patterns from Notion Creative Art — amigurumi, wearables, home decor, bundles, and free patterns. Instant digital download.',
  path: '/shop',
  keywords: [...SEO_KEYWORDS, 'shop crochet patterns', 'crochet pattern catalog'],
})

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Shop index — all patterns; filters from query params are applied on the server. */
export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams
  const filters = parseShopFilters(null, sp)
  const initialCatalog = await getShopCatalogServer(filters)

  return (
    <Suspense fallback={null}>
      <Shop initialCatalog={initialCatalog} />
    </Suspense>
  )
}
