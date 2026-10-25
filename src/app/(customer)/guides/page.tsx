import Link from 'next/link'
import { jsonLdString } from '@/lib/jsonLd'
import { buildBreadcrumbListJsonLd, buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo'
import { getAllGuides } from '@/lib/guides'

const DESCRIPTION =
  'Plain-English crochet guides: US vs UK terms, how to read a pattern and more, to help you start and finish your next project.'

export const metadata = buildMetadata({
  title: 'Crochet Guides and Tutorials',
  description: DESCRIPTION,
  path: '/guides',
})

export default function GuidesIndexPage() {
  const guides = getAllGuides()
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
        <p className="mb-10 max-w-[60ch] text-[15px] leading-relaxed text-muted md:text-[16px]">{DESCRIPTION}</p>
        <ul className="space-y-4">
          {guides.map((g) => (
            <li key={g.slug} className="rounded-[5px] border border-border bg-surface p-5 transition-colors hover:bg-surface-warm">
              <h2 className="font-heading text-[22px] leading-tight text-ink">
                <Link href={`/guides/${g.slug}`} className="hover:underline">{g.title}</Link>
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{g.description}</p>
              <Link href={`/guides/${g.slug}`} className="mt-3 inline-flex min-h-11 items-center text-[14px] font-semibold text-primary hover:underline">
                Read the guide
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-[14px] text-muted">
          Ready to make something? Browse <Link href="/free-crochet-patterns" className="text-primary underline underline-offset-4">free crochet patterns</Link> or the{' '}
          <Link href="/shop" className="text-primary underline underline-offset-4">full pattern shop</Link>.
        </p>
      </div>
    </>
  )
}
