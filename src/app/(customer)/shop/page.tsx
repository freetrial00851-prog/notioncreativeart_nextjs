import { Suspense } from 'react'
import { buildMetadata } from '@/lib/seo'
import { Shop } from '@/views/Shop'
import {
  resolveShopPageTitle,
  shopTitleFiltersFromSearchParams,
} from '@/lib/shopTitle'

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata = buildMetadata({
  title: 'Shop All Patterns',
  description:
    'Browse all crochet PDF patterns from Notion Creative Art — amigurumi, wearables, home decor, bundles, and free patterns. Instant digital download.',
  path: '/shop',
})

function ShopLoading({ title }: { title: string }) {
  return (
    <div className="max-w-site w-full mx-auto px-6 md:px-16 xl:px-24 2xl:px-32 py-14">
      <h1 className="font-display font-semibold text-3xl md:text-4xl leading-tight break-words mb-8">
        {title}
      </h1>
      <p className="text-ink-soft text-sm">Loading…</p>
    </div>
  )
}

/** Shop index — all patterns, filterable via query params. */
export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams
  const title = resolveShopPageTitle(shopTitleFiltersFromSearchParams(sp))
  return (
    <Suspense fallback={<ShopLoading title={title} />}>
      <Shop initialTitle={title} />
    </Suspense>
  )
}
