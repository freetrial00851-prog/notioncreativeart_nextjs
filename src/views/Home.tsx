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
    setSkillCounts: (v: HomeCatalogSnapshot['skillCounts']) => void
  },
) {
  setters.setTrending(snap.trending)
  setters.setFreeProduct(snap.freeProduct)
  setters.setFreePatternCollage(snap.freePatternCollage ?? [])
  setters.setChapters(snap.chapters)
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
  const heroTiles = ((): (HeroPhoto | null)[] => {
    const tiles: HeroPhoto[] = []
    const seen = new Set<string>()
    const add = (src: string | undefined, p?: Product) => {
      if (!src || seen.has(src) || tiles.length >= 3) return
      seen.add(src)
      tiles.push({
        src,
        alt: p?.title || 'Handmade crochet from Notion Creative Art',
        href: p ? `/pattern/${p.slug}` : undefined,
      })
    }
    for (const url of hero?.images ?? []) add(url, trending.find((p) => p.images?.[0] === url))
    for (const p of trending) add(p.images?.[0], p)
    return [tiles[0] ?? null, tiles[1] ?? null, tiles[2] ?? null]
  })()
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
      {/* 1 · Hero — DESIGN_SPEC §4.1 */}
      <section>
        <div className="mx-auto grid max-w-site items-center gap-8 page-gutter py-8 md:py-12 lg:grid-cols-2 lg:gap-12 lg:py-16">
          <div>
            <p className="mb-5 inline-flex rounded-full bg-primary-soft px-3.5 py-2 text-[11px] font-bold uppercase leading-none tracking-[0.1em] text-primary">
              {hero?.eyebrow?.trim() || 'Crochet patterns for every maker'}
            </p>
            <h1 className="type-hero mb-5 max-w-xl text-ink md:max-w-none lg:max-w-xl">Beautiful crochet patterns, ready to download.</h1>
            <p className="mb-7 max-w-lg text-[16px] leading-relaxed text-muted lg:text-[18px]">
              Clear, tested PDF patterns for every skill level. Pay once, download instantly and keep them for life.
            </p>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link href={heroPrimaryHref(hero?.cta_link)}>
                <Button variant="primary" size="lg" className="w-full sm:w-auto" iconRight={<ArrowGlyph />}>
                  {(hero?.cta_text || 'Shop all patterns').replace(/\s*→\s*$/, '')}
                </Button>
              </Link>
              <Link href={heroSecondaryHref(hero?.secondary_cta_link)}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  {hero?.secondary_cta_text || 'Get a free pattern'}
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid aspect-[6/5] w-full grid-cols-[11fr_10fr] grid-rows-2 gap-3 md:aspect-[2.9/1] md:grid-cols-[13fr_10fr_10fr] md:grid-rows-1 md:gap-4 lg:aspect-[6/5] lg:grid-cols-[11fr_10fr] lg:grid-rows-2">
            <HeroTile photo={heroTiles[0]} tint="var(--color-tint-lavender)" className="row-span-2 md:row-span-1 lg:row-span-2" priority />
            <HeroTile photo={heroTiles[1]} tint="var(--color-tint-sage)" />
            <HeroTile photo={heroTiles[2]} tint="var(--color-surface-warm)" />
          </div>
        </div>
      </section>

      {/* 2 · Trust strip */}
      <section className="border-y border-border bg-surface">
        <ul className="mx-auto grid max-w-site grid-cols-2 gap-x-4 gap-y-6 page-gutter py-6 lg:grid-cols-4 lg:py-7">
          {TRUST_ITEMS.map((item) => (
            <li key={item.title} className="flex flex-col items-start gap-3 md:flex-row md:items-center">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                {item.icon}
              </span>
              <span>
                <span className="block text-[14px] font-bold leading-snug text-ink">{item.title}</span>
                <span className="block text-[13px] leading-snug text-muted">{item.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 · Featured patterns */}
      <section className="max-w-site mx-auto page-gutter py-10 md:py-14">
        <div className="mb-7 flex items-end justify-between gap-4 md:mb-9">
          <h2 className="home-h2 text-ink">Featured patterns</h2>
          <Link
            href="/shop"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 text-[14px] font-semibold text-primary hover:underline underline-offset-2"
          >
            View all patterns <ArrowGlyph />
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
          <PatternGrid variant="featured">
            {featured.map((p, i) => (
              <PatternCard key={p.id} product={p} priority={i < 2} reviewStats={reviewStatsMap.get(p.id)} />
            ))}
          </PatternGrid>
        )}
      </section>

      {/* 4 · Shop by skill level */}
      <section id="skill-levels" className="scroll-mt-24 bg-surface-warm">
        <div className="max-w-site mx-auto page-gutter py-10 md:py-14">
          <h2 className="home-h2 mb-2 text-ink">Shop by skill level</h2>
          <p className="mb-8 text-[15px] text-muted md:text-[16px]">Find patterns that match where you are right now.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {skillLevels.map((s) => (
              <Link
                key={s.level}
                href={s.link}
                className="group flex flex-col rounded-3xl border border-border bg-surface p-4 shadow-card"
              >
                <div
                  className="relative mb-5 aspect-[4/3] overflow-hidden rounded-2xl"
                  style={{ background: s.tint }}
                >
                  {s.image ? (
                    <Image
                      src={s.image}
                      alt={`${s.title} crochet patterns`}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width:767px) 100vw, 360px"
                    />
                  ) : null}
                </div>
                <LevelBadge level={s.level} className="mb-3 self-start" />
                <h3 className="mb-2 text-[20px] font-bold leading-snug text-ink">{s.title}</h3>
                <p className="mb-5 text-[15px] leading-relaxed text-muted">{s.body}</p>
                <span className="mt-auto inline-flex items-center gap-2 text-[14px] font-bold text-primary group-hover:underline underline-offset-2">
                  Browse {s.level} patterns <ArrowGlyph />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5 · Free pattern band */}
      <section className="max-w-site mx-auto page-gutter py-8 md:py-10">
        <div className="grid items-center gap-8 rounded-3xl border border-border bg-tint-sage p-6 md:p-10 lg:grid-cols-2">
          <div>
            <StatusBadge status="free" className="mb-4 !bg-white !text-free" />
            <h2 className="home-h2 mb-3 text-ink">Start with a free pattern</h2>
            <p className="mb-7 max-w-md text-[15px] leading-relaxed text-muted md:text-[16px]">
              Download a free PDF, no account needed. See the quality for yourself before you buy.
            </p>
            <Link href="/shop?price=free" className="block w-full sm:inline-block sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto" iconLeft={<DownloadGlyph />}>
                Download a free pattern
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {[0, 1].map((i) => {
              const p = freeImages[i]
              const src = p?.images?.[0]
              return (
                <div key={i} className="relative aspect-square overflow-hidden rounded-2xl bg-white">
                  {p && src ? (
                    <Link href={`/pattern/${p.slug}`} className="absolute inset-0" aria-label={p.title}>
                      <Image src={src} alt={p.title} fill className="object-cover object-center" sizes="(max-width:1023px) 45vw, 260px" />
                    </Link>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 6 · What is inside every pattern */}
      <section className="mt-6 border-y border-border bg-bg md:mt-10">
        <div className="max-w-site mx-auto grid items-center gap-10 page-gutter py-10 md:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="relative mx-auto aspect-[5/4] w-full max-w-[460px]" aria-hidden>
            <div className="absolute inset-0 -rotate-[2deg] rounded-3xl" style={{ background: 'var(--color-tint-sage)' }} />
            <div className="absolute inset-0 rotate-[1.5deg] rounded-3xl" style={{ background: 'var(--color-tint-lavender)' }} />
            <div className="absolute inset-0 flex flex-col justify-center gap-3 rounded-3xl border border-border bg-white p-8 shadow-card">
              <span className="h-3 w-1/2 rounded-full bg-tint-lavender" />
              <span className="h-2 w-full rounded-full bg-border" />
              <span className="h-2 w-11/12 rounded-full bg-border" />
              <span className="h-2 w-4/5 rounded-full bg-border" />
              <span className="mt-3 h-3 w-1/3 rounded-full bg-tint-sage" />
              <span className="h-2 w-full rounded-full bg-border" />
              <span className="h-2 w-3/4 rounded-full bg-border" />
            </div>
          </div>
          <div>
            <h2 className="home-h2 mb-2 text-ink">What is inside every pattern</h2>
            <p className="mb-8 text-[15px] text-muted md:text-[16px]">
              Everything you need to finish the project, in one clean PDF.
            </p>
            <ul className="mb-8 grid gap-6 sm:grid-cols-2">
              {INSIDE_ITEMS.map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    {f.icon}
                  </span>
                  <span>
                    <span className="block text-[15px] font-bold leading-snug text-ink">{f.title}</span>
                    <span className="mt-1 block text-[14px] leading-relaxed text-muted">{f.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/shop?price=free"
              className="inline-flex min-h-11 items-center gap-2 text-[14px] font-bold text-primary hover:underline underline-offset-2"
            >
              Try a free pattern first <ArrowGlyph />
            </Link>
          </div>
        </div>
      </section>

      {/* 7 · Meet the maker — copy and numbers come from the owner (hidden in production until supplied) */}
      {!hideOwnerCopyPlaceholders && (
        <section className="bg-bg">
          <div className="max-w-site mx-auto grid grid-cols-1 items-center gap-8 page-gutter py-10 md:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div
              className="relative aspect-[5/4] overflow-hidden rounded-3xl border border-border md:aspect-[6/5] lg:aspect-[6/5]"
              style={{ background: 'var(--color-tint-cream)' }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[13px] text-muted">Designer photo</span>
            </div>
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">Meet the maker</p>
              {/* TODO: story headline from owner */}
              <h2 className="home-h2 mb-4 text-ink">[Story headline: why these patterns exist]</h2>
              {/* TODO: maker story copy from owner */}
              <p className="mb-7 max-w-xl text-[15px] leading-relaxed text-muted md:text-[16px]">
                [Two or three sentences in your own voice: who designs the patterns, how each one is tested, and what a
                buyer can trust about them.]
              </p>
              <div className="mb-7 flex flex-wrap gap-x-10 gap-y-4">
                {[
                  { n: '[N]', l: 'Patterns designed' },
                  { n: '[N]', l: 'Makers helped' },
                  { n: '[N]', l: 'Years crocheting' },
                ].map((s) => (
                  <div key={s.l}>
                    {/* TODO: real stats from owner */}
                    <p className="text-[28px] font-extrabold leading-none text-primary">{s.n}</p>
                    <p className="mt-1 text-[13px] text-muted">{s.l}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/about"
                className="inline-flex min-h-11 items-center gap-2 text-[14px] font-bold text-primary hover:underline underline-offset-2"
              >
                Read our story <ArrowGlyph />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 8 · What makers say — hidden when there are no reviews */}
      {makerReviews.length > 0 && (
        <section id="reviews" className="bg-surface-warm">
          <div className="max-w-site mx-auto page-gutter py-10 md:py-14">
            <div className="mb-8 text-center">
              <h2 className="home-h2 mb-2 text-ink">What makers say</h2>
              <p className="text-[15px] text-muted md:text-[16px]">Real reviews from people who made our patterns.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              {makerReviews.slice(0, 3).map((t, i) => (
                <article
                  key={t.id}
                  className={`rounded-3xl border border-border bg-surface p-6 shadow-card ${i === 2 ? 'hidden md:block' : ''}`}
                >
                  <div className="mb-4 flex gap-1 text-gold" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} filled={si < Math.round(t.rating)} />
                    ))}
                  </div>
                  <p className="mb-5 text-[15px] leading-relaxed text-ink">&ldquo;{t.body}&rdquo;</p>
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

      {/* 9 · Questions, answered */}
      <section className="bg-bg">
        <div className="max-w-site mx-auto grid grid-cols-1 gap-8 page-gutter py-10 md:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="home-h2 mb-3 text-ink">Questions, answered</h2>
            <p className="mb-3 text-[15px] text-muted md:text-[16px]">The basics before you buy.</p>
            {!hideOwnerCopyPlaceholders && (
              <p className="text-[15px] text-muted">
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

function HeroTile({
  photo,
  tint,
  className = '',
  priority = false,
}: {
  photo: HeroPhoto | null
  tint: string
  className?: string
  priority?: boolean
}) {
  const image = photo ? (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      className="object-cover object-center"
      sizes="(max-width:1023px) 50vw, 340px"
      priority={priority}
    />
  ) : null
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-border ${className}`}
      style={{ background: tint }}
    >
      {photo?.href ? (
        <Link href={photo.href} className="absolute inset-0" aria-label={photo.alt}>
          {image}
        </Link>
      ) : (
        image
      )}
    </div>
  )
}

function ArrowGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}


const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

const TRUST_ITEMS = [
  {
    title: 'Instant download',
    body: 'PDF in your account in seconds',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 4v11M8 11l4 4 4-4M5 19h14" />
      </svg>
    ),
  },
  {
    title: 'Guaranteed quality',
    body: 'Clear, tested instructions',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.5l2.5 2.5 4.5-5" />
      </svg>
    ),
  },
  {
    title: 'Secure payment',
    body: 'Checkout by Lemon Squeezy',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Lifetime access',
    body: 'Re-download anytime',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M20 12a8 8 0 1 1-2.6-5.9" />
        <path d="M20 4v5h-5" />
      </svg>
    ),
  },
]

const INSIDE_ITEMS = [
  {
    title: 'Clear, round-by-round steps',
    body: 'Written instructions you can follow at your own pace.',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: 'Materials and size list',
    body: 'Yarn, hook, finished size and stitch abbreviations up front.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
      </svg>
    ),
  },
  {
    title: 'Photos for tricky steps',
    body: 'Close-up pictures where a written line is not enough.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8z" />
        <circle cx="12" cy="13" r="3.2" />
      </svg>
    ),
  },
  {
    title: 'Printable PDF, yours for good',
    body: 'Download instantly and find it again in your account anytime.',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M7 9V4h10v5M7 17H5v-7h14v7h-2M7 14h10v6H7v-6z" />
      </svg>
    ),
  },
]

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
