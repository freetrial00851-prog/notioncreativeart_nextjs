import { jsonLdString } from '@/lib/jsonLd'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import {
  buildBreadcrumbListJsonLd,
  buildCollectionPageJsonLd,
  buildListingMetadata,
  listingPageFromParams,
} from '@/lib/seo'
import { Shop } from '@/views/Shop'
import { getShopSeed } from '@/lib/data/products'
import {
  resolveShopPageTitle,
  shopTitleFiltersFromSearchParams,
} from '@/lib/shopTitle'

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const SHOP_DESCRIPTION =
  'Browse all crochet PDF patterns from Notion Creative Art — amigurumi, wearables, home decor, bundles, and free patterns. Instant digital download.'

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return buildListingMetadata({
    title: 'Shop All Patterns',
    description: SHOP_DESCRIPTION,
    path: '/shop',
    searchParams: await searchParams,
  })
}

function ShopLoading({ title }: { title: string }) {
  return (
    <div className="max-w-site w-full mx-auto px-4 md:px-16 xl:px-24 2xl:px-32 py-14">
      <p className="font-display font-semibold text-3xl md:text-4xl leading-tight break-words mb-8">
        {title}
      </p>
      <p className="text-ink-soft text-sm">Loading…</p>
    </div>
  )
}

/** Shop index — all patterns, filterable via query params. */
export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams
  // Seed the page asked for (and every page before it) so ?page=N has real products in its HTML.
  const onlyPage = Object.keys(sp).every((k) => k === 'page')
  const seed = onlyPage ? await getShopSeed(undefined, 12, listingPageFromParams(sp)) : null
  const title = resolveShopPageTitle(shopTitleFiltersFromSearchParams(sp))
  const collectionJsonLd = buildCollectionPageJsonLd({
    name: 'Crochet PDF patterns',
    description: SHOP_DESCRIPTION,
    path: '/shop',
  })
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }} />
      <Suspense fallback={<ShopLoading title={title} />}>
        <Shop initialTitle={title} initialProducts={seed?.products} initialCategories={seed?.categories} initialTotal={seed?.total} />
      </Suspense>
    </>
  )
}
