import type { Metadata } from 'next'
import { env } from '@/lib/env'

/** Brand constants — single source of truth for SEO across the site. */
export const SITE_NAME = 'Notion Creative Art'
export const SITE_URL = env.siteUrl

/** Full document title budget for SERP display (Google often truncates near ~60). */
export const META_TITLE_MAX = 60

/** ` — Notion Creative Art` — reserved when appending the brand suffix. */
export const META_TITLE_BRAND_SUFFIX = ` — ${SITE_NAME}`

/** Trailing connector words that make a truncated SERP title sound unfinished. */
const TITLE_TRAILING_STOPWORDS = new Set([
  'with',
  'and',
  'for',
  'in',
  'on',
  'a',
  'the',
])

/**
 * After a word-boundary cut: strip trailing punctuation and connector stopwords
 * so the SERP title doesn't end on "," / "with" / etc.
 */
function polishTruncatedTitleBase(cut: string): string {
  let result = cut.trim()
  // Repeat — e.g. "Pattern, with" → drop comma → drop "with"
  for (let i = 0; i < 8; i++) {
    const before = result

    // 1) Trailing punctuation
    result = result.replace(/[\s|/·•,;:！!？?]+$/u, '').trim()
    result = result.replace(/[-—–]+$/u, '').trim()

    // 2) Trailing connector stopwords
    const parts = result.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      const last = parts[parts.length - 1]!.toLowerCase().replace(/[^a-z']/gi, '')
      if (TITLE_TRAILING_STOPWORDS.has(last)) {
        parts.pop()
        result = parts.join(' ')
      }
    }

    // 3) Dangling ", fragment" left after a mid-list cut (e.g. "Pattern, Cute")
    const commaIdx = result.lastIndexOf(',')
    if (commaIdx > 0) {
      const after = result.slice(commaIdx + 1).trim()
      const afterWords = after.split(/\s+/).filter(Boolean)
      if (after.length > 0 && afterWords.length <= 2) {
        result = result.slice(0, commaIdx).trim()
      }
    }

    if (result === before) break
  }

  return result.replace(/[\s|/·•,;:—–-]+$/u, '').trim()
}

/**
 * Truncate a page/product title so `{title}${META_TITLE_BRAND_SUFFIX}` stays ≤ maxLen.
 * Prefer cutting on a word boundary; polish trailing punctuation / connector words.
 */
export function truncateTitleForBrandSuffix(
  title: string,
  maxFull: number = META_TITLE_MAX,
): string {
  const raw = title.trim()
  if (!raw) return raw
  const maxBase = maxFull - META_TITLE_BRAND_SUFFIX.length
  if (maxBase < 8) return raw.slice(0, Math.max(1, maxBase)).trim()
  if (raw.length <= maxBase) return raw

  let cut = raw.slice(0, maxBase)
  const nextChar = raw[maxBase]
  // If we split mid-word, back up to the previous space
  if (nextChar && nextChar !== ' ' && !/\s/.test(cut[cut.length - 1] ?? '')) {
    const lastSpace = cut.lastIndexOf(' ')
    if (lastSpace >= Math.floor(maxBase * 0.45)) {
      cut = cut.slice(0, lastSpace)
    }
  }
  cut = cut.replace(/[\s|/·•—–-]+$/u, '').trim()
  return polishTruncatedTitleBase(cut)
}

export type PageMetaInput = {
  title: string
  description: string
  path: string
  /** When omitted, no og:image / twitter:image tags are emitted (layout may supply a site default). */
  image?: string
  type?: 'website' | 'product'
  noIndex?: boolean
  /** Use title verbatim (no " — Site Name" suffix). For homepage meta title with embedded brand. */
  exactTitle?: boolean
  /**
   * When true (product pages), truncate `title` so the branded full title stays ≤ {@link META_TITLE_MAX}.
   */
  truncateForSerp?: boolean
}

/**
 * Builds Next.js Metadata for any page — replaces the client-side useMeta hook.
 * Server-rendered metadata is indexable immediately (no JS execution required).
 */
export function buildMetadata(opts: PageMetaInput): Metadata {
  const baseTitle = opts.truncateForSerp
    ? truncateTitleForBrandSuffix(opts.title)
    : opts.title.trim()
  const fullTitle = opts.exactTitle
    ? baseTitle
    : baseTitle === SITE_NAME
      ? baseTitle
      : `${baseTitle}${META_TITLE_BRAND_SUFFIX}`
  const url = `${SITE_URL}${opts.path}`

  const openGraph: NonNullable<Metadata['openGraph']> = {
    title: fullTitle,
    description: opts.description,
    url,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
  }

  const twitter: NonNullable<Metadata['twitter']> = {
    card: 'summary_large_image',
    title: fullTitle,
    description: opts.description,
  }

  if (opts.image) {
    openGraph.images = [{ url: opts.image, width: 1200, height: 630, alt: opts.title }]
    twitter.images = [opts.image]
  }

  return {
    title: fullTitle,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noIndex ? { index: false, follow: false } : undefined,
    openGraph,
    twitter,
  }
}

type ProductJsonLdReview = {
  reviewer_name: string
  rating: number
  body: string
  created_at: string
}

/** JSON-LD Product schema for rich search results on pattern pages. */
export function buildProductJsonLd(
  product: {
    title: string
    description: string | null
    slug: string
    price: number
    images: string[]
    sold_out: boolean
  },
  options?: {
    averageRating?: number
    reviewCount?: number
    reviews?: ProductJsonLdReview[]
  },
) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description ?? undefined,
    image: product.images?.[0],
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.sold_out
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
      url: `${SITE_URL}/pattern/${product.slug}`,
    },
  }

  const reviewCount = options?.reviewCount ?? 0
  const averageRating = options?.averageRating ?? 0
  if (reviewCount >= 1 && averageRating > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.round(averageRating * 10) / 10,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  const reviews = options?.reviews ?? []
  if (reviews.length > 0) {
    jsonLd.review = reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.reviewer_name },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.body,
      datePublished: r.created_at,
    }))
  }

  return jsonLd
}

/**
 * JSON-LD BreadcrumbList — mirrors the visible Home › Category › Product trail
 * on pattern pages (omit category when the product has none).
 */
export function buildBreadcrumbListJsonLd(
  items: { name: string; path: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

/** JSON-LD Organization schema for the homepage — helps brand recognition in SERPs. */
export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      'Considered crochet patterns, delivered as instant PDF downloads. A small studio writing and testing crochet patterns, one at a time.',
    sameAs: [],
  }
}

/** JSON-LD WebSite schema with SearchAction — enables sitelinks search box. */
export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}
