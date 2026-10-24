import { jsonLdString } from '@/lib/jsonLd'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildBreadcrumbListJsonLd, buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo'
import { getCategoryBySlug } from '@/lib/data/products'
import {
  resolveShopPageTitle,
  shopTitleFiltersFromSearchParams,
  virtualShopCategoryTitle,
} from '@/lib/shopTitle'
import { Shop } from '@/views/Shop'
import { getShopSeed, getCategoryIntro } from '@/lib/data/products'

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
  accessories: {
    title: 'Crochet Accessory Patterns',
    description:
      'Crochet PDF patterns for bags, charms, keychains and small gifts. Quick makes with instant download and US-term instructions.',
  },
  'baby-kids': {
    title: 'Baby & Kids Crochet Patterns',
    description:
      'Crochet PDF patterns for baby gifts, nursery toys and kids. Instant download with US-term instructions.',
  },
  holiday: {
    title: 'Holiday Crochet Patterns',
    description:
      'Crochet PDF patterns for Halloween, Christmas, Easter and more. Festive amigurumi and decor with instant download.',
  },
  seasonal: {
    title: 'Seasonal Crochet Patterns',
    description:
      'Seasonal crochet PDF patterns for every time of year. Instant download with US-term instructions.',
  },
  'kitchen-storage': {
    title: 'Kitchen & Storage Crochet Patterns',
    description:
      'Crochet PDF patterns for baskets, coasters and storage. Practical makes with instant download.',
  },
  'tools-guides': {
    title: 'Crochet Guides & Tools',
    description:
      'Crochet guides, stitch references and tools to pair with our patterns. Instant PDF download.',
  },
  'no-sew-amigurumi': {
    title: 'No-Sew Amigurumi Patterns',
    description:
      'Browse no-sew amigurumi patterns worked in one continuous piece. Quick PDF downloads from Notion Creative Art for keychains, charms, and gifts.',
  },
}

function categoryListingCopy(categorySlug: string, label: string) {
  const override = CATEGORY_META_OVERRIDES[categorySlug]
  return {
    title: override?.title ?? `${label} Crochet Patterns`,
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
  const seed = Object.keys(sp).length === 0 ? await getShopSeed(categorySlug) : null
  const intro = Object.keys(sp).length === 0 ? await getCategoryIntro(categorySlug) : null
  const virtual = virtualShopCategoryTitle(categorySlug)
  const category = virtual ? null : await getCategoryBySlug(categorySlug)
  // Unknown category slugs are real 404s (not an indexable empty shop page).
  if (!virtual && !category) notFound()
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }} />
      <Suspense fallback={<ShopLoading title={title} />}>
        <Shop initialTitle={title} initialCategoryName={category?.name ?? null} initialProducts={seed?.products} initialCategories={seed?.categories} introText={intro} />
      </Suspense>
    </>
  )
}
