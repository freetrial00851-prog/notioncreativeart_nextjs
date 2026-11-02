import Link from 'next/link'
import { jsonLdString } from '@/lib/jsonLd'
import { buildBreadcrumbListJsonLd, buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo'
import { getAllGuides } from '@/lib/guides'
import { GUIDE_GROUPS, guideReadMinutes } from '@/lib/guideMeta'
import { GuidesBrowser, type BrowserGroup } from '@/components/guides/GuidesBrowser'
import { GuidePath } from '@/components/guides/GuidePath'

const DESCRIPTION =
  'Plain-English crochet guides: how to start, every basic stitch, amigurumi finishing, yarn and hook choices and care, to help you start and finish your next project.'

export const metadata = buildMetadata({
  title: 'Crochet Guides and Tutorials',
  description: DESCRIPTION,
  path: '/guides',
})

export default function GuidesIndexPage() {
  const guides = getAllGuides()
  const bySlug = new Map(guides.map((g) => [g.slug, g]))
  const used = new Set<string>()
  const card = (g: (typeof guides)[number]) => ({
    slug: g.slug,
    title: g.title,
    description: g.description,
    minutes: guideReadMinutes(g),
  })

  const groups: BrowserGroup[] = GUIDE_GROUPS.map((group) => {
    const items = group.slugs.map((s) => bySlug.get(s)).filter((g): g is (typeof guides)[number] => !!g)
    items.forEach((g) => used.add(g.slug))
    return { id: group.id, title: group.title, intro: group.intro, icon: group.icon, accent: group.accent, guides: items.map(card) }
  }).filter((g) => g.guides.length > 0)

  // A guide that is not in any section still shows up, so none is ever hidden by mistake.
  const rest = guides.filter((g) => !used.has(g.slug))
  if (rest.length > 0) {
    groups.push({ id: 'more-guides', title: 'More guides', intro: '', icon: 'sparkle', accent: '#4B5563', guides: rest.map(card) })
  }

  const collectionJsonLd = buildCollectionPageJsonLd({ name: 'Crochet guides', description: DESCRIPTION, path: '/guides' })
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/guides' },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }} />

      <header className="border-b border-border bg-surface-warm">
        <div className="mx-auto grid max-w-site gap-10 page-gutter py-10 md:py-16 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center lg:gap-16">
          <div>
            <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-muted">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/" className="hover:text-ink">Home</Link>
                </li>
                <li aria-hidden>›</li>
                <li aria-current="page" className="text-ink">Guides</li>
              </ol>
            </nav>
            <p className="mb-3 text-[12px] font-extrabold uppercase tracking-[0.06em] text-coral">Learn to crochet</p>
            <h1 className="type-h1 text-ink">Crochet guides and tutorials</h1>
            <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-muted md:text-[18px]">
              Step-by-step guides in plain English. Start at the top and work down, or search for the one thing you need.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/guides/how-to-crochet-for-beginners"
                className="inline-flex min-h-12 items-center rounded-lg bg-primary px-6 text-[15px] font-bold text-white transition-colors hover:bg-primary-hover"
              >
                Start with the beginner guide
              </Link>
              <Link
                href="/crochet-patterns-for-beginners"
                className="inline-flex min-h-12 items-center rounded-lg border-2 border-ink px-6 text-[15px] font-bold text-ink transition-colors hover:bg-ink hover:text-white"
              >
                Beginner patterns
              </Link>
            </div>
          </div>
          <GuidePath
            steps={groups.map((g) => ({ id: g.id, title: g.title, count: g.guides.length, icon: g.icon, accent: g.accent }))}
          />
        </div>
      </header>

      <div className="mx-auto max-w-site page-gutter py-10 md:py-14">
        <GuidesBrowser groups={groups} />

        <div className="mt-16 rounded-xl bg-footer p-6 text-white md:p-10">
          <p className="font-heading text-[26px] font-semibold leading-snug md:text-[30px]">Ready to make something?</p>
          <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-white/80">
            Every pattern lists its materials and skill level. Try a free one first, or browse the full shop.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/free-crochet-patterns" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 text-[15px] font-bold text-ink hover:bg-white/90">
              Free crochet patterns
            </Link>
            <Link href="/shop" className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-white/70 px-6 text-[15px] font-bold text-white hover:bg-white hover:text-ink">
              Browse all patterns
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
