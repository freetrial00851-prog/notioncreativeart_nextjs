'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { DEFAULT_LAYOUT } from '../lib/defaultLayout'
import {
  clearHomeCatalogCache,
  fetchHomeCatalog,
  getHomeCatalogCache,
  setHomeCatalogCache,
  type HomeCatalogSnapshot,
} from '../lib/homeCatalogCache'
import type { CategoryWithCount } from '../lib/categories'
import type { Product, HeroContent, ChapterContent, LayoutSection } from '../lib/types'
import { PatternCard } from '../components/PatternCard'
import { PatternGrid } from '../components/PatternGrid'
import { LevelBadge, StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmailSignup } from '../components/EmailSignup'
import { FaqAccordion } from '../components/FaqAccordion'
import { useReviewStatsMapForLists } from '../lib/useReviewStatsMap'
import { ProductGridSkeleton } from '../components/Skeleton'
import { fetchMakerReviewsForHome, type MakerReviewCard } from '../lib/reviews'
import { HOME_FAQ } from '../lib/homeFaq'

const SKILL_COPY: Record<
  'beginner' | 'intermediate' | 'advanced',
  { title: string; body: string; tint: string }
> = {
  beginner: {
    title: 'Start simple',
    body: 'Basic stitches and simple shaping. A gentle place to begin.',
    tint: 'var(--color-tint-sage)',
  },
  intermediate: {
    title: 'Build your skills',
    body: 'More shaping, colour changes and finishing detail.',
    tint: 'var(--color-tint-cream)',
  },
  advanced: {
    title: 'Take on a challenge',
    body: 'Complex construction for confident makers.',
    tint: 'var(--color-tint-peach)',
  },
}

const SHOP_SHORTCUTS = [
  { href: '/shop', label: 'All patterns' },
  { href: '/shop?price=free', label: 'Free PDFs' },
  { href: '/shop?level=beginner', label: 'Beginner' },
  { href: '/shop?sort=newest', label: 'New' },
] as const

const HOW_STEPS = [
  { n: '1', t: 'Pick a pattern', d: 'Choose by skill, style, or start with a free PDF.' },
  { n: '2', t: 'Download instantly', d: 'Checkout takes a minute. The file lands in your account.' },
  { n: '3', t: 'Keep it for life', d: 'Re-download anytime from My downloads. No limits.' },
] as const

const HERO_FALLBACK_TINT = 'var(--color-tint-lavender)'

function readCachedCatalog(): HomeCatalogSnapshot | null {
  if (typeof window === 'undefined') return null
  return getHomeCatalogCache()
}

function applyCatalogSnapshot(
  snap: HomeCatalogSnapshot,
  setters: {
    setTrending: (v: Product[]) => void
    setFreeProduct: (v: Product | null) => void
    setFreePatternCollage: (v: Product[]) => void
    setChapters: (v: ChapterContent[]) => void
    setHero: Dispatch<SetStateAction<HeroContent | null>>
    setCategories: (v: CategoryWithCount[]) => void
    setSkillCounts: (v: HomeCatalogSnapshot['skillCounts']) => void
  },
) {
  setters.setTrending(snap.trending)
  setters.setFreeProduct(snap.freeProduct)
  setters.setFreePatternCollage(snap.freePatternCollage ?? [])
  setters.setChapters(snap.chapters)
  setters.setCategories(snap.categories ?? [])
  setters.setSkillCounts(snap.skillCounts)
  if (snap.hero) {
    setters.setHero((prev) => {
      const prevUrls = (prev?.images ?? []).join('|')
      const nextUrls = (snap.hero?.images ?? []).join('|')
      return prevUrls === nextUrls ? prev : snap.hero
    })
  }
}

function heroPrimaryHref(link: string | undefined) {
  const raw = (link ?? '').trim()
  if (!raw || raw === '/shop' || raw === '/shop/' || raw === '/shop/new') return '/shop'
  return raw
}

function heroSecondaryHref(link: string | undefined) {
  const raw = (link ?? '').trim()
  if (!raw || raw === '/shop' || raw === '/shop/') return '/shop?price=free'
  return raw
}

/** Preview/local only — contains owner TODO placeholders; omitted in production. */
const FAQ_ITEM_FILE_ISSUE_PLACEHOLDER = {
  question: 'What if something is wrong with my file?',
  answer: (
    <>
      {/* TODO: real refund policy summary from owner */}
      [REFUND POLICY SUMMARY] You can also write to{' '}
      {/* TODO: support email from owner */}
      <span className="text-primary underline">[SUPPORT EMAIL]</span> and we will help.
    </>
  ),
}

type HeroPhoto = { src: string; alt: string; href?: string }

export function Home({
  initialCatalog = null,
  initialFeaturedError = null,
  initialHero = null,
  initialLayout,
  hideOwnerCopyPlaceholders = false,
}: {
  initialCatalog?: HomeCatalogSnapshot | null
  initialFeaturedError?: string | null
  initialHero?: HeroContent | null
  initialLayout?: LayoutSection[]
  /** When true (Vercel production), omit sections/lines waiting on owner copy. */
  hideOwnerCopyPlaceholders?: boolean
}) {
  const seed = readCachedCatalog() ?? initialCatalog ?? null
  const [trending, setTrending] = useState<Product[]>(() => seed?.trending ?? [])
  const [freeProduct, setFreeProduct] = useState<Product | null>(() => seed?.freeProduct ?? null)
  const [freePatternCollage, setFreePatternCollage] = useState<Product[]>(
    () => seed?.freePatternCollage ?? (seed?.freeProduct ? [seed.freeProduct] : []),
  )
  const [hero, setHero] = useState<HeroContent | null>(() => seed?.hero ?? initialHero)
  const [chapters, setChapters] = useState<ChapterContent[]>(() => seed?.chapters ?? [])
  const [categories, setCategories] = useState<CategoryWithCount[]>(() => seed?.categories ?? [])
  const [skillCounts, setSkillCounts] = useState<HomeCatalogSnapshot['skillCounts']>(
    () => seed?.skillCounts ?? { beginner: 0, intermediate: 0, advanced: 0 },
  )
  const [makerReviews, setMakerReviews] = useState<MakerReviewCard[]>([])
  const [catalogReady, setCatalogReady] = useState(() => Boolean(seed))
  const [featuredError, setFeaturedError] = useState<string | null>(() => initialFeaturedError ?? null)
  const [catalogReloadKey, setCatalogReloadKey] = useState(0)
  void initialLayout
  void DEFAULT_LAYOUT // retained for page.tsx prop compatibility / future CMS layout

  const reviewStatsMap = useReviewStatsMapForLists([trending])
  const featured = trending.slice(0, 4)
  const heroPhoto = ((): HeroPhoto | null => {
    for (const url of hero?.images ?? []) {
      if (!url) continue
      const match = trending.find((p) => p.images?.[0] === url)
      return {
        src: url,
        alt: match?.title || 'Handmade crochet from Notion Creative Art',
        href: match ? `/pattern/${match.slug}` : undefined,
      }
    }
    const first = trending.find((p) => p.images?.[0])
    if (!first?.images?.[0]) return null
    return { src: first.images[0], alt: first.title, href: `/pattern/${first.slug}` }
  })()
  const freeImages = (
    freePatternCollage.length > 0
      ? freePatternCollage
      : freeProduct
        ? [freeProduct]
        : []
  ).slice(0, 2)
  const browseCategories = categories.slice(0, 3)

  useEffect(() => {
    let cancelled = false
    const setters = {
      setTrending,
      setFreeProduct,
      setFreePatternCollage,
      setChapters,
      setHero,
      setCategories,
      setSkillCounts,
    }

    const cached = getHomeCatalogCache()
    if (cached) {
      queueMicrotask(() => {
        if (cancelled) return
        applyCatalogSnapshot(cached, setters)
        setFeaturedError(null)
        setCatalogReady(true)
      })
      return () => {
        cancelled = true
      }
    }

    if (initialCatalog && catalogReloadKey === 0) {
      queueMicrotask(() => {
        if (cancelled) return
        setHomeCatalogCache(initialCatalog)
        applyCatalogSnapshot(initialCatalog, setters)
        setFeaturedError(initialFeaturedError)
        setCatalogReady(true)
      })
      return () => {
        cancelled = true
      }
    }

    fetchHomeCatalog()
      .then((result) => {
        if (cancelled) return
        applyCatalogSnapshot(result.snapshot, setters)
        setFeaturedError(result.featuredError)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setFeaturedError(err instanceof Error ? err.message : 'Failed to load featured items')
      })
      .finally(() => {
        if (!cancelled) setCatalogReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [catalogReloadKey, initialCatalog, initialFeaturedError])

  useEffect(() => {
    let cancelled = false
    fetchMakerReviewsForHome(3).then((rows) => {
      if (!cancelled) setMakerReviews(rows)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const skillLevels = (['beginner', 'intermediate', 'advanced'] as const).map((level) => {
    const fromCms = chapters.find((c) => c.level === level)
    const copy = SKILL_COPY[level]
    return {
      level,
      title: fromCms?.title || copy.title,
      body: fromCms?.copy || copy.body,
      image: fromCms?.image || null,
      link: fromCms?.link || `/shop?level=${level}`,
      tint: copy.tint,
      count: skillCounts[level],
    }
  })

  const faqItems = hideOwnerCopyPlaceholders
    ? HOME_FAQ
    : [...HOME_FAQ, FAQ_ITEM_FILE_ISSUE_PLACEHOLDER]

  return (
    <div className="bg-bg">
      <section className="bg-surface-warm">
        <div className="grid lg:min-h-[min(88vh,680px)] lg:grid-cols-2">
          <div
            className="relative order-1 aspect-[4/5] min-h-[300px] lg:order-2 lg:aspect-auto lg:min-h-full"
            style={{ background: HERO_FALLBACK_TINT }}
          >
            {heroPhoto ? (
              heroPhoto.href ? (
                <Link href={heroPhoto.href} className="absolute inset-0" aria-label={heroPhoto.alt}>
                  <Image
                    src={heroPhoto.src}
                    alt={heroPhoto.alt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width:1023px) 100vw, 50vw"
                    priority
                  />
                </Link>
              ) : (
                <Image
                  src={heroPhoto.src}
                  alt={heroPhoto.alt}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width:1023px) 100vw, 50vw"
                  priority
                />
              )
            ) : null}
          </div>
          <div className="order-2 flex flex-col justify-center page-gutter py-10 lg:order-1 lg:py-16">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {hero?.eyebrow?.trim() || 'Crochet patterns for every maker'}
            </p>
            <h1 className="type-hero mb-5 max-w-lg text-ink">Crochet PDF patterns, ready to download.</h1>
            <p className="mb-8 max-w-md text-[16px] leading-relaxed text-muted">
              Tested instant-download patterns for every skill level. Pay once, keep the file for life.
            </p>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link href={heroPrimaryHref(hero?.cta_link)}>
                <Button variant="primary" size="lg" className="w-full sm:w-auto" iconRight={<span aria-hidden>→</span>}>
                  {(hero?.cta_text || 'Shop all patterns').replace(/\s*→\s*$/, '')}
                </Button>
              </Link>
              <Link
                href={heroSecondaryHref(hero?.secondary_cta_link)}
                className="inline-flex min-h-[52px] items-center justify-center text-[15px] font-semibold text-primary hover:underline underline-offset-2"
              >
                {hero?.secondary_cta_text || 'Get a free pattern'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-site mx-auto page-gutter section-y">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="type-h2 mb-2 text-ink">Featured crochet patterns</h2>
            <p className="max-w-xl text-[15px] leading-relaxed text-muted">
              Instant PDF download. Yours to keep.
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden shrink-0 text-[14px] font-semibold text-primary hover:underline underline-offset-2 sm:inline-flex"
          >
            Shop all
          </Link>
        </div>
        {!catalogReady ? (
          <ProductGridSkeleton variant="featured" count={4} />
        ) : featuredError ? (
          <div className="py-10 text-center">
            <p className="mb-3 text-[14px] text-muted">{featuredError}</p>
            <button
              type="button"
              className="text-[13px] font-semibold text-primary underline"
              onClick={() => {
                clearHomeCatalogCache()
                setFeaturedError(null)
                setCatalogReady(false)
                setCatalogReloadKey((k) => k + 1)
              }}
            >
              Try again
            </button>
          </div>
        ) : featured.length === 0 ? (
          <p className="text-[14px] text-muted">No featured patterns yet.</p>
        ) : (
          <>
            <PatternGrid variant="featured">
              {featured.map((p, i) => (
                <PatternCard key={p.id} product={p} priority={i < 2} reviewStats={reviewStatsMap.get(p.id)} />
              ))}
            </PatternGrid>
            <nav aria-label="Shop shortcuts" className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {SHOP_SHORTCUTS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[13px] font-semibold text-ink underline-offset-2 hover:text-primary hover:underline"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </>
        )}
      </section>

      {browseCategories.map((c, i) => (
        <section key={c.id} className={i % 2 === 0 ? 'bg-surface-warm' : 'bg-bg'}>
          <div className="grid lg:grid-cols-2 lg:min-h-[420px]">
            <div
              className={`relative aspect-[4/3] lg:aspect-auto lg:min-h-full ${i % 2 === 1 ? 'lg:order-2' : ''}`}
              style={{ background: 'var(--color-tint-lavender)' }}
            >
              {c.image ? (
                <Image
                  src={c.image}
                  alt={`${c.name} crochet patterns`}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width:1023px) 100vw, 50vw"
                />
              ) : null}
            </div>
            <div className={`flex flex-col justify-center page-gutter py-10 lg:py-14 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
              <p className="mb-3 text-[13px] font-semibold text-primary">
                {c.count} {c.count === 1 ? 'pattern' : 'patterns'}
              </p>
              <h2 className="type-h1 mb-3 text-ink">{c.name}</h2>
              <p className="mb-6 max-w-md text-[15px] leading-relaxed text-muted">
                {c.copy?.trim() || `Shop ${c.name.toLowerCase()} crochet PDF patterns. Instant download, yours to keep.`}
              </p>
              <Link href={c.link}>
                <Button variant="primary" size="md">
                  Shop {c.name}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ))}

      <section className="border-y border-border bg-bg">
        <div className="max-w-site mx-auto page-gutter py-8 md:py-10">
          <h2 className="type-h2 mb-5 text-ink">Shop by skill</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {skillLevels.map((s) => (
              <Link
                key={s.level}
                href={s.link}
                className="flex min-h-12 flex-1 items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 sm:min-w-[200px]"
              >
                <span className="flex items-center gap-2">
                  <LevelBadge level={s.level} />
                  <span className="text-[14px] font-semibold text-ink">{s.title}</span>
                </span>
                {s.count > 0 ? (
                  <span className="text-[13px] text-muted">
                    {s.count}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-contrast">
        <div className="grid lg:grid-cols-2">
          <div className="flex flex-col justify-center page-gutter py-10 lg:py-14">
            <StatusBadge status="free" className="mb-4 !bg-white !text-free" />
            <h2 className="type-h2 mb-3">Start with a free crochet PDF</h2>
            <p className="mb-6 max-w-md text-[15px] leading-relaxed text-white/85">
              Download a free pattern with no account. See the quality before you buy.
            </p>
            <Link href="/shop?price=free" className="block w-full sm:inline-block sm:w-auto">
              <Button
                variant="secondary"
                size="md"
                className="w-full border-0 bg-white text-primary hover:bg-white/95 sm:w-auto"
                iconLeft={<DownloadGlyph />}
              >
                Download a free pattern
              </Button>
            </Link>
          </div>
          <div className="relative hidden min-h-[280px] lg:block">
            {freeImages[0]?.images?.[0] ? (
              <Link href={`/pattern/${freeImages[0].slug}`} className="absolute inset-0">
                <Image
                  src={freeImages[0].images[0]}
                  alt={freeImages[0].title}
                  fill
                  className="object-cover object-center"
                  sizes="50vw"
                />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-surface-warm">
        <div className="max-w-site mx-auto page-gutter section-y">
          <h2 className="type-h2 mb-2 text-ink">How it works</h2>
          <p className="mb-8 max-w-xl text-[15px] text-muted">No shipping wait. Your PDF is ready as soon as you pay.</p>
          <ol className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {HOW_STEPS.map((step) => (
              <li key={step.n}>
                <p className="mb-3 font-heading text-[32px] font-bold leading-none text-primary">{step.n}</p>
                <p className="mb-1 text-[16px] font-bold text-ink">{step.t}</p>
                <p className="text-[14px] leading-relaxed text-muted">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {!hideOwnerCopyPlaceholders && (
        <section className="bg-surface-warm">
          <div className="max-w-site mx-auto grid grid-cols-1 items-center gap-8 page-gutter section-y lg:grid-cols-2">
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border"
              style={{ background: 'var(--color-tint-cream)' }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[13px] text-muted">Designer photo</span>
            </div>
            <div>
              <p className="mb-2 text-[12px] font-semibold text-primary">Meet the maker</p>
              {/* TODO: story headline from owner */}
              <h2 className="type-h2 mb-3 text-ink">[Story headline: why these patterns exist]</h2>
              {/* TODO: maker story copy from owner */}
              <p className="mb-8 text-[15px] leading-relaxed text-muted">
                [Two or three sentences in your own voice: who designs the patterns, how each one is tested, and what a
                buyer can trust about them.]
              </p>
              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
                {[
                  { n: '[N]', l: 'Patterns designed' },
                  { n: '[N]', l: 'Makers helped' },
                  { n: '[N]', l: 'Years crocheting' },
                ].map((s) => (
                  <div key={s.l}>
                    {/* TODO: real stats from owner */}
                    <p className="text-2xl font-extrabold text-primary">{s.n}</p>
                    <p className="text-[12px] text-muted">{s.l}</p>
                  </div>
                ))}
              </div>
              <Link href="/about" className="text-[13px] font-semibold text-primary hover:underline underline-offset-2">
                Read our story →
              </Link>
            </div>
          </div>
        </section>
      )}

      {makerReviews.length > 0 && (
        <section id="reviews" className="bg-surface-warm">
          <div className="max-w-site mx-auto page-gutter section-y">
            <div className="mb-7">
              <h2 className="type-h2 mb-2 text-ink">What makers say</h2>
              <p className="text-[15px] text-muted">Real reviews from people who made our patterns.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {makerReviews.slice(0, 3).map((t, i) => (
                <article
                  key={t.id}
                  className={`rounded-2xl border border-border bg-surface p-5 shadow-card ${i === 2 ? 'hidden md:block' : ''}`}
                >
                  <div className="mb-3 flex gap-0.5 text-gold" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} filled={si < Math.round(t.rating)} />
                    ))}
                  </div>
                  <p className="mb-5 text-[14px] leading-relaxed text-ink">&ldquo;{t.body}&rdquo;</p>
                  <p className="text-[13px] font-semibold text-ink">
                    {t.reviewerFirstName}
                    <span className="font-normal text-muted"> · {t.patternTitle}</span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border bg-bg">
        <div className="max-w-site mx-auto grid grid-cols-1 gap-8 page-gutter section-y lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="type-h2 mb-2 text-ink">Crochet PDF pattern FAQs</h2>
            <p className="mb-3 text-[15px] text-muted">The basics before you buy a digital pattern.</p>
            {!hideOwnerCopyPlaceholders && (
              <p className="text-[14px] text-muted">
                Still stuck? Write to {/* TODO: support email from owner */}
                <span className="text-primary underline">[SUPPORT EMAIL]</span>
              </p>
            )}
          </div>
          <FaqAccordion items={faqItems} />
        </div>
      </section>

      <EmailSignup />
    </div>
  )
}

function DownloadGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4v10M8 10l4 4 4-4M5 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Star({ filled = true }: { filled?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden
      className={filled ? undefined : 'opacity-35'}
    >
      <path d="M12 2.8l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.7 6.6 19.6l1-6.1L3.2 9.2l6.1-.9L12 2.8z" />
    </svg>
  )
}
