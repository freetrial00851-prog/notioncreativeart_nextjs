import { Suspense } from 'react'
import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { getCategoryBySlug } from '@/lib/data/products'
import {
  resolveShopPageTitle,
  shopTitleFiltersFromSearchParams,
  virtualShopCategoryTitle,
} from '@/lib/shopTitle'
import { Shop } from '@/views/Shop'

type Props = {
  params: Promise<{ categorySlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Per-slug SEO overrides when categories have no meta_* columns yet. */
const CATEGORY_META_OVERRIDES: Record<string, { title: string; description: string }> = {
  'no-sew-amigurumi': {
    title: 'No-Sew Amigurumi Patterns',
    description:
      'Browse no-sew amigurumi patterns worked in one continuous piece—quick PDF downloads from Notion Creative Art for keychains, charms, and gifts.',
  },
}

/** Dynamic SEO metadata per shop category — critical for category landing pages. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params
  const override = CATEGORY_META_OVERRIDES[categorySlug]
  if (override) {
    return buildMetadata({
      title: override.title,
      description: override.description,
      path: `/shop/${categorySlug}`,
    })
  }

  const virtual = virtualShopCategoryTitle(categorySlug)
  const category = virtual ? null : await getCategoryBySlug(categorySlug)
  const label =
    virtual ??
    category?.name ??
    categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return buildMetadata({
    title: `${label} — Shop`,
    description: `Browse ${label.toLowerCase()} crochet PDF patterns from Notion Creative Art. Instant download, beginner to advanced skill levels.`,
    path: `/shop/${categorySlug}`,
  })
}

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

/** Category shop page — e.g. /shop/amigurumi, /shop/new, /shop/sale */
export default async function CategoryShopPage({ params, searchParams }: Props) {
  const { categorySlug } = await params
  const sp = await searchParams
  const virtual = virtualShopCategoryTitle(categorySlug)
  const category = virtual ? null : await getCategoryBySlug(categorySlug)
  const title = resolveShopPageTitle({
    categorySlug,
    categoryName: category?.name ?? null,
    ...shopTitleFiltersFromSearchParams(sp),
  })

  return (
    <Suspense fallback={<ShopLoading title={title} />}>
      <Shop initialTitle={title} initialCategoryName={category?.name ?? null} />
    </Suspense>
  )
}
