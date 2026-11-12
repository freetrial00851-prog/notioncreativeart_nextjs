import Link from 'next/link'
import type { Metadata } from 'next'
import { jsonLdString } from '@/lib/jsonLd'
import {
  SITE_URL,
  buildBreadcrumbListJsonLd,
  buildCollectionPageJsonLd,
  buildItemListJsonLd,
  buildMetadata,
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

/** Static on purpose: this page has no filters or pages, so it can be prerendered and its title and description sit in the HTML head. */
export const metadata: Metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: PATH })

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

      <div className="max-w-site w-full mx-auto page-gutter pt-8 pb-8 md:pt-12 md:pb-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-muted">
          <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>›</span>{' '}
          <Link href="/shop" className="hover:text-ink">Shop</Link> <span aria-hidden>›</span>{' '}
          <span className="font-semibold text-ink">Crochet Patterns for Beginners</span>
        </nav>
        <div className="grid items-start gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-primary">Start here</p>
            <h1 className="mt-3 font-heading text-[clamp(34px,5vw,56px)] font-semibold leading-[1.1] tracking-[-0.01em] text-ink">
              Crochet Patterns for Beginners
            </h1>
            <p className="mt-5 max-w-[56ch] text-[16px] leading-[1.7] text-ink/80 md:text-[17px]">
              New to crochet? These patterns are marked beginner level. Each one has a materials list, clear stitch counts and a PDF you can download straight away, with no account needed.
            </p>
            <p className="mt-3 max-w-[56ch] text-[15px] leading-[1.7] text-muted">
              The free ones come first, so you can try a style before you buy. Unsure how to read a pattern? Our{' '}
              <Link href="/guides/how-to-read-a-crochet-pattern" className="text-primary underline underline-offset-4">beginner guide</Link> explains it step by step.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {free.length > 0 && (
                <a href="#free-beginner-patterns" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-navy px-6 text-[15px] font-bold text-white transition-colors hover:bg-violet">
                  See free patterns
                </a>
              )}
              {paid.length > 0 && (
                <a href="#more-beginner-patterns" className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-ink px-6 text-[15px] font-bold text-ink transition-colors hover:bg-ink hover:text-white">
                  More beginner patterns
                </a>
              )}
            </div>
          </div>

          <aside aria-label="What you get" className="rounded-xl border border-border bg-surface-warm p-6 md:p-7">
            {freeTotal + paidTotal > 0 && (
              <dl className="grid grid-cols-2 divide-x divide-border border-b border-border pb-5">
                <div className="pr-5">
                  <dt className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-muted">Free patterns</dt>
                  <dd className="mt-1 font-heading text-[40px] font-semibold leading-none text-ink">{freeTotal}</dd>
                </div>
                <div className="pl-5">
                  <dt className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-muted">Paid patterns</dt>
                  <dd className="mt-1 font-heading text-[40px] font-semibold leading-none text-ink">{paidTotal}</dd>
                </div>
              </dl>
            )}
            <ul className="mt-5 space-y-3 text-[15px] leading-snug text-ink">
              {[
                'Skill level shown on every pattern',
                'Materials list before you buy',
                'Instant PDF download',
                'Free patterns need no account',
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <svg aria-hidden viewBox="0 0 20 20" className="mt-[3px] size-4 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10.5l4 4 8-9" />
                  </svg>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-border pt-4 text-[14px] text-muted">
              New to the hook?{' '}
              <Link href="/guides/how-to-crochet-for-beginners" className="font-semibold text-primary hover:underline">How to crochet for beginners</Link>
            </p>
          </aside>
        </div>
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
