import { Suspense } from 'react'
import type { Metadata } from 'next'
import { buildMetadata, SEO_KEYWORDS } from '@/lib/seo'
import { Shop } from '@/views/Shop'

type Props = { params: Promise<{ categorySlug: string }> }

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

function ShopLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-8 py-32 text-center text-ink-soft text-sm">
      Loading…
    </div>
  )
}

/** Category shop page — e.g. /shop/amigurumi, /shop/new, /shop/sale */
export default function CategoryShopPage() {
  return (
    <Suspense fallback={<ShopLoading />}>
      <Shop />
    </Suspense>
  )
}
