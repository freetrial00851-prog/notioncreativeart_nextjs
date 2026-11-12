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
import { Button } from '../components/ui/Button'
import { MaterialIcon } from '../components/MaterialIcon'
import { MAKER } from '../content/maker'
import { EmailSignup } from '../components/EmailSignup'
import { FaqAccordion } from '../components/FaqAccordion'
import { useReviewStatsMapForLists } from '../lib/useReviewStatsMap'
import { ProductGridSkeleton } from '../components/Skeleton'
import { fetchMakerReviewsForHome, type MakerReviewCard } from '../lib/reviews'
import { HOME_FAQ } from '../lib/homeFaq'
import { deriveVariantUrl } from '../lib/imageVariants'
import { HomeGuides } from '../components/home/HomeGuides'
import { HOME_ANIMALS } from '../components/home/HomeAnimals'

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
  if (!raw || raw === '/shop' || raw === '/shop/') return '/free-crochet-patterns'
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

const IMG = 'https://anlsellghialszuuvipw.supabase.co/storage/v1/object/public/product-images/'

/** Entry points shown as photo tiles. Photos are real listing photos, cropped to the tile with object-position. */
const BENTO: { href: string; t: string; d: string; img: string; pos: string; cls: string; big?: boolean }[] = [
  { href: '/crochet-patterns-for-beginners', t: 'Crochet patterns for beginners', d: 'Easy, round-by-round patterns marked beginner level. Start here if this is your first toy.', img: `${IMG}8f2a3d96-546b-4144-9ea3-7f175e1ad521-panda_plushies_sitting_on_rug_202608311736-card.webp`, pos: 'center 45%', cls: 'col-span-2 md:row-span-2 md:min-h-[400px]', big: true },
  { href: '/free-crochet-patterns', t: 'Free patterns', d: 'Download, no account.', img: `${IMG}d05e0630-c304-48d7-90de-0ab80d01085e-amigurumi_fox_toy_sitting_202609011508-card.webp`, pos: 'center 35%', cls: '' },
  { href: '/mini-amigurumi-and-keychains', t: 'Mini and keychains', d: 'Done in an evening.', img: `${IMG}e0d4b414-cead-455e-b1c4-e1e21e0d8dd2-fox_charms_on_fabric_background_202609091755-card.webp`, pos: 'center 50%', cls: '' },
  { href: '/amigurumi-in-clothes-and-hats', t: 'Dressed amigurumi', d: 'Dresses, hats, scarves.', img: `${IMG}5daae6be-5205-4ce7-bd4f-7d19aa5e10bf-bunny_seated_on_rag_rug_202608231850-card.webp`, pos: 'center 40%', cls: '' },
  { href: '/shop/wearables', t: 'Wearables', d: 'Tops, cardigans, skirts.', img: `${IMG}7fe012af-9779-4a49-9a68-5e9726220115-nnnew-copy-of-safety-guides-for-etsy-cover-1-card.webp`, pos: 'center 30%', cls: '' },
  { href: '/shop/home-decor', t: 'Home decor', d: 'Flowers, coasters, cushions.', img: `${IMG}b0134faa-f9b7-4ece-b6a5-d750aa361314-crochet_tulip_bouquet_in_jar_202607031928-card.webp`, pos: 'center 55%', cls: 'col-span-2' },
  { href: '/guides', t: 'Learn to crochet', d: 'Free step-by-step guides with photos.', img: '/guides/how-to-single-crochet/sc-02.webp', pos: 'center 50%', cls: 'col-span-2' },
]

type HeroPhoto = { src: string; alt: string; href?: string }

export function HomeNew({
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
  const [, setChapters] = useState<ChapterContent[]>(() => seed?.chapters ?? [])
  const [, setCategories] = useState<CategoryWithCount[]>(() => seed?.categories ?? [])
  const [, setSkillCounts] = useState<HomeCatalogSnapshot['skillCounts']>(
    () => seed?.skillCounts ?? { beginner: 0, intermediate: 0, advanced: 0 },
  )
  const [makerReviews, setMakerReviews] = useState<MakerReviewCard[]>([])
  const [catalogReady, setCatalogReady] = useState(() => Boolean(seed))
  const [featuredError, setFeaturedError] = useState<string | null>(() => initialFeaturedError ?? null)
  const [catalogReloadKey, setCatalogReloadKey] = useState(0)
  void initialLayout
  void DEFAULT_LAYOUT // retained for page.tsx prop compatibility / future CMS layout

  const reviewStatsMap = useReviewStatsMapForLists([trending])
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
    <div className="flex flex-col bg-bg">
      {/* 1 · Hero */}
      <section className="order-1 mx-auto grid max-w-site items-center gap-8 page-gutter py-10 md:py-14 lg:grid-cols-[1fr_1.02fr] lg:gap-[5%] lg:py-[55px]">
        <div>
          <p className="eyebrow hero-rise">{copy.hero_eyebrow}</p>
          <h1 className="hero-rise-y my-5 font-heading text-[clamp(40px,5.2vw,68px)] font-semibold leading-[1.12] tracking-[-0.01em] text-ink md:my-6">
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
          </h1>
          <p className="hero-rise mb-7 max-w-[420px] text-[14px] leading-[1.9] text-muted" style={{ ["--d" as string]: "120ms" }}>
            {copy.hero_subtitle}
          </p>
          <div className="hero-rise flex flex-col gap-3 sm:flex-row" style={{ ["--d" as string]: "220ms" }}>
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
          <ul className="hero-rise mt-9 flex flex-wrap gap-x-[22px] gap-y-2 text-[12px] text-muted">
            {['Instant PDF downloads', 'Made for every skill level', 'Free crochet patterns included'].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <span className="text-coral" aria-hidden>✳</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Yellow art panel — real photo framed over a pink sun */}
        <div className="hero-settle relative isolate grid min-h-[360px] place-items-center overflow-hidden rounded-2xl bg-sun sm:min-h-[430px] lg:min-h-[470px]">
          <span aria-hidden className="absolute -z-0 size-[220px] rounded-full bg-pink sm:size-[280px]" style={{ top: 35, right: '10%' }} />
          <span aria-hidden className="absolute right-[10%] top-[8%] text-[46px] leading-none text-violet">✳</span>
          <span aria-hidden className="pointer-events-none absolute inset-4 z-[1] border-2 border-navy/20" />
          {heroTiles[0] ? (
            <div className="relative z-[2] -mt-10 w-[58%] max-w-[290px] -rotate-2 rounded-lg bg-white p-2 shadow-[0_18px_30px_rgba(32,32,68,0.22)] sm:-mt-14 sm:w-[44%]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-md">
                <Image
                  src={deriveVariantUrl(heroTiles[0].src, 'large')}
                  alt={heroTiles[0].alt}
                  fill
                  priority
                  sizes="(max-width:1023px) 58vw, 290px"
                  className="object-cover object-center"
                />
              </div>
            </div>
          ) : null}
          <p className="absolute bottom-[26px] left-[29px] z-[3] hidden font-heading text-[19px] leading-tight text-ink sm:block">
            Make something amazing
            <small className="mt-[7px] block font-sans text-[12px] font-semibold uppercase tracking-[0.06em]">
              Patterns for your next project
            </small>
          </p>
          {heroTiles[0]?.href ? (
            <Link
              href={heroTiles[0].href}
              className="absolute bottom-[22px] right-[18px] z-[3] rotate-3 rounded-lg bg-white px-[15px] py-3 text-[13px] font-extrabold text-ink shadow-[0_5px_18px_rgba(0,0,0,0.08)] hover:text-violet sm:bottom-auto sm:right-[25px] sm:top-[24px] sm:text-[15px]"
            >
              Your next favourite make
            </Link>
          ) : (
            <span className="absolute bottom-[22px] right-[18px] z-[3] rotate-3 rounded-lg bg-white px-[15px] py-3 text-[13px] font-extrabold text-ink sm:bottom-auto sm:right-[25px] sm:top-[24px] sm:text-[15px]">
              Your next favourite make
            </span>
          )}
        </div>
      </section>

      {/* 2 · Trust band (the one dark band) */}
      <section aria-label="Why buy here" className="order-2 hidden bg-navy text-white md:block">
        <ul className="mx-auto grid max-w-site grid-cols-2 gap-x-3 gap-y-3 page-gutter py-4 md:grid-cols-4 md:gap-x-8 md:gap-y-5 md:py-7">
          {[
            { icon: 'download', t: 'Instant PDF download', d: 'Yours the moment you pay' },
            { icon: 'verified_user', t: '14-day refund', d: 'If something is not right' },
            { icon: 'lock', t: 'Secure checkout', d: 'Paid through Paddle' },
            { icon: 'mail', t: 'Real support', d: 'We reply in 1 to 2 days' },
          ].map((x) => (
            <li key={x.t} className="flex items-start gap-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 md:size-11">
                <MaterialIcon name={x.icon} size={22} color="#EFE0BC" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold leading-tight md:text-[15px]">{x.t}</span>
                <span className="mt-1 hidden text-[13px] leading-snug text-white/70 md:block">{x.d}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 · Shop by animal: round photo bubbles */}
      <section aria-labelledby="home-animals" className="order-4 md:order-3 mx-auto max-w-site page-gutter py-11 md:py-[84px]">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Shop by animal</p>
            <h2 id="home-animals" className="mt-3 font-heading text-[clamp(34px,4vw,54px)] font-semibold leading-[1.08] tracking-[-0.01em] text-ink">
              Who do you want to make?
            </h2>
          </div>
          <Link href="/amigurumi-animals" className="inline-block whitespace-nowrap border-b-2 border-coral pb-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-ink hover:text-coral">
            All amigurumi animals ↗
          </Link>
        </div>
        <ul className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-9 md:gap-4 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
          {HOME_ANIMALS.map((a) => (
            <li key={a.href} className="w-[104px] shrink-0 snap-start md:w-auto">
              <Link href={a.href} className="group flex flex-col items-center gap-3 text-center">
                <span className="relative block aspect-square w-full overflow-hidden rounded-full border-4 border-white bg-surface-warm shadow-[0_8px_22px_rgba(42,27,20,0.16)] ring-1 ring-border transition-transform duration-300 group-hover:-translate-y-1.5">
                  <Image src={deriveVariantUrl(a.img, 'large')} alt="" fill sizes="(max-width:767px) 104px, 140px" className="object-cover object-center transition-transform duration-500 group-hover:scale-110" />
                </span>
                <span className="text-[15px] font-bold leading-tight text-ink group-hover:text-coral">{a.name}</span>
              </Link>
            </li>
          ))}
          <li className="w-[104px] shrink-0 snap-start md:w-auto">
            <Link href="/amigurumi-animals" className="group flex flex-col items-center gap-3 text-center">
              <span className="grid aspect-square w-full place-items-center rounded-full bg-sun text-[34px] text-ink transition-transform duration-300 group-hover:-translate-y-1.5" aria-hidden>→</span>
              <span className="text-[15px] font-bold leading-tight text-ink group-hover:text-coral">See all</span>
            </Link>
          </li>
        </ul>
      </section>

      {/* 4 · Fresh from the studio: swipe row */}
      <section aria-labelledby="home-featured" className="order-3 md:order-4 bg-peach py-8 md:py-[84px]">
        <div className="mx-auto max-w-site page-gutter">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Featured patterns</p>
              <h2 id="home-featured" className="mt-3 font-heading text-[clamp(34px,4vw,54px)] font-semibold leading-[1.08] tracking-[-0.01em] text-ink">
                Patterns to fall for.
              </h2>
            </div>
            <Link href="/shop" className="inline-block whitespace-nowrap border-b-2 border-coral pb-1.5 text-[12px] font-bold uppercase tracking-[0.06em] text-ink hover:text-coral">
              Shop all patterns ↗
            </Link>
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
          ) : trending.length === 0 ? (
            <p className="text-[14px] text-muted">No patterns yet.</p>
          ) : (
            <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] md:-mx-0 md:gap-5 md:px-0">
              {trending.slice(0, 8).map((p, i) => (
                <li key={p.id} className="w-[64%] shrink-0 snap-start sm:w-[38%] lg:w-[calc(25%-15px)]">
                  <PatternCard product={p} priority={i < 2} reviewStats={reviewStatsMap.get(p.id)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 5 · Start here: bento of ways in */}
      <section aria-labelledby="home-start" className="order-5 mx-auto max-w-site page-gutter py-11 md:py-[84px]">
        <div className="mb-8">
          <p className="eyebrow">Find your way in</p>
          <h2 id="home-start" className="mt-3 font-heading text-[clamp(34px,4vw,54px)] font-semibold leading-[1.08] tracking-[-0.01em] text-ink">
            Whatever you want to make next.
          </h2>
        </div>
        <ul className="grid auto-rows-[minmax(190px,auto)] grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {BENTO.map((x) => (
            <li key={x.href} className={x.cls}>
              <Link href={x.href} className="group relative isolate flex h-full min-h-[190px] flex-col justify-end overflow-hidden rounded-3xl bg-navy text-white">
                <Image
                  src={x.img.startsWith('http') ? deriveVariantUrl(x.img, 'large') : x.img}
                  alt=""
                  fill
                  sizes={x.big ? '(max-width:767px) 100vw, 50vw' : '(max-width:767px) 50vw, 25vw'}
                  style={{ objectPosition: x.pos }}
                  className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none"
                />
                <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
                <span className="flex items-end justify-between gap-3 p-4 md:p-6">
                  <span className="min-w-0">
                    <span className={`block font-heading font-semibold leading-[1.1] tracking-[-0.01em] ${x.big ? 'text-[clamp(28px,3.4vw,44px)]' : 'text-[20px] md:text-[26px]'}`}>{x.t}</span>
                    <span className={`mt-1.5 block leading-snug text-white/85 ${x.big ? 'max-w-[38ch] text-[15px]' : 'text-[12.5px] md:text-[13px]'}`}>{x.d}</span>
                  </span>
                  <span aria-hidden className="hidden size-10 shrink-0 place-items-center rounded-full bg-white text-ink transition-transform duration-300 group-hover:translate-x-1 sm:grid">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 6 · Free spotlight */}
      <section className="order-6 mx-auto max-w-site page-gutter pb-11 md:pb-[84px]">
        <div className="relative isolate grid overflow-hidden rounded-[28px] bg-coral text-white md:grid-cols-2">
          <span aria-hidden className="absolute -left-16 -top-16 -z-10 size-[260px] rounded-full bg-white/10" />
          <div className="self-center p-7 md:p-14">
            <p className="eyebrow text-white before:bg-white">A little gift from us</p>
            <h2 className="my-4 font-heading text-[clamp(36px,4.4vw,58px)] font-semibold leading-[1.06] tracking-[-0.01em]">
              Try one of our free patterns first.
            </h2>
            <p className="mb-6 max-w-[40ch] text-[15px] leading-[1.75] text-white/90">
              Download a full pattern, check how ours are written round by round, and make something small this weekend. No account needed.
            </p>
            <Link href="/free-crochet-patterns" className="inline-flex min-h-12 items-center rounded-full bg-white px-7 text-[14px] font-bold text-ink transition-transform hover:-translate-y-0.5">
              Explore free patterns <span aria-hidden className="ml-2">↗</span>
            </Link>
          </div>
          <div className="relative grid min-h-[300px] place-items-center bg-sun md:min-h-[420px]">
            {freeImages[0]?.images?.[0] ? (
              <Link href={`/pattern/${freeImages[0].slug}`} aria-label={freeImages[0].title} className="relative block aspect-[3/4] w-[52%] max-w-[250px] overflow-hidden rounded-t-[999px] rounded-b-2xl border-[6px] border-white shadow-[0_18px_34px_rgba(42,27,20,0.25)]">
                <Image src={deriveVariantUrl(freeImages[0].images[0], 'large')} alt={freeImages[0].title} fill sizes="(max-width:767px) 52vw, 250px" className="object-cover object-center" />
              </Link>
            ) : (
              <FlowerArt className="w-[60%] max-w-[300px]" />
            )}
            <span aria-hidden className="absolute right-[12%] top-[14%] grid size-[92px] rotate-12 place-items-center rounded-full bg-coral font-heading text-[22px] font-semibold text-white shadow-[0_8px_18px_rgba(0,0,0,0.2)]">
              Free
            </span>
          </div>
        </div>
      </section>

      {/* 7 · Guides */}
      <div className="order-7"><HomeGuides /></div>

      {/* 8 · Meet the maker: shown only once the owner has supplied real text (src/content/maker.ts) */}
      {MAKER.headline && MAKER.story && (
        <section className="order-8 bg-surface-warm">
          <div className="max-w-site mx-auto grid grid-cols-1 items-center gap-8 page-gutter py-[58px] md:py-[88px] lg:grid-cols-2 lg:gap-[8%]">
            {MAKER.photo && (
              <div className="relative mx-auto aspect-[3/4] w-full max-w-[360px] overflow-hidden rounded-t-[999px] rounded-b-3xl lg:mx-0 lg:max-w-[440px]">
                <Image src={MAKER.photo} alt="The maker of Notion Creative Art patterns" fill sizes="(max-width: 1023px) 100vw, 440px" className="object-cover" />
              </div>
            )}
            <div className={MAKER.photo ? '' : 'lg:col-span-2 max-w-2xl'}>
              <p className="eyebrow">Meet the maker</p>
              <h2 className="my-4 font-heading text-[clamp(34px,4vw,48px)] font-semibold leading-[1.12] tracking-[-0.01em] text-ink">{MAKER.headline}</h2>
              <p className="mb-6 max-w-xl text-[15px] leading-[1.8] text-muted">{MAKER.story}</p>
              {MAKER.stats.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-x-12 gap-y-4 border-t border-border pt-6">
                  {MAKER.stats.map((st) => (
                    <div key={st.l}>
                      <p className="font-heading text-[40px] font-semibold leading-none text-ink">{st.n}</p>
                      <p className="mt-1.5 text-[13px] text-muted">{st.l}</p>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/about" className="inline-flex min-h-11 items-center border-b-2 border-coral text-[13px] font-bold uppercase tracking-[0.06em] text-ink hover:text-coral">
                Read our story ↗
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 9 · Reviews (only when real reviews exist) */}
      {makerReviews.length > 0 && (
        <section id="reviews" className="order-9 mx-auto max-w-site scroll-mt-20 page-gutter py-11 md:py-[84px]">
          <p className="eyebrow">What makers say</p>
          <h2 className="mb-8 mt-3 font-heading text-[clamp(34px,4vw,54px)] font-semibold leading-[1.08] tracking-[-0.01em] text-ink">Kind words from makers.</h2>
          <div className={`grid gap-3 md:gap-4 ${makerReviews.length === 1 ? 'md:grid-cols-1' : makerReviews.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {makerReviews.slice(0, 3).map((t, i) => (
              <figure key={t.id} className={`rounded-3xl border border-border bg-surface-warm p-6 text-navy ${i === 2 ? 'hidden md:block' : ''}`}>
                <div className="mb-3 flex gap-0.5 text-gold" role="img" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} filled={si < Math.round(t.rating)} />
                  ))}
                </div>
                <blockquote className="mb-5 font-heading text-[22px] leading-[1.25]">&ldquo;{t.body}&rdquo;</blockquote>
                <figcaption className="text-[12px] font-bold uppercase tracking-[0.06em]">
                  {t.reviewerFirstName}
                  <span className="font-medium normal-case tracking-normal opacity-75"> · {t.patternTitle}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* 10 · FAQ */}
      <section className="order-10 bg-surface-warm">
        <div className="max-w-site mx-auto grid grid-cols-1 gap-8 page-gutter py-11 md:py-[84px] lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="eyebrow">Questions, answered</p>
            <h2 className="my-3 font-heading text-[clamp(34px,4vw,54px)] font-semibold leading-[1.08] tracking-[-0.01em] text-ink">The basics before you buy.</h2>
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

      {/* 11 · Introduction with real category links (server-rendered, for search engines and readers) */}
      <section aria-labelledby="home-intro-heading" className="order-11 mx-auto max-w-site page-gutter py-11 md:py-[84px]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-16">
          <div>
            <p className="eyebrow">Who we are</p>
            <h2 id="home-intro-heading" className="mt-3 font-heading text-[clamp(28px,3.4vw,42px)] font-semibold leading-[1.1] tracking-[-0.01em] text-ink">
              Crochet patterns you can download in minutes
            </h2>
            <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.75] text-ink/80">
              Notion Creative Art is a small studio writing <Link className="underline underline-offset-4" href="/shop">crochet patterns</Link> as instant PDF
              downloads.
            </p>
            <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.75] text-muted">
              Every pattern lists its skill level, materials and photos, and you can print the PDF or follow it on your phone. New to crochet? Try our{' '}
              <Link className="underline underline-offset-4" href="/crochet-patterns-for-beginners">crochet patterns for beginners</Link> first.
            </p>
          </div>

          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {[
              {
                title: 'Browse patterns',
                links: [
                  ['/shop/amigurumi', 'Amigurumi patterns'],
                  ['/shop/no-sew-amigurumi', 'No-sew amigurumi'],
                  ['/shop/wearables', 'Wearable crochet patterns'],
                  ['/free-crochet-patterns', 'Free crochet patterns'],
                  ['/crochet-patterns-for-beginners', 'Crochet patterns for beginners'],
                ],
              },
              {
                title: 'See the whole range',
                links: [
                  ['/amigurumi-animals', 'Amigurumi animals'],
                  ['/mini-amigurumi-and-keychains', 'Mini amigurumi and keychains'],
                  ['/amigurumi-in-clothes-and-hats', 'Dressed amigurumi in dresses and hats'],
                ],
              },
              {
                title: 'By animal',
                links: [
                  ['/amigurumi-animals/bunny', 'Bunny'],
                  ['/amigurumi-animals/bear', 'Teddy bear'],
                  ['/amigurumi-animals/cat', 'Cat and kitten'],
                  ['/amigurumi-animals/fox', 'Fox'],
                  ['/amigurumi-animals/frog', 'Frog'],
                  ['/amigurumi-animals/dog', 'Puppy and dog'],
                  ['/amigurumi-animals/horse', 'Horse and pony'],
                  ['/amigurumi-animals/ducks-and-birds', 'Ducks and birds'],
                  ['/search?q=capybara', 'Capybara'],
                  ['/search?q=penguin', 'Penguin'],
                  ['/search?q=dinosaur', 'Dinosaur'],
                  ['/search?q=keychain', 'Keychain charms'],
                ],
              },
              {
                title: 'New to amigurumi?',
                links: [
                  ['/guides/what-is-amigurumi', 'What amigurumi is'],
                  ['/guides/how-to-make-a-magic-ring-crochet', 'The magic ring'],
                  ['/guides', 'Full set of crochet guides'],
                ],
              },
            ].map((g) => (
              <div key={g.title}>
                <h3 className="border-b border-border pb-2 text-[12px] font-extrabold uppercase tracking-[0.1em] text-ink">{g.title}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {g.links.map(([href, label]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-3.5 text-[14px] font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="order-12"><EmailSignup /></div>
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
