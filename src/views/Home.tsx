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
  },
) {
  setters.setTrending(snap.trending)
  setters.setFreeProduct(snap.freeProduct)
  setters.setFreePatternCollage(snap.freePatternCollage ?? [])
  setters.setChapters(snap.chapters)
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

const FAQ_ITEMS_READY = [
  {
    question: 'How do I get my pattern after paying?',
    answer:
      'Right after payment you can download the PDF from the confirmation page. It is also emailed to you and saved in My downloads.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'Yes for paid patterns, so your files are safe and you can download them again. Free patterns can be downloaded without signing in.',
  },
  {
    question: 'Can I download a pattern again later?',
    answer:
      'Yes. Every pattern you buy stays in your account, and you can download it as many times as you like.',
  },
  {
    question: 'Which skill level should I choose?',
    answer:
      'Beginner patterns use basic stitches and short steps. Intermediate and Advanced add shaping and finer details. Each product page shows the level.',
  },
]

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

const HERO_TINTS = [
  'var(--color-tint-lavender)',
  'var(--color-tint-sage)',
  'var(--color-tint-peach)',
] as const

/** One dominant photo, optional overlapping second — editorial, not a 3-tile collage. */
function HeroArt({ images }: { images: string[] }) {
  const main = images[0] ?? null
  const side = images[1] ?? null
  return (
    <div className={`relative ${side ? 'pb-8 md:pb-10' : ''}`}>
      <div
        className="relative aspect-[4/5] sm:aspect-[5/6] lg:aspect-[4/5] overflow-hidden rounded-[24px]"
        style={{ background: HERO_TINTS[0] }}
      >
        {main ? (
          <Image src={main} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 520px" priority />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[13px] text-muted">Hero photo</span>
        )}
      </div>
      {side && (
        <div
          className="absolute bottom-0 left-4 md:left-0 w-[44%] md:w-[42%] aspect-square overflow-hidden rounded-[20px] border-[5px] border-bg"
          style={{ background: HERO_TINTS[1] }}
        >
          <Image src={side} alt="" fill className="object-cover" sizes="220px" />
        </div>
      )}
    </div>
  )
}

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
  const [makerReviews, setMakerReviews] = useState<MakerReviewCard[]>([])
  const [catalogReady, setCatalogReady] = useState(() => Boolean(seed))
  const [featuredError, setFeaturedError] = useState<string | null>(() => initialFeaturedError ?? null)
  const [catalogReloadKey, setCatalogReloadKey] = useState(0)
  void initialLayout
  void DEFAULT_LAYOUT // retained for page.tsx prop compatibility / future CMS layout

  const reviewStatsMap = useReviewStatsMapForLists([trending])
  const featured = trending.slice(0, 4)
  const freeImages = (
    freePatternCollage.length > 0
      ? freePatternCollage
      : freeProduct
        ? [freeProduct]
        : []
  ).slice(0, 2)

  useEffect(() => {
    let cancelled = false
    const setters = {
      setTrending,
      setFreeProduct,
      setFreePatternCollage,
      setChapters,
      setHero,
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
    }
  })

  const faqItems = hideOwnerCopyPlaceholders
    ? FAQ_ITEMS_READY
    : [...FAQ_ITEMS_READY, FAQ_ITEM_FILE_ISSUE_PLACEHOLDER]

  return (
    <div className="bg-bg">
      {/* Hero */}
      <section className="max-w-site mx-auto page-gutter pt-8 md:pt-12 lg:pt-14 pb-10 md:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary mb-4">
              {hero?.eyebrow?.trim() || 'Crochet patterns for every maker'}
            </p>
            <h1 className="type-hero text-ink mb-4 max-w-xl">
              Beautiful crochet patterns, ready to download.
            </h1>
            <p className="text-[16px] text-muted leading-relaxed mb-6 max-w-md">
              Clear, tested PDF patterns for every skill level. Pay once, download instantly and keep them for life.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link href={heroPrimaryHref(hero?.cta_link)}>
                <Button variant="primary" size="md" iconRight={<span aria-hidden>→</span>}>
                  {(hero?.cta_text || 'Shop all patterns').replace(/\s*→\s*$/, '')}
                </Button>
              </Link>
              <Link
                href={heroSecondaryHref(hero?.secondary_cta_link)}
                className="inline-flex min-h-11 items-center text-[15px] font-semibold text-primary hover:underline underline-offset-2"
              >
                {hero?.secondary_cta_text || 'Get a free pattern'}
              </Link>
            </div>
            <p className="mt-6 text-[13px] text-muted">
              Instant PDF · Lifetime access · Secure checkout
            </p>
          </div>
          <HeroArt images={hero?.images ?? []} />
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-site mx-auto page-gutter pb-12 md:pb-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <h2 className="type-h2 text-ink">Featured patterns</h2>
          <Link href="/shop" className="text-[13px] font-semibold text-primary shrink-0 hover:underline underline-offset-2">
            <span className="md:hidden">View all</span>
            <span className="hidden md:inline">View all patterns →</span>
          </Link>
        </div>
        {!catalogReady ? (
          <ProductGridSkeleton variant="featured" count={4} />
        ) : featuredError ? (
          <div className="text-center py-10">
            <p className="text-muted text-[14px] mb-3">{featuredError}</p>
            <button
              type="button"
              className="text-primary font-semibold text-[13px] underline"
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
          <p className="text-muted text-[14px]">No featured patterns yet.</p>
        ) : (
          <PatternGrid variant="featured">
            {featured.map((p, i) => (
              <PatternCard key={p.id} product={p} priority={i < 2} reviewStats={reviewStatsMap.get(p.id)} />
            ))}
          </PatternGrid>
        )}
      </section>

      {/* Shop by skill */}
      <section className="bg-surface-warm">
        <div className="max-w-site mx-auto page-gutter section-y">
          <h2 className="type-h2 text-ink mb-2">Shop by skill level</h2>
          <p className="text-[15px] text-muted mb-8 max-w-lg">
            Find patterns that match where you are right now.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5">
            {skillLevels.map((s) => (
              <Link key={s.level} href={s.link} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[20px]" style={{ background: s.tint }}>
                  {s.image ? (
                    <Image src={s.image} alt="" fill className="object-cover transition-transform duration-500 [@media(hover:hover)]:group-hover:scale-[1.03] motion-reduce:transform-none" sizes="(max-width:768px) 100vw, 33vw" />
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 p-4 pt-16 bg-gradient-to-t from-ink/55 to-transparent">
                    <LevelBadge level={s.level} className="mb-2" />
                    <h3 className="font-heading text-[22px] font-bold text-white leading-tight">{s.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-[14px] text-muted leading-relaxed">{s.body}</p>
                <span className="mt-1.5 inline-block text-[13px] font-semibold text-primary group-hover:underline underline-offset-2">
                  Browse {s.level} patterns
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Free pattern band */}
      <section style={{ background: 'var(--color-tint-sage)' }}>
        <div className="max-w-site mx-auto page-gutter section-y grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <StatusBadge status="free" className="!bg-white !text-free mb-4" />
            <h2 className="type-h2 text-ink mb-3">Start with a free pattern</h2>
            <p className="text-[16px] text-muted leading-relaxed mb-6 max-w-md">
              Download a free PDF, no account needed. See the quality for yourself before you buy.
            </p>
            <Link href="/shop?price=free">
              <Button variant="primary" size="md" iconLeft={<DownloadGlyph />}>
                Download a free pattern
              </Button>
            </Link>
          </div>
          <div className="relative aspect-[4/3] lg:aspect-[5/4] overflow-hidden rounded-[24px] bg-white">
            {freeImages[0]?.images?.[0] ? (
              <Link href={`/pattern/${freeImages[0].slug}`} className="absolute inset-0">
                <Image
                  src={freeImages[0].images[0]}
                  alt={freeImages[0].title}
                  fill
                  className="object-cover"
                  sizes="(max-width:1024px) 100vw, 520px"
                />
              </Link>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[13px] text-muted">
                Free pattern photo
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Meet the maker — §4.1.8; hidden in production until owner copy/stats exist */}
      {!hideOwnerCopyPlaceholders && (
        <section className="bg-surface-warm">
          <div className="max-w-site mx-auto page-gutter section-y grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div
              className="relative aspect-[4/5] rounded-2xl border border-border overflow-hidden"
              style={{ background: 'var(--color-tint-cream)' }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[13px] text-muted">Designer photo</span>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-primary mb-2">Meet the maker</p>
              {/* TODO: story headline from owner */}
              <h2 className="type-h2 text-ink mb-3">
                [Story headline: why these patterns exist]
              </h2>
              {/* TODO: maker story copy from owner */}
              <p className="text-[15px] text-muted leading-relaxed mb-8">
                [Two or three sentences in your own voice: who designs the patterns, how each one is tested, and what a
                buyer can trust about them.]
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
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

      {/* What makers say — §4.1.9 from reviews table; hide if none; 2 on mobile, 3 on md+ */}
      {makerReviews.length > 0 && (
        <section id="reviews" className="bg-surface-warm">
          <div className="max-w-site mx-auto page-gutter section-y">
            <div className="text-center mb-7">
              <h2 className="type-h2 text-ink mb-2">What makers say</h2>
              <p className="text-[15px] text-muted">Real reviews from people who made our patterns.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {makerReviews.slice(0, 3).map((t, i) => (
                <article
                  key={t.id}
                  className={`rounded-[20px] bg-surface p-5 md:p-6 ${i === 2 ? 'hidden md:block' : ''}`}
                >
                  <div
                    className="flex gap-0.5 mb-3 text-gold"
                    aria-label={`${t.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} filled={si < Math.round(t.rating)} />
                    ))}
                  </div>
                  <p className="text-[14px] text-ink leading-relaxed mb-5">&ldquo;{t.body}&rdquo;</p>
                  <p className="text-[13px] font-semibold text-ink">
                    {t.reviewerFirstName}
                    <span className="font-normal text-muted"> · {t.patternTitle}</span>
                  </p>
                </article>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/shop" className="text-[13px] font-semibold text-primary hover:underline underline-offset-2">
                Read all reviews →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-bg">
        <div className="max-w-site mx-auto page-gutter section-y grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8">
          <div>
            <h2 className="type-h2 text-ink mb-2">Questions, answered</h2>
            <p className="text-[15px] text-muted mb-3">The basics before you buy.</p>
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

      {/* Newsletter — §4.1.11 */}
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
