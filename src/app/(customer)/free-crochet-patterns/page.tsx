import { Suspense } from 'react'
import type { Metadata } from 'next'
import { jsonLdString } from '@/lib/jsonLd'
import {
  SITE_URL,
  buildBreadcrumbListJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
  buildListingMetadata,
  listingPageFromParams,
} from '@/lib/seo'
import { getFreeSeed } from '@/lib/data/products'
import { Shop } from '@/views/Shop'

const PATH = '/free-crochet-patterns'
const TITLE = 'Free Crochet Patterns (PDF), Instant Download'
const DESCRIPTION =
  'Free crochet patterns you can download instantly as PDFs: amigurumi animals, keychains and more. No account or sign-up needed.'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return buildListingMetadata({ title: TITLE, description: DESCRIPTION, path: PATH, searchParams: await searchParams })
}

/** Rebuild every minute so new free patterns appear without a deploy. */
export const revalidate = 60

function ShopLoading() {
  return (
    <div className="max-w-site w-full mx-auto px-4 md:px-16 xl:px-24 2xl:px-32 py-14">
      <h1 className="font-display font-semibold text-3xl md:text-4xl leading-tight break-words mb-8">Free Crochet Patterns</h1>
      <p className="text-ink-soft text-sm">Loading…</p>
    </div>
  )
}

/** Dedicated, indexable landing page for "free crochet patterns" (replaces /shop?price=free). */
export default async function FreeCrochetPatternsPage({ searchParams }: Props) {
  const sp = await searchParams
  const seed = await getFreeSeed(Math.max(48, listingPageFromParams(sp) * 12))
  const total = seed?.total ?? 0

  const intro =
    `Every pattern on this page is a free PDF you can download right away, with no account and no sign-up. ` +
    (total > 0 ? `There are ${total} free crochet patterns here, ` : 'Our free crochet patterns are ') +
    `mostly amigurumi animals and small keychains, each with its materials list and skill level so you can pick one that suits you. ` +
    `Looking for something more detailed? Browse the full range of amigurumi patterns in the shop.`

  const collectionJsonLd = buildCollectionPageJsonLd({
    name: 'Free crochet patterns',
    description: DESCRIPTION,
    path: PATH,
  })
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Free Crochet Patterns', path: PATH },
  ])
  const itemListJsonLd = buildItemListJsonLd(
    (seed?.products ?? []).slice(0, 24).map((p) => ({ name: p.title, url: `${SITE_URL}/pattern/${p.slug}` })),
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }} />
      {itemListJsonLd.itemListElement.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(itemListJsonLd) }} />
      )}
      <Suspense fallback={<ShopLoading />}>
        <Shop
          initialTitle="Free Crochet Patterns"
          forcedPrice="free"
          initialProducts={seed?.products}
          initialCategories={seed?.categories}
          initialTotal={seed?.total}
          introText={intro}
        />
      </Suspense>
    </>
  )
}
