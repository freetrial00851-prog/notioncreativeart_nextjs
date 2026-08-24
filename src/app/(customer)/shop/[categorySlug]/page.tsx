import { Suspense } from 'react'
import type { Metadata } from 'next'
import { buildMetadata, SEO_KEYWORDS } from '@/lib/seo'
import { Shop } from '@/views/Shop'
import { getShopCatalogServer } from '@/lib/data/shop'
import { parseShopFilters } from '@/lib/shopCatalog'

/** Keep category shop pages in sync with catalog edits. */
export const revalidate = 60

type Props = {
  params: Promise<{ categorySlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Dynamic SEO metadata per shop category — critical for category landing pages. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params
  const label = categorySlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return buildMetadata({
    title: `${label} — Shop`,
    description: `Browse ${label.toLowerCase()} crochet PDF patterns from Notion Creative Art. Instant download, beginner to advanced skill levels.`,
    path: `/shop/${categorySlug}`,
    keywords: [...SEO_KEYWORDS, `${label.toLowerCase()} crochet patterns`, `crochet ${categorySlug} patterns PDF`],
  })
}

/** Category shop page — e.g. /shop/amigurumi, /shop/new, /shop/sale */
export default async function CategoryShopPage({ params, searchParams }: Props) {
  const { categorySlug } = await params
  const sp = await searchParams
  const filters = parseShopFilters(categorySlug, sp)
  const initialCatalog = await getShopCatalogServer(filters)

  return (
    <Suspense fallback={null}>
      <Shop initialCatalog={initialCatalog} />
    </Suspense>
  )
}
