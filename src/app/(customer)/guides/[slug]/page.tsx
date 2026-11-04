import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { jsonLdString } from '@/lib/jsonLd'
import { buildArticleJsonLd, buildBreadcrumbListJsonLd, buildMetadata } from '@/lib/seo'
import { getAllGuides, getGuide, getRelatedGuides } from '@/lib/guides'
import { GUIDE_GROUPS, getGuideGroup, guideReadMinutes, guideTocItems } from '@/lib/guideMeta'
import { GuideBody } from '@/components/guides/GuideBody'
import { GuideIcon } from '@/components/guides/GuideIcon'
import { GuideTocMobile, GuideTocSidebar } from '@/components/guides/GuideToc'
import { FaqAccordion } from '@/components/FaqAccordion'

type Props = { params: Promise<{ slug: string }> }

/** Every guide is known at build time; anything else is a real 404. */
const NEXT_LINKS: Record<string, { href: string; label: string }[]> = {
  'start-here': [
    { href: '/crochet-patterns-for-beginners', label: 'Beginner patterns' },
    { href: '/shop/amigurumi', label: 'Amigurumi patterns' },
  ],
  amigurumi: [
    { href: '/amigurumi-animals', label: 'Amigurumi animals' },
    { href: '/mini-amigurumi-and-keychains', label: 'Keychains and minis' },
  ],
  default: [
    { href: '/amigurumi-animals', label: 'Amigurumi animals' },
    { href: '/crochet-patterns-for-beginners', label: 'Beginner patterns' },
  ],
}

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
  const group = getGuideGroup(guide.slug)
  const minutes = guideReadMinutes(guide)
  const toc = guideTocItems(guide)
  // The next guide in the reading order, so a reader can keep going.
  const order = GUIDE_GROUPS.flatMap((g) => g.slugs)
  const nextSlug = order[order.indexOf(guide.slug) + 1]
  const next = nextSlug ? getGuide(nextSlug) : undefined

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
      <div aria-hidden className="stitch-read" />

      <header className="border-b border-border bg-surface-warm">
        <div className="mx-auto max-w-site page-gutter py-10 md:py-14">
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
              <li aria-current="page" className="max-w-[40ch] truncate text-ink">{guide.title}</li>
            </ol>
          </nav>
          <Link
            href={`/guides#${group.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.06em]"
            style={{ color: group.accent }}
          >
            <GuideIcon name={group.icon} size={16} />
            {group.title}
          </Link>
          <h1 className="type-h1 mt-5 max-w-3xl text-ink">{guide.title}</h1>
          <p className="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-muted md:text-[18px]">{guide.description}</p>
          <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold text-muted">
            <span>{minutes} min read</span>
            <span aria-hidden>·</span>
            <span>
              Updated <time dateTime={guide.dateModified}>{formatDate(guide.dateModified)}</time>
            </span>
            <span aria-hidden>·</span>
            <span>By {guide.author}</span>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-site page-gutter py-10 md:py-14 lg:grid lg:grid-cols-[minmax(0,720px)_260px] lg:justify-between lg:gap-16">
        <article className="min-w-0">
          <GuideTocMobile items={toc} />
          <GuideBody blocks={guide.body} />

          {guide.faq && guide.faq.length > 0 && (
            <section className="mt-14" aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="type-h2 mb-5 text-ink">Quick answers</h2>
              <FaqAccordion items={guide.faq.map((f) => ({ question: f.q, answer: f.a }))} />
            </section>
          )}

          {next && (
            <Link
              href={`/guides/${next.slug}`}
              className="group mt-14 flex items-center justify-between gap-6 rounded-xl border border-border bg-white p-5 transition-[border-color,box-shadow] hover:border-ink/40 hover:shadow-card-hover md:p-6"
            >
              <span>
                <span className="block text-[12px] font-extrabold uppercase tracking-[0.06em] text-muted">Next guide</span>
                <span className="mt-1 block font-heading text-[20px] font-semibold leading-snug text-ink group-hover:underline group-hover:underline-offset-4 md:text-[22px]">
                  {next.title}
                </span>
              </span>
              <span aria-hidden className="text-[22px] text-ink transition-transform group-hover:translate-x-1">→</span>
            </Link>
          )}

          <div className="mt-8 rounded-xl bg-footer p-6 text-white md:p-8">
            <p className="font-heading text-[24px] font-semibold leading-snug">Ready to start a project?</p>
            <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-white/80">
              Download a free pattern to practice with, or browse every pattern in the shop.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/free-crochet-patterns" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 text-[15px] font-bold text-ink hover:bg-white/90">
                Free crochet patterns
              </Link>
              <Link href="/shop" className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-white/70 px-6 text-[15px] font-bold text-white hover:bg-white hover:text-ink">
                Browse all patterns
              </Link>
            </div>
            <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] text-white/80">
              <span>Also see:</span>
              {(NEXT_LINKS[group.id] ?? NEXT_LINKS.default).map((l) => (
                <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center font-semibold text-white underline underline-offset-4 hover:text-white/80">
                  {l.label}
                </Link>
              ))}
            </p>
          </div>
        </article>

        <aside className="hidden lg:block">
          <GuideTocSidebar items={toc} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="border-t border-border bg-surface-warm" aria-labelledby="related-heading">
          <div className="mx-auto max-w-site page-gutter py-10 md:py-14">
            <h2 id="related-heading" className="type-h2 mb-6 text-ink">More guides to read</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((g) => {
                const rg = getGuideGroup(g.slug)
                return (
                  <li key={g.slug}>
                    <Link
                      href={`/guides/${g.slug}`}
                      className="group flex h-full flex-col rounded-xl border border-border bg-white p-5 transition-[border-color,box-shadow] hover:border-ink/40 hover:shadow-card-hover"
                    >
                      <span className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.06em]" style={{ color: rg.accent }}>
                        <GuideIcon name={rg.icon} size={16} />
                        {rg.title}
                      </span>
                      <span className="mt-3 font-heading text-[19px] font-semibold leading-snug text-ink group-hover:underline group-hover:underline-offset-4">
                        {g.title}
                      </span>
                      <span className="mt-auto pt-4 text-[13px] text-muted">{guideReadMinutes(g)} min read</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
