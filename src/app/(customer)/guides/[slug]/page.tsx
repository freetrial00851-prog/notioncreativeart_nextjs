import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { jsonLdString } from '@/lib/jsonLd'
import { buildArticleJsonLd, buildBreadcrumbListJsonLd, buildMetadata } from '@/lib/seo'
import { getAllGuides, getGuide, getRelatedGuides } from '@/lib/guides'
import { GuideBody } from '@/components/guides/GuideBody'

type Props = { params: Promise<{ slug: string }> }

/** Every guide is known at build time; anything else is a real 404. */
export const dynamicParams = false

export function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) {
    return buildMetadata({ title: 'Guide not found', description: 'This guide could not be found.', path: `/guides/${slug}`, noIndex: true })
  }
  return buildMetadata({ title: guide.title, description: guide.description, path: `/guides/${guide.slug}` })
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  const related = getRelatedGuides(guide)
  const articleJsonLd = buildArticleJsonLd({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    datePublished: guide.datePublished,
    dateModified: guide.dateModified,
    author: guide.author,
  })
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Guides', path: '/guides' },
    { name: guide.title, path: `/guides/${guide.slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }} />
      <article className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-ink">Home</Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link href="/guides" className="hover:text-ink">Guides</Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="text-ink">{guide.title}</li>
          </ol>
        </nav>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Guide</p>
        <h1 className="type-h1 mb-3 text-ink">{guide.title}</h1>
        <p className="mb-8 text-[13px] text-muted">
          By {guide.author} · Updated <time dateTime={guide.dateModified}>{formatDate(guide.dateModified)}</time>
        </p>

        <GuideBody blocks={guide.body} />

        {guide.faq && guide.faq.length > 0 && (
          <section className="mt-12" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="font-heading text-[26px] leading-tight text-ink md:text-[30px]">Quick answers</h2>
            <dl className="mt-4 space-y-5">
              {guide.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold text-ink">{f.q}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-12 border-t border-border pt-8" aria-labelledby="related-heading">
            <h2 id="related-heading" className="font-heading text-[22px] leading-tight text-ink">More guides</h2>
            <ul className="mt-3 space-y-2">
              {related.map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="text-primary underline underline-offset-4">{g.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 rounded-[5px] border border-border bg-surface-warm p-5">
          <p className="font-semibold text-ink">Ready to start a project?</p>
          <p className="mt-1 text-[14px] text-muted">Download a free pattern, or browse the full shop.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/free-crochet-patterns" className="inline-flex min-h-11 items-center justify-center rounded-[3px] bg-primary px-6 text-[15px] font-semibold text-primary-contrast hover:bg-primary-hover">
              Free crochet patterns
            </Link>
            <Link href="/shop" className="inline-flex min-h-11 items-center justify-center rounded-[3px] border-[1.5px] border-primary bg-white px-6 text-[15px] font-semibold text-primary hover:bg-primary-soft">
              Browse all patterns
            </Link>
          </div>
        </div>
      </article>
    </>
  )
}
