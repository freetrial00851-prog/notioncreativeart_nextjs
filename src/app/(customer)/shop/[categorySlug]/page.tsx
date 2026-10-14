import { Suspense } from 'react'
import type { Metadata } from 'next'
import { buildBreadcrumbListJsonLd, buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo'
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
  amigurumi: {
    title: 'Amigurumi Crochet Patterns',
    description:
      'Instant-download amigurumi crochet PDF patterns from Notion Creative Art. Toys, animals, and dolls — beginner to advanced.',
  },
  wearables: {
    title: 'Wearable Crochet Patterns',
    description:
      'Crochet PDF patterns for garments and accessories from Notion Creative Art. Instant download, tested for every skill level.',
  },
  'home-decor': {
    title: 'Home Decor Crochet Patterns',
    description:
      'Crochet PDF patterns for the home from Notion Creative Art. Cushions, blankets, and decor — instant download.',
  },
  bundles: {
    title: 'Crochet Pattern Bundles',
    description:
      'Save with crochet PDF pattern bundles from Notion Creative Art. Instant download, yours to keep.',
  },
  'no-sew-amigurumi': {
    title: 'No-Sew Amigurumi Patterns',
    description:
      'Browse no-sew amigurumi patterns worked in one continuous piece—quick PDF downloads from Notion Creative Art for keychains, charms, and gifts.',
  },
}

function categoryListingCopy(categorySlug: string, label: string) {
  const override = CATEGORY_META_OVERRIDES[categorySlug]
  return {
    title: override?.title ?? `${label} — Shop`,
    description:
      override?.description ??
      `Browse ${label.toLowerCase()} crochet PDF patterns from Notion Creative Art. Instant download, beginner to advanced skill levels.`,
  }
}

/** Dynamic SEO metadata per shop category — critical for category landing pages. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params
  const virtual = virtualShopCategoryTitle(categorySlug)
  const category = virtual ? null : await getCategoryBySlug(categorySlug)
  const label =
    virtual ??
    category?.name ??
    categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const copy = categoryListingCopy(categorySlug, label)

  return buildMetadata({
    title: copy.title,
    description: copy.description,
    path: `/shop/${categorySlug}`,
  })
}

function ShopLoading({ title }: { title: string }) {
  return (
    <div className="max-w-site w-full mx-auto px-4 md:px-16 xl:px-24 2xl:px-32 py-14">
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
  const label =
    virtual ??
    category?.name ??
    categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const copy = categoryListingCopy(categorySlug, label)
  const collectionJsonLd = buildCollectionPageJsonLd({
    name: copy.title,
    description: copy.description,
    path: `/shop/${categorySlug}`,
  })
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: label, path: `/shop/${categorySlug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Suspense fallback={<ShopLoading title={title} />}>
        <Shop initialTitle={title} initialCategoryName={category?.name ?? null} />
      </Suspense>
    </>
  )
}
