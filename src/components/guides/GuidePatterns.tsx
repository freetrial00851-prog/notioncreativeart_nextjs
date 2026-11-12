import Link from 'next/link'
import { PatternCard } from '@/components/PatternCard'
import { PatternGrid } from '@/components/PatternGrid'
import { getBeginnerSeed, getProductsByTerms } from '@/lib/data/products'
import { getGuidePicks } from '@/lib/guidePatterns'
import type { Product } from '@/lib/types'

const COUNT = 4

/** Real patterns under a guide, so the article leads somewhere. Server component; renders nothing if there are no patterns. */
export async function GuidePatterns({ slug, groupId }: { slug: string; groupId: string }) {
  const picks = getGuidePicks(slug, groupId)

  let items: Product[] = []
  if (picks.kind === 'terms' && picks.terms) {
    items = (await getProductsByTerms(picks.terms, COUNT * 3)).slice(0, COUNT)
  }
  let heading = picks.heading
  let blurb = picks.blurb
  if (items.length < 2) {
    const seed = await getBeginnerSeed(COUNT * 2)
    items = [...(seed?.free ?? []), ...(seed?.paid ?? [])].slice(0, COUNT)
    heading = 'Patterns to practice on'
    blurb = 'Easy patterns that show their skill level, with the free ones first.'
  }
  if (items.length === 0) return null

  return (
    <section aria-labelledby="guide-patterns-heading" className="mt-14">
      <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="guide-patterns-heading" className="type-h2 text-ink">{heading}</h2>
          <p className="mt-2 text-[15px] text-muted">{blurb}</p>
        </div>
        <Link href="/shop" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[15px] font-bold text-primary hover:underline">
          All patterns <span aria-hidden>→</span>
        </Link>
      </div>
      <PatternGrid variant="shop">
        {items.map((p) => (
          <PatternCard key={p.id} product={p} />
        ))}
      </PatternGrid>
    </section>
  )
}
