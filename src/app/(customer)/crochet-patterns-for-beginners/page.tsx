import Link from 'next/link'
import type { Metadata } from 'next'
import { jsonLdString } from '@/lib/jsonLd'
import {
  SITE_URL,
  buildBreadcrumbListJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
  buildListingMetadata,
} from '@/lib/seo'
import { getBeginnerSeed } from '@/lib/data/products'
import { PatternCard } from '@/components/PatternCard'
import { PatternGrid } from '@/components/PatternGrid'
import { GuideBody } from '@/components/guides/GuideBody'
import { CollapsibleContent } from '@/components/CollapsibleContent'
import { beginnersContent } from '@/content/pages/beginners'

const PATH = '/crochet-patterns-for-beginners'
const TITLE = 'Crochet Patterns for Beginners (Free and Paid PDFs)'
const DESCRIPTION =
  'Easy crochet patterns for beginners: free and paid amigurumi PDFs with materials lists and clear skill levels. Instant download, no account needed.'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return buildListingMetadata({ title: TITLE, description: DESCRIPTION, path: PATH, searchParams: await searchParams })
}

/** Rebuild every five minutes so new beginner patterns appear without a deploy. */
export const revalidate = 300

/** Dedicated, indexable landing page for "crochet patterns for beginners" (the ?level=beginner filter is not indexable). */
export default async function BeginnersHubPage() {
  const seed = await getBeginnerSeed(24)
  const free = seed?.free ?? []
  const paid = seed?.paid ?? []
  const freeTotal = seed?.freeTotal ?? 0
  const paidTotal = seed?.paidTotal ?? 0

  const collectionJsonLd = buildCollectionPageJsonLd({ name: 'Crochet patterns for beginners', description: DESCRIPTION, path: PATH })
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Crochet Patterns for Beginners', path: PATH },
  ])
  const itemListJsonLd = buildItemListJsonLd([...free, ...paid].slice(0, 24).map((p) => ({ name: p.title, url: `${SITE_URL}/pattern/${p.slug}` })))

  const firstParagraphIndex = beginnersContent.body.findIndex((b) => b.type === 'p')
  const cut = firstParagraphIndex === -1 ? beginnersContent.body.length : firstParagraphIndex + 1
  const intro = beginnersContent.body.slice(0, cut)
  const more = beginnersContent.body.slice(cut)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }} />
      {itemListJsonLd.itemListElement.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(itemListJsonLd) }} />
      )}

      <div className="max-w-site w-full mx-auto page-gutter pt-8 pb-6 md:pt-12">
        <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-muted">
          <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>›</span>{' '}
          <Link href="/shop" className="hover:text-ink">Shop</Link> <span aria-hidden>›</span>{' '}
          <span className="font-semibold text-ink">Crochet Patterns for Beginners</span>
        </nav>
        <h1 className="font-heading text-[clamp(34px,5vw,56px)] font-semibold leading-[1.12] tracking-[-0.01em] text-ink">
          Crochet Patterns for Beginners
        </h1>
        <p className="mt-4 max-w-[68ch] text-[15px] leading-[1.75] text-muted md:text-[16px]">
          New to crochet? Start here. These are the patterns marked beginner level, with the free ones first so you can try a style before you buy.
          {freeTotal + paidTotal > 0 ? ` There are ${freeTotal} free and ${paidTotal} paid beginner patterns, ` : ' '}
          each with a materials list and a PDF you can download straight away, with no account needed. Unsure how to read a pattern? Our{' '}
          <Link href="/guides/how-to-read-a-crochet-pattern" className="text-primary underline underline-offset-4">beginner guide</Link> explains it step by step.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-semibold">
          {free.length > 0 && <a href="#free-beginner-patterns" className="text-primary hover:underline">Free beginner patterns ↓</a>}
          {paid.length > 0 && <a href="#more-beginner-patterns" className="text-primary hover:underline">More beginner patterns ↓</a>}
        </p>
      </div>

      {free.length > 0 && (
        <section id="free-beginner-patterns" aria-labelledby="free-beginner-heading" className="max-w-site w-full mx-auto page-gutter py-8 scroll-mt-24">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 id="free-beginner-heading" className="type-h2 text-ink">Free crochet patterns for beginners</h2>
            <Link href="/free-crochet-patterns" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[15px] font-bold text-primary hover:underline">
              All free patterns <span aria-hidden>→</span>
            </Link>
          </div>
          <PatternGrid variant="shop">
            {free.map((p, i) => (
              <PatternCard key={p.id} product={p} priority={i < 4} />
            ))}
          </PatternGrid>
        </section>
      )}

      {paid.length > 0 && (
        <section id="more-beginner-patterns" aria-labelledby="more-beginner-heading" className="max-w-site w-full mx-auto page-gutter py-8 scroll-mt-24">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 id="more-beginner-heading" className="type-h2 text-ink">More beginner crochet patterns</h2>
            <Link href="/shop/amigurumi" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[15px] font-bold text-primary hover:underline">
              All amigurumi patterns <span aria-hidden>→</span>
            </Link>
          </div>
          <PatternGrid variant="shop">
            {paid.map((p) => (
              <PatternCard key={p.id} product={p} />
            ))}
          </PatternGrid>
        </section>
      )}

      <section aria-label="About crochet patterns for beginners" className="mt-8 border-t border-border bg-surface-warm">
        <div className="mx-auto max-w-[820px] page-gutter py-10 md:py-14">
          <GuideBody blocks={intro} />
          <CollapsibleContent>
            <div className="mt-5">
              <GuideBody blocks={more} />
              <div className="mt-10">
                <h2 className="pt-4 font-heading text-[26px] leading-tight text-ink md:text-[30px]">Frequently asked questions</h2>
                <dl className="mt-4 space-y-5 text-[15px] leading-relaxed md:text-[16px]">
                  {beginnersContent.faq.map((f) => (
                    <div key={f.q}>
                      <dt className="font-semibold text-ink">{f.q}</dt>
                      <dd className="mt-1 text-muted">{f.a}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </section>
    </>
  )
}
