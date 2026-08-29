import { Suspense } from 'react'
import { buildMetadata } from '@/lib/seo'
import { Shop } from '@/views/Shop'

export const metadata = buildMetadata({
  title: 'Shop All Patterns',
  description:
    'Browse all crochet PDF patterns from Notion Creative Art — amigurumi, wearables, home decor, bundles, and free patterns. Instant digital download.',
  path: '/shop',
})

function ShopLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-32 text-center text-ink-soft text-sm">
      Loading…
    </div>
  )
}

/** Shop index — all patterns, filterable via query params. */
export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoading />}>
      <Shop />
    </Suspense>
  )
}
