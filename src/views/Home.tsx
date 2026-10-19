'use client'

import { Fragment, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
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
import { DEFAULT_HOME_COPY, type Product, type HeroContent, type ChapterContent, type LayoutSection, type HomeCopy } from '../lib/types'
import { PatternCard } from '../components/PatternCard'
import { PatternGrid } from '../components/PatternGrid'
import { Button } from '../components/ui/Button'
import { EmailSignup } from '../components/EmailSignup'
import { FaqAccordion } from '../components/FaqAccordion'
import { useReviewStatsMapForLists } from '../lib/useReviewStatsMap'
import { ProductGridSkeleton } from '../components/Skeleton'
import { fetchMakerReviewsForHome, type MakerReviewCard } from '../lib/reviews'
import { HOME_FAQ } from '../lib/homeFaq'
import { deriveVariantUrl } from '../lib/imageVariants'

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
    setCategories: (v: CategoryWithCount[]) => void
    setHero: Dispatch<SetStateAction<HeroContent | null>>
    setCopy: (v: HomeCopy) => void
    setSkillCounts: (v: HomeCatalogSnapshot['skillCounts']) => void
  },
) {
  setters.setTrending(snap.trending)
  setters.setFreeProduct(snap.freeProduct)
  setters.setFreePatternCollage(snap.freePatternCollage ?? [])
  setters.setChapters(snap.chapters)
  setters.setCategories(snap.categories ?? [])
  setters.setSkillCounts(snap.skillCounts)
  if (snap.copy) setters.setCopy(snap.copy)
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
  const [copy, setCopy] = useState<HomeCopy>(() => seed?.copy ?? DEFAULT_HOME_COPY)
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

  const productPhoto = (match: (p: Product) => boolean) => trending.find((p) => match(p) && p.images?.[0])?.images?.[0]
  const categoryBySlug = (needle: string) => categories.find((c) => `${c.name} ${c.link}`.toLowerCase().includes(needle))
  const collections = [
    {
      n: '01 / Just starting',
      t: 'Beginner-friendly',
      d: 'Approachable projects for your first stitches and your next little win.',
      go: 'Explore beginner patterns',
      href: '/shop?level=beginner',
      img: chapters.find((c) => c.level === 'beginner')?.image || productPhoto((p) => p.skill_level === 'beginner'),
      count: skillCounts.beginner,
    },
    {
      n: '02 / Make it yours',
      t: 'Amigurumi friends',
      d: 'Soft little characters, keepsakes, and handmade gifts full of charm.',
      go: 'Meet the collection',
      href: '/shop/amigurumi',
      img: categoryBySlug('amigurumi')?.image || productPhoto(() => true),
      count: categoryBySlug('amigurumi')?.count ?? 0,
    },
    {
      n: '03 / Ready for more',
      t: 'Wearables & more',
      d: 'Thoughtful designs to bring texture, colour, and personality to everyday life.',
      go: 'Find your next project',
      href: '/shop/wearables',
      img: categoryBySlug('wearable')?.image || chapters.find((c) => c.level === 'advanced')?.image || productPhoto((p) => p.skill_level === 'advanced'),
      count: categoryBySlug('wearable')?.count ?? 0,
    },
  ]

  const reviewStatsMap = useReviewStatsMapForLists([trending])
  const featured = trending.slice(0, 4)
  // Story section: two real finished makes (not the ones already shown in "Featured").
  const storyPhotos = trending
    .slice(4)
    .filter((p) => p.images?.[0])
    .slice(0, 2)
    .map((p) => ({ src: p.images[0], alt: p.title }))
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
      setCategories,
      setHero,
      setCopy,
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

  const faqItems = hideOwnerCopyPlaceholders
    ? HOME_FAQ
    : [...HOME_FAQ, FAQ_ITEM_FILE_ISSUE_PLACEHOLDER]


  return (
    <div className="bg-bg">
      {/* 1 · Hero */}
      <section className="mx-auto grid max-w-site items-center gap-8 page-gutter py-10 md:py-14 lg:grid-cols-[1fr_1.02fr] lg:gap-[5%] lg:py-[55px]">
        <div>
          <p className="eyebrow">{copy.hero_eyebrow}</p>
          <h1 className="my-5 font-heading text-[clamp(48px,6.1vw,86px)] font-normal leading-[0.98] tracking-[-0.045em] text-ink md:my-6">
            {copy.hero_title.split('\n').map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {line.split(/(\*[^*]+\*)/).map((part, j) =>
                  part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
                    <em key={j} className="relative inline-block not-italic text-coral">
                      {part.slice(1, -1)}
                      <svg aria-hidden viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-[0.14em] w-full text-[#E2B764]">
                        <path d="M2 7 C 20 1, 36 11, 56 6 S 92 2, 112 7 S 150 11, 170 5 S 192 4, 198 6" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                      </svg>
                    </em>
                  ) : (
                    part
                  ),
                )}
              </Fragment>
            ))}
            <span className="sr-only"> Crochet patterns, ready to download.</span>
          </h1>
          <p className="mb-7 max-w-[420px] text-[14px] leading-[1.9] text-muted">
            {copy.hero_subtitle}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={heroPrimaryHref(hero?.cta_link)}>
              <Button variant="primary" size="lg" className="w-full sm:w-auto" iconRight={<span aria-hidden>↗</span>}>
                {copy.hero_cta}
              </Button>
            </Link>
            <Link href={heroSecondaryHref(hero?.secondary_cta_link)}>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                {copy.hero_cta2}
              </Button>
            </Link>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-[22px] gap-y-2 text-[11px] text-muted">
            {['Instant PDF downloads', 'Made for every skill level'].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <span className="text-coral" aria-hidden>✳</span>
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-5 -rotate-2 font-hand text-[24px] font-bold leading-none text-coral" aria-hidden>
            psst… it’s in your downloads in a minute ↗
          </p>
        </div>

        {/* Yellow art panel — real photo framed over a pink sun */}
        <div className="relative isolate grid min-h-[360px] place-items-center overflow-hidden rounded-[5px] bg-sun sm:min-h-[430px] lg:min-h-[470px]">
          <span aria-hidden className="absolute -z-0 size-[220px] rounded-full bg-pink sm:size-[280px]" style={{ top: 35, right: '10%' }} />
          <span aria-hidden className="absolute right-[10%] top-[8%] text-[46px] leading-none text-violet">✳</span>
          <span aria-hidden className="pointer-events-none absolute inset-4 z-[1] border-2 border-navy/20" />
          {heroTiles[0] ? (
            <div className="relative z-[2] -mt-10 w-[70%] max-w-[440px] -rotate-2 rounded-[3px] bg-white p-2 shadow-[0_18px_30px_rgba(32,32,68,0.22)] sm:-mt-14">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2px]">
                <Image
                  src={deriveVariantUrl(heroTiles[0].src, 'large')}
                  alt={heroTiles[0].alt}
                  fill
                  priority
                  sizes="(max-width:1023px) 70vw, 470px"
                  className="object-cover object-center"
                />
              </div>
            </div>
          ) : null}
          <p className="absolute bottom-[26px] left-[29px] z-[3] hidden font-heading text-[19px] leading-tight text-ink sm:block">
            Make something amazing
            <small className="mt-[7px] block font-sans text-[11px] font-semibold uppercase tracking-[0.18em]">
              Patterns for your next project
            </small>
          </p>
          {heroTiles[0]?.href ? (
            <Link
              href={heroTiles[0].href}
              className="absolute bottom-[22px] right-[18px] z-[3] rotate-3 rounded-[3px] bg-white px-[15px] py-3 text-[13px] font-extrabold text-ink shadow-[0_5px_18px_rgba(0,0,0,0.08)] hover:text-violet sm:bottom-[30px] sm:right-[25px] sm:text-[15px]"
            >
              Your next favourite make
            </Link>
          ) : (
            <span className="absolute bottom-[30px] right-[25px] z-[3] rotate-3 rounded-[3px] bg-white px-[15px] py-3 text-[13px] font-extrabold text-ink sm:text-[15px]">
              Your next favourite make
            </span>
          )}
        </div>
      </section>

      {/* 2 · Ticker */}
      <section className="border-y-2 border-navy bg-sun">
        <ul className="mx-auto flex max-w-site flex-wrap justify-between gap-x-5 gap-y-2 page-gutter py-[18px] text-[11px] font-bold uppercase tracking-[0.13em] text-navy">
          {['Small projects, big joy', 'Patterns to keep forever', 'Creative time, your way', 'Download and get making'].map((t) => (
            <li key={t} className="inline-flex items-center gap-2.5">
              <span className="text-coral" aria-hidden>✳</span>
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* 3 · Patterns to fall for */}
      <section className="max-w-site mx-auto page-gutter py-[58px] md:py-[88px]">
        <div className="reveal mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Your next favourite project</p>
            <h2 className="mt-[13px] font-heading text-[clamp(35px,4vw,52px)] font-normal leading-[1.06] tracking-[-0.035em] text-ink">
              Patterns to fall for.
            </h2>
          </div>
          <div>
            <p className="mb-3 max-w-[310px] text-[12px] leading-[1.7] text-muted">
              Meet the little characters and thoughtful designs makers are loving right now.
            </p>
            <Link
              href="/shop"
              className="inline-block whitespace-nowrap border-b-2 border-coral pb-[7px] text-[11px] font-bold uppercase tracking-[0.14em] text-ink hover:text-violet"
            >
              Shop all patterns ↗
            </Link>
          </div>
        </div>
        {!catalogReady ? (
          <ProductGridSkeleton variant="featured" count={4} />
        ) : featuredError ? (
          <div className="py-10 text-center">
            <p className="mb-3 text-[14px] text-muted">{featuredError}</p>
            <button
              type="button"
              className="text-[13px] font-semibold text-ink underline"
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

      {/* 4 · Collections (navy band) */}
      <section id="collections" className="scroll-mt-20 bg-navy py-[58px] text-white md:py-20">
        <div className="mx-auto max-w-site page-gutter">
          <p className="eyebrow text-white before:bg-white">Find your kind of making</p>
          <div className="mb-8 mt-4 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <h2 className="font-heading text-[clamp(35px,4vw,52px)] font-normal leading-[1.06] tracking-[-0.035em]">
              A little something
              <br />
              for every maker.
            </h2>
            <p className="max-w-[310px] text-[12px] leading-[1.7] text-white/70">
              Choose your pace, pick your project, and enjoy the process one stitch at a time.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3 md:gap-4">
            {collections.map((c) => (
              <Link
                key={c.t}
                href={c.href}
                className="press-card group relative isolate flex min-h-[320px] flex-col justify-end overflow-hidden rounded-[5px] bg-[#222] text-white md:aspect-[4/5] md:min-h-0"
              >
                {c.img ? (
                  <Image
                    src={deriveVariantUrl(c.img, 'large')}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                    className="-z-20 object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.05] motion-reduce:transition-none"
                  />
                ) : null}
                <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                <span className="absolute left-[22px] top-[22px] rounded-[3px] bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-ink">
                  {c.n}
                </span>
                <div className="p-[22px] md:p-6">
                  <h3 className="font-heading text-[30px] font-normal leading-tight tracking-[-0.02em] md:text-[34px]">{c.t}</h3>
                  <p className="mt-2 max-w-[300px] text-[13px] leading-[1.6] text-white/80">{c.d}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/25 pt-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.13em]">
                      {c.go}
                      {c.count > 0 ? <span className="font-normal text-white/70"> · {c.count} {c.count === 1 ? 'pattern' : 'patterns'}</span> : null}
                    </span>
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5 · Story */}
      <section className="bg-peach">
      <div className="reveal mx-auto grid max-w-site items-center gap-8 page-gutter py-[58px] md:py-[88px] lg:grid-cols-2 lg:gap-[8%]">
        {storyPhotos.length > 0 ? (
          <div className="relative mx-auto w-full max-w-[640px] pb-10 pr-8 md:pb-14 md:pr-12 lg:max-w-none">
            <div className="relative aspect-[16/10] overflow-hidden rounded-[5px] bg-surface-warm">
              <Image
                src={deriveVariantUrl(storyPhotos[0].src, 'large')}
                alt={storyPhotos[0].alt}
                fill
                sizes="(max-width:1023px) 90vw, 560px"
                className="object-cover object-[50%_20%]"
              />
            </div>
            {storyPhotos[1] ? (
              <div className="absolute bottom-0 right-0 aspect-square w-[42%] overflow-hidden rounded-[5px] border-[6px] border-bg bg-surface-warm shadow-[0_14px_28px_rgba(0,0,0,0.14)]">
                <Image
                  src={deriveVariantUrl(storyPhotos[1].src, 'large')}
                  alt={storyPhotos[1].alt}
                  fill
                  sizes="(max-width:1023px) 40vw, 260px"
                  className="object-cover object-center"
                />
              </div>
            ) : null}
          </div>
        ) : null}
        <div>
          <p className="eyebrow">{copy.story_eyebrow}</p>
          <h2 className="my-[18px] font-heading text-[clamp(38px,4vw,55px)] font-normal leading-[1.08] tracking-[-0.035em] text-ink">
            {copy.story_title}
          </h2>
          <p className="mb-3 max-w-[460px] text-[13px] leading-[1.9] text-muted">
            {copy.story_p1}
          </p>
          <p className="mb-5 max-w-[460px] text-[13px] leading-[1.9] text-muted">
            {copy.story_p2}
          </p>
          <Link href="/shop">
            <Button variant="primary" size="lg" iconRight={<span aria-hidden>↗</span>}>
              {copy.story_cta}
            </Button>
          </Link>
        </div>
      </div>
      </section>

      {/* 6 · Three steps */}
      <section className="mx-auto max-w-site page-gutter pb-[58px] md:pb-[88px]">
        <div className="reveal mb-8 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Simple from the very start</p>
            <h2 className="mt-[13px] font-heading text-[clamp(35px,4vw,52px)] font-normal leading-[1.06] tracking-[-0.035em] text-ink">
              Your next project, in three steps.
            </h2>
          </div>
          <p className="max-w-[310px] text-[12px] leading-[1.7] text-muted">
            Less searching, more making. Start whenever inspiration strikes.
          </p>
        </div>
        <ol className="reveal grid border-y border-border md:grid-cols-3">
          {[
            { n: '01', t: 'Choose a pattern', d: 'Find a design that fits your mood, skill level, and next creative idea.' },
            { n: '02', t: 'Download instantly', d: 'Your digital PDF is ready after purchase, so there is no waiting for delivery.' },
            { n: '03', t: 'Make something lovely', d: 'Gather your yarn, settle in, and enjoy bringing your next project to life.' },
          ].map((st, i) => (
            <li
              key={st.n}
              className={`py-[25px] md:pr-[26px] ${i > 0 ? 'border-t border-border md:border-l md:border-t-0 md:pl-[26px]' : ''}`}
            >
              <b className="text-[24px] font-black text-coral">{st.n}</b>
              <h3 className="mb-2 mt-3.5 text-[20px] font-bold leading-snug text-ink">{st.t}</h3>
              <p className="max-w-[270px] text-[12px] leading-[1.8] text-muted">{st.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 7 · Free feature */}
      <section className="mx-auto max-w-site page-gutter pb-[58px] md:pb-[88px]">
        <div className="reveal grid min-h-[310px] overflow-hidden rounded-[5px] bg-coral text-white md:grid-cols-[1.1fr_1fr]">
          <div className="relative grid min-h-[230px] place-items-center overflow-hidden bg-sun">
            {freeImages[0]?.images?.[0] ? (
              <Link
                href={`/pattern/${freeImages[0].slug}`}
                aria-label={freeImages[0].title}
                className="relative block w-[64%] max-w-[320px] rotate-2 rounded-[3px] bg-white p-2 shadow-[0_16px_26px_rgba(32,32,68,0.2)]"
              >
                <span className="relative block aspect-[4/3] overflow-hidden rounded-[2px]">
                  <Image
                    src={deriveVariantUrl(freeImages[0].images[0], 'large')}
                    alt={freeImages[0].title}
                    fill
                    sizes="(max-width:767px) 60vw, 320px"
                    className="object-cover object-center"
                  />
                </span>
              </Link>
            ) : (
              <FlowerArt className="w-[70%] max-w-[320px]" />
            )}
          </div>
          <div className="self-center p-[26px] md:p-12">
            <p className="eyebrow text-white before:bg-white">A little gift from us</p>
            <h2 className="my-[17px] font-heading text-[clamp(34px,4vw,48px)] font-normal leading-[1.08] tracking-[-0.035em]">
              Good things start with one stitch.
            </h2>
            <p className="mb-2 max-w-[360px] text-[12px] leading-[1.8] text-white/90">
              Try something new with our free crochet patterns. Pick a project, gather your yarn, and make a little time for
              yourself.
            </p>
            <Link href="/shop?price=free" className="mt-3 inline-block">
              <span className="inline-flex min-h-12 items-center justify-center rounded-[3px] border-2 border-white bg-white px-[22px] text-[11px] font-bold uppercase tracking-[0.12em] text-navy transition-colors hover:bg-navy hover:text-white">
                Explore free patterns ↗
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 8 · Meet the maker — owner copy; hidden in production until supplied */}
      {!hideOwnerCopyPlaceholders && (
        <section className="bg-surface-warm">
          <div className="max-w-site mx-auto grid grid-cols-1 items-center gap-8 page-gutter py-[58px] md:py-[88px] lg:grid-cols-2 lg:gap-[8%]">
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-[5px] lg:aspect-[4/5] lg:max-w-[440px]"
              style={{ background: 'var(--color-tint-cream)' }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[13px] text-muted">Designer photo</span>
            </div>
            <div>
              <p className="eyebrow">Meet the maker</p>
              {/* TODO: story headline from owner */}
              <h2 className="my-4 font-heading text-[clamp(34px,4vw,48px)] font-normal leading-[1.08] tracking-[-0.035em] text-ink">
                [Story headline: why these patterns exist]
              </h2>
              {/* TODO: maker story copy from owner */}
              <p className="mb-6 max-w-xl text-[13px] leading-[1.9] text-muted">
                [Two or three sentences in your own voice: who designs the patterns, how each one is tested, and what a
                buyer can trust about them.]
              </p>
              <div className="mb-6 flex flex-wrap gap-x-12 gap-y-4 border-t border-border pt-6">
                {[
                  { n: '[N]', l: 'Patterns designed' },
                  { n: '[N]', l: 'Makers helped' },
                  { n: '[N]', l: 'Years crocheting' },
                ].map((s) => (
                  <div key={s.l}>
                    {/* TODO: real stats from owner */}
                    <p className="font-heading text-[40px] font-normal leading-none text-ink">{s.n}</p>
                    <p className="mt-1.5 text-[12px] text-muted">{s.l}</p>
                  </div>
                ))}
              </div>
              <Link href="/about" className="inline-block border-b-2 border-coral pb-[7px] text-[11px] font-bold uppercase tracking-[0.14em] text-ink hover:text-violet">
                Read our story ↗
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 9 · Reviews (only when real reviews exist) */}
      {makerReviews.length > 0 && (
        <section id="reviews" className="mx-auto max-w-site scroll-mt-20 page-gutter pb-[58px] md:pb-[88px]">
          <p className="eyebrow">What makers say</p>
          <h2 className="mb-8 mt-[13px] font-heading text-[clamp(35px,4vw,52px)] font-normal leading-[1.06] tracking-[-0.035em] text-ink">
            Kind words from makers.
          </h2>
          <div className={`grid gap-3 md:gap-4 ${makerReviews.length === 1 ? 'md:grid-cols-1' : makerReviews.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {makerReviews.slice(0, 3).map((t, i) => (
              <figure
                key={t.id}
                className={`rounded-[5px] p-[25px] text-navy ${['bg-aqua', 'bg-pink', 'bg-butter'][i % 3]} ${i === 2 ? 'hidden md:block' : ''}`}
              >
                <div className="mb-3 flex gap-0.5 text-navy" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} filled={si < Math.round(t.rating)} />
                  ))}
                </div>
                <blockquote className="mb-5 font-heading text-[22px] leading-[1.25]">&ldquo;{t.body}&rdquo;</blockquote>
                <figcaption className="text-[11px] font-bold uppercase tracking-[0.13em]">
                  {t.reviewerFirstName}
                  <span className="font-medium normal-case tracking-normal opacity-75"> · {t.patternTitle}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* 10 · FAQ */}
      <section className="bg-pink-soft">
        <div className="reveal max-w-site mx-auto grid grid-cols-1 gap-8 page-gutter py-[58px] md:py-[88px] lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow">Questions, answered</p>
            <h2 className="my-[13px] font-heading text-[clamp(35px,4vw,52px)] font-normal leading-[1.06] tracking-[-0.035em] text-ink">
              The basics before you buy.
            </h2>
            {!hideOwnerCopyPlaceholders && (
              <p className="text-[13px] text-muted">
                Still stuck? Write to {/* TODO: support email from owner */}
                <span className="text-ink underline">[SUPPORT EMAIL]</span>
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

function FlowerArt({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 240" className={className} role="img" aria-label="Small handmade flower illustration">
      <path d="M150 225 Q150 160 151 106" stroke="#728567" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M150 175 Q105 132 92 169 Q116 193 150 175 M151 145 Q189 104 209 139 Q187 164 151 145" fill="#a8b89a" stroke="#728567" strokeWidth="2" />
      <g transform="translate(150 83)">
        <ellipse cx="0" cy="-35" rx="21" ry="34" fill="#d6a18f" />
        <ellipse cx="33" cy="-10" rx="21" ry="34" transform="rotate(65 33 -10)" fill="#d6a18f" />
        <ellipse cx="20" cy="28" rx="21" ry="34" transform="rotate(140 20 28)" fill="#d6a18f" />
        <ellipse cx="-21" cy="28" rx="21" ry="34" transform="rotate(220 -21 28)" fill="#d6a18f" />
        <ellipse cx="-33" cy="-10" rx="21" ry="34" transform="rotate(295 -33 -10)" fill="#d6a18f" />
        <circle r="20" fill="#d6c28b" stroke="#aa986b" strokeWidth="2" />
      </g>
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
