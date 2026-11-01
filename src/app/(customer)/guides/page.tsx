import Link from 'next/link'
import { jsonLdString } from '@/lib/jsonLd'
import { buildBreadcrumbListJsonLd, buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo'
import { SectionJumpLinks } from '@/components/SectionJumpLinks'
import { getAllGuides, type Guide } from '@/lib/guides'

const DESCRIPTION =
  'Plain-English crochet guides: how to start, every basic stitch, amigurumi finishing, yarn and hook choices and care, to help you start and finish your next project.'

export const metadata = buildMetadata({
  title: 'Crochet Guides and Tutorials',
  description: DESCRIPTION,
  path: '/guides',
})

/** Groups for the guides index. A guide that is not listed here still appears, under "More guides". */
const GROUPS: { title: string; intro: string; slugs: string[] }[] = [
  {
    title: 'Start here',
    intro: 'New to crochet? Read these first, in order: what crochet is, how to hold the hook, and how to read a pattern.',
    slugs: [
      'how-to-crochet-for-beginners',
      'crochet-vs-knitting',
      'what-is-amigurumi',
      'how-to-hold-yarn-and-hook-crochet',
      'left-handed-crochet-guide',
      'crochet-skill-levels-explained',
      'how-to-read-a-crochet-pattern',
      'crochet-abbreviations-us-vs-uk',
      'how-to-read-crochet-symbols-and-charts',
    ],
  },
  {
    title: 'Yarn and hooks',
    intro: 'Choosing your materials and checking your gauge before you start.',
    slugs: [
      'crochet-hook-sizes-chart',
      'yarn-weight-chart',
      'how-to-read-yarn-labels',
      'best-yarn-for-amigurumi',
      'crochet-gauge-swatch',
    ],
  },
  {
    title: 'Stitches and techniques',
    intro: 'From the first stitch to small projects: each guide builds on the one before it.',
    slugs: [
      'basic-crochet-stitches-for-beginners',
      'how-to-slip-stitch-and-slip-knot',
      'how-to-single-crochet',
      'how-to-half-double-crochet',
      'how-to-double-crochet',
      'how-to-fasten-off-and-weave-in-ends',
      'how-to-fix-mistakes-in-crochet',
      'how-to-crochet-in-the-round',
      'how-to-join-new-yarn-in-crochet',
      'how-to-change-colors-in-crochet',
      'granny-square-for-beginners',
      'simple-crochet-blanket-for-beginners',
    ],
  },
  {
    title: 'Amigurumi',
    intro: 'Everything for making stuffed toys, from the magic ring to resizing a pattern.',
    slugs: [
      'how-to-make-a-magic-ring-crochet',
      'invisible-decrease-amigurumi',
      'how-to-stuff-and-assemble-amigurumi',
      'safety-eyes-for-amigurumi',
      'how-to-embroider-faces-on-amigurumi',
      'how-to-make-amigurumi-bigger-or-smaller',
    ],
  },
  {
    title: 'Finishing and care',
    intro: 'Shaping your finished work and looking after it.',
    slugs: ['how-to-block-crochet', 'how-to-wash-crochet-and-amigurumi'],
  },
]

const sectionId = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

function GuideCard({ g }: { g: Guide }) {
  return (
    <li className="rounded-[5px] border border-border bg-surface p-5 transition-colors hover:bg-surface-warm">
      <h3 className="font-heading text-[20px] leading-tight text-ink">
        <Link href={`/guides/${g.slug}`} className="hover:underline">{g.title}</Link>
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">{g.description}</p>
      <Link href={`/guides/${g.slug}`} className="mt-3 inline-flex min-h-11 items-center text-[14px] font-semibold text-primary hover:underline">
        Read the guide
      </Link>
    </li>
  )
}

export default function GuidesIndexPage() {
  const guides = getAllGuides()
  const bySlug = new Map(guides.map((g) => [g.slug, g]))
  const used = new Set<string>()
  const sections = GROUPS.map((group) => {
    const items = group.slugs.map((s) => bySlug.get(s)).filter((g): g is Guide => !!g)
    items.forEach((g) => used.add(g.slug))
    return { ...group, items }
  }).filter((s) => s.items.length > 0)
  const rest = guides.filter((g) => !used.has(g.slug))

  const collectionJsonLd = buildCollectionPageJsonLd({ name: 'Crochet guides', description: DESCRIPTION, path: '/guides' })
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/guides' },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }} />
      <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-ink">Home</Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="text-ink">Guides</li>
          </ol>
        </nav>
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">Learn</p>
        <h1 className="type-h1 mb-4 text-ink">Crochet Guides and Tutorials</h1>
        <p className="mb-6 max-w-[60ch] text-[15px] leading-relaxed text-muted md:text-[16px]">{DESCRIPTION}</p>
        <SectionJumpLinks items={sections.map((s) => ({ id: sectionId(s.title), label: s.title }))} />
        {sections.map((s) => (
          <section key={s.title} id={sectionId(s.title)} className="mb-12 scroll-mt-24">
            <h2 className="font-heading text-[28px] leading-tight text-ink">{s.title}</h2>
            <p className="mb-5 mt-2 max-w-[60ch] text-[14px] leading-relaxed text-muted md:text-[15px]">{s.intro}</p>
            <ul className="space-y-4">
              {s.items.map((g) => (
                <GuideCard key={g.slug} g={g} />
              ))}
            </ul>
          </section>
        ))}
        {rest.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-5 font-heading text-[28px] leading-tight text-ink">More guides</h2>
            <ul className="space-y-4">
              {rest.map((g) => (
                <GuideCard key={g.slug} g={g} />
              ))}
            </ul>
          </section>
        )}
        <p className="mt-10 text-[14px] text-muted">
          Ready to make something? Browse <Link href="/crochet-patterns-for-beginners" className="text-primary underline underline-offset-4">crochet patterns for beginners</Link>,{' '}
          <Link href="/free-crochet-patterns" className="text-primary underline underline-offset-4">free crochet patterns</Link> or the{' '}
          <Link href="/shop" className="text-primary underline underline-offset-4">full pattern shop</Link>.
        </p>
      </div>
    </>
  )
}
