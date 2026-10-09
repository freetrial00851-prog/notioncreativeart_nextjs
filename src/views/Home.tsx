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

function HeroTile({
  src,
  label,
  tint,
  className = '',
  priority = false,
  sizes,
}: {
  src: string | null
  label: string
  tint: string
  className?: string
  priority?: boolean
  sizes: string
}) {
  return (
    <div className={`relative overflow-hidden border border-border rounded-[18px] ${className}`} style={{ background: tint }}>
      {src ? (
        <Image src={src} alt="" fill className="object-cover" sizes={sizes} priority={priority} />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[13px] text-muted">{label}</span>
      )}
    </div>
  )
}

/** Mobile + laptop: large left + two stacked. Tablet: three equal columns. */
function HeroCollage({ images }: { images: string[] }) {
  const slots = [0, 1, 2].map((i) => images[i] ?? null)
  return (
    <>
      {/* Mobile <768: collage */}
      <div className="grid grid-cols-2 gap-3 h-[280px] md:hidden">
        <HeroTile src={slots[0]} label="Hero photo" tint={HERO_TINTS[0]} className="row-span-2" priority sizes="50vw" />
        <HeroTile src={slots[1]} label="Pattern photo" tint={HERO_TINTS[1]} sizes="40vw" />
        <HeroTile src={slots[2]} label="Pattern photo" tint={HERO_TINTS[2]} sizes="40vw" />
      </div>
      {/* Tablet 768–1023: three equal tiles */}
      <div className="hidden md:grid lg:hidden grid-cols-3 gap-4 h-[320px]">
        <HeroTile src={slots[0]} label="Hero photo" tint={HERO_TINTS[0]} priority sizes="30vw" />
        <HeroTile src={slots[1]} label="Pattern photo" tint={HERO_TINTS[1]} sizes="30vw" />
        <HeroTile src={slots[2]} label="Pattern photo" tint={HERO_TINTS[2]} sizes="30vw" />
      </div>
      {/* Laptop: collage beside copy */}
      <div className="hidden lg:grid grid-cols-2 gap-4 h-[420px]">
        <HeroTile src={slots[0]} label="Hero photo" tint={HERO_TINTS[0]} className="row-span-2" priority sizes="320px" />
        <HeroTile src={slots[1]} label="Pattern photo" tint={HERO_TINTS[1]} sizes="200px" />
        <HeroTile src={slots[2]} label="Pattern photo" tint={HERO_TINTS[2]} sizes="200px" />
      </div>
    </>
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
      {/* Hero — DESIGN_SPEC §4.1.2 */}
      <section className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div>
            <p className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold tracking-[0.12em] uppercase text-primary mb-4">
              {hero?.eyebrow?.trim() || 'Crochet patterns for every maker'}
            </p>
            <h1 className="font-heading text-[32px] md:text-5xl lg:text-[52px] font-bold leading-[1.1] text-ink mb-4">
              Beautiful crochet patterns, ready to download.
            </h1>
            <p className="text-[15px] text-muted leading-relaxed mb-7 max-w-md">
              Clear, tested PDF patterns for every skill level. Pay once, download instantly and keep them for life.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link href={heroPrimaryHref(hero?.cta_link)} className="sm:flex-1 lg:flex-none">
                <Button variant="primary" size="lg" className="w-full sm:w-auto" iconRight={<span aria-hidden>→</span>}>
                  {(hero?.cta_text || 'Shop all patterns').replace(/\s*→\s*$/, '')}
                </Button>
              </Link>
              <Link href={heroSecondaryHref(hero?.secondary_cta_link)} className="sm:flex-1 lg:flex-none">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  {hero?.secondary_cta_text || 'Get a free pattern'}
                </Button>
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-ink">
              {['Instant download', 'Printable PDF', 'Secure checkout'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckTiny />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroCollage images={hero?.images ?? []} />
        </div>
      </section>

      {/* Trust strip — §4.1.3 */}
      <section className="border-y border-border bg-surface">
        <div className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-8 md:py-10 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {[
            { title: 'Instant download', body: 'PDF in your account in seconds' },
            { title: 'Guaranteed quality', body: 'Clear, tested instructions' },
            { title: 'Secure payment', body: 'Checkout by Lemon Squeezy' },
            { title: 'Lifetime access', body: 'Re-download anytime' },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 items-start">
              <span className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center shrink-0">
                <TrustIcon title={item.title} />
              </span>
              <div>
                <p className="text-[14px] font-bold text-ink">{item.title}</p>
                <p className="text-[13px] text-muted leading-snug">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured — §4.1.4 */}
      <section className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink">Featured patterns</h2>
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

      {/* Shop by skill — §4.1.5 */}
      <section className="bg-surface-warm">
        <div className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-12 md:py-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink mb-2">Shop by skill level</h2>
          <p className="text-[14px] text-muted mb-8 max-w-lg">
            Find patterns that match where you are right now.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {skillLevels.map((s) => (
              <article key={s.level} className="rounded-2xl border border-border bg-surface overflow-hidden shadow-card flex flex-col">
                {/* Image on tablet/laptop only — mobile skill cards are text-first */}
                <div className="relative aspect-[4/3] hidden md:block" style={{ background: s.tint }}>
                  {s.image ? (
                    <Image src={s.image} alt="" fill className="object-cover" sizes="33vw" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[13px] text-muted capitalize">
                      {s.level} photo
                    </span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <LevelBadge level={s.level} className="mb-3 self-start" />
                  <h3 className="text-[17px] font-bold text-ink mb-1.5">{s.title}</h3>
                  <p className="text-[14px] text-muted leading-relaxed mb-4 flex-1">{s.body}</p>
                  <Link href={s.link} className="text-[13px] font-semibold text-primary hover:underline underline-offset-2">
                    Browse {s.level} patterns →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Free pattern band — §4.1.6 */}
      <section className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-12 md:py-16">
        <div
          className="rounded-[24px] p-6 md:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-8 items-center"
          style={{ background: 'var(--color-tint-sage)' }}
        >
          <div>
            <StatusBadge status="free" className="!bg-white !text-free mb-4" />
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink mb-3">Start with a free pattern</h2>
            <p className="text-[14px] text-muted leading-relaxed mb-6 max-w-md">
              Download a free PDF, no account needed. See the quality for yourself before you buy.
            </p>
            <Link href="/shop?price=free" className="block sm:inline-block w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto" iconLeft={<DownloadGlyph />}>
                Download a free pattern
              </Button>
            </Link>
          </div>
          {/* Mobile: one photo; tablet/laptop: two */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[0, 1].map((i) => {
              const p = freeImages[i]
              return (
                <div
                  key={i}
                  className={`relative aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden border border-border bg-white ${i === 1 ? 'hidden md:block' : ''}`}
                >
                  {p?.images?.[0] ? (
                    <Link href={`/pattern/${p.slug}`}>
                      <Image src={p.images[0]} alt={p.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 160px" />
                    </Link>
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[12px] text-muted px-2 text-center">
                      Free pattern photo
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* What's inside — §4.1.7 */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute inset-x-6 top-4 bottom-0 rounded-2xl bg-border/60 translate-y-2" aria-hidden />
            <div className="absolute inset-x-3 top-2 bottom-0 rounded-2xl bg-border/40 translate-y-1" aria-hidden />
            <div className="relative aspect-[3/4] rounded-2xl border border-border bg-white shadow-card flex items-center justify-center text-[13px] text-muted">
              Sample pattern page
            </div>
          </div>
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink mb-2">What is inside every pattern</h2>
            <p className="text-[14px] text-muted mb-8">Everything you need to finish the project, in one clean PDF.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 mb-8">
              {(
                [
                  { t: 'Clear, round-by-round steps', d: 'Written instructions you can follow at your own pace.', icon: 'steps' as const },
                  { t: 'Materials and size list', d: 'Yarn, hook, finished size and stitch abbreviations up front.', icon: 'list' as const },
                  { t: 'Photos for tricky steps', d: 'Close-up pictures where a written line is not enough.', icon: 'camera' as const },
                  { t: 'Printable PDF, yours for good', d: 'Download instantly and find it again in your account anytime.', icon: 'print' as const },
                ] as const
              ).map((f) => (
                <div
                  key={f.t}
                  className="flex gap-3 rounded-2xl border border-border bg-surface p-4 md:border-0 md:bg-transparent md:p-0"
                >
                  <span className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                    <InsideIcon name={f.icon} />
                  </span>
                  <div>
                    <p className="text-[14px] font-bold text-ink mb-1">{f.t}</p>
                    <p className="text-[13px] text-muted leading-relaxed">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/shop?price=free" className="text-[13px] font-semibold text-primary hover:underline underline-offset-2">
              Try a free pattern first →
            </Link>
          </div>
        </div>
      </section>

      {/* Meet the maker — §4.1.8; hidden in production until owner copy/stats exist */}
      {!hideOwnerCopyPlaceholders && (
        <section className="bg-surface-warm">
          <div className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div
              className="relative aspect-[4/5] rounded-2xl border border-border overflow-hidden"
              style={{ background: 'var(--color-tint-cream)' }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[13px] text-muted">Designer photo</span>
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary mb-3">Meet the maker</p>
              {/* TODO: story headline from owner */}
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink mb-4">
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
          <div className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-12 md:py-16">
            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink mb-2">What makers say</h2>
              <p className="text-[14px] text-muted">Real reviews from people who made our patterns.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {makerReviews.slice(0, 3).map((t, i) => (
                <article
                  key={t.id}
                  className={`rounded-2xl border border-border bg-surface p-6 shadow-card ${i === 2 ? 'hidden md:block' : ''}`}
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

      {/* FAQ — §4.1.10 */}
      <section className="bg-bg border-t border-border">
        <div className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink mb-2">Questions, answered</h2>
            <p className="text-[14px] text-muted mb-3">The basics before you buy.</p>
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

function CheckTiny() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-free shrink-0">
      <path d="M5 12.5l5 5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function TrustIcon({ title }: { title: string }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' as const, 'aria-hidden': true }
  if (title.startsWith('Instant')) {
    return (
      <svg {...common}>
        <path d="M12 4v10M8 10l4 4 4-4M5 18h14" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (title.startsWith('Guaranteed')) {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" stroke="var(--color-primary)" strokeWidth="2" />
        <path d="M8.5 12.5l2.2 2.2 4.8-5" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (title.startsWith('Secure')) {
    return (
      <svg {...common}>
        <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M4 12a8 8 0 0 1 14.5-4.5M20 12a8 8 0 0 1-14.5 4.5" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 3v4h-4M6 21v-4h4" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InsideIcon({ name }: { name: 'steps' | 'list' | 'camera' | 'print' }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' as const, 'aria-hidden': true }
  if (name === 'steps') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" stroke="var(--color-primary)" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" stroke="var(--color-primary)" strokeWidth="2" />
      </svg>
    )
  }
  if (name === 'list') {
    return (
      <svg {...common}>
        <path d="M9 7h10M9 12h10M9 17h10M5 7h.01M5 12h.01M5 17h.01" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'camera') {
    return (
      <svg {...common}>
        <path d="M4 8h3l1.5-2h7L17 8h3v11H4V8z" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="12" cy="13" r="3" stroke="var(--color-primary)" strokeWidth="2" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M7 8h10v3H7V8zM8 11h8v7H8v-7zM10 3h4v3h-4V3z" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}
