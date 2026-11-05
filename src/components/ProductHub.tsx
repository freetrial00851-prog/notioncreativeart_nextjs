import Link from 'next/link'
import { jsonLdString } from '@/lib/jsonLd'
import { SITE_URL, buildBreadcrumbListJsonLd, buildCollectionPageJsonLd, buildItemListJsonLd } from '@/lib/seo'
import { getProductsByTerms } from '@/lib/data/products'
import { PatternCard } from '@/components/PatternCard'
import { PatternGrid } from '@/components/PatternGrid'
import { GuideBody } from '@/components/guides/GuideBody'
import type { Hub } from '@/content/pages/hubs'
import type { Product } from '@/lib/types'

const PER_GROUP = 40

/** A topic hub: short intro, then the real patterns grouped by theme, then explanatory text and FAQ. Server component. */
export async function ProductHub({ hub }: { hub: Hub }) {
  const results = await Promise.all(hub.groups.map((g) => getProductsByTerms(g.terms, 40)))

  // A pattern shows once on the page, in the first group it fits.
  const seen = new Set<string>()
  const groups = hub.groups
    .map((g, i) => {
      const items: Product[] = []
      let total = 0
      for (const p of results[i]) {
        if (seen.has(p.id)) continue
        total += 1
        if (items.length < PER_GROUP) items.push(p)
      }
      items.forEach((p) => seen.add(p.id))
      return { ...g, items, total }
    })
    .filter((g) => g.items.length > 0)

  const all = groups.flatMap((g) => g.items)
  const collectionJsonLd = buildCollectionPageJsonLd({ name: hub.h1, description: hub.description, path: hub.path })
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: hub.h1, path: hub.path },
  ])
  const itemListJsonLd = buildItemListJsonLd(all.slice(0, 24).map((p) => ({ name: p.title, url: `${SITE_URL}/pattern/${p.slug}` })))

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
          <span className="font-semibold text-ink">{hub.h1}</span>
        </nav>
        <h1 className="font-heading text-[clamp(32px,5vw,52px)] font-semibold leading-[1.12] tracking-[-0.01em] text-ink">{hub.h1}</h1>
        <p className="mt-4 max-w-[68ch] text-[15px] leading-[1.75] text-muted md:text-[16px]">{hub.lead}</p>
        <p className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[14px] font-semibold">
          {groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="inline-flex min-h-11 items-center text-primary hover:underline">
              {g.title}
            </a>
          ))}
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="max-w-site w-full mx-auto page-gutter py-8 scroll-mt-24">
          <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id={`${g.id}-title`} className="type-h2 text-ink">{g.title}</h2>
              <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-muted md:text-[15px]">{g.intro}</p>
            </div>
            <Link href={`/search?q=${encodeURIComponent(g.searchQ)}`} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[15px] font-bold text-primary hover:underline">
              See all <span aria-hidden>→</span>
            </Link>
          </div>
          <PatternGrid variant="shop">
            {g.items.map((p) => (
              <PatternCard key={p.id} product={p} />
            ))}
          </PatternGrid>
        </section>
      ))}

      <section aria-label={`About ${hub.h1}`} className="mt-8 border-t border-border bg-surface-warm">
        <div className="mx-auto max-w-[820px] page-gutter py-10 md:py-14">
          <GuideBody blocks={hub.body} />
          <div className="mt-10">
            <h2 className="pt-4 font-heading text-[26px] leading-tight text-ink md:text-[30px]">Frequently asked questions</h2>
            <dl className="mt-4 space-y-5 text-[15px] leading-relaxed md:text-[16px]">
              {hub.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold text-ink">{f.q}</dt>
                  <dd className="mt-1 text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  )
}
