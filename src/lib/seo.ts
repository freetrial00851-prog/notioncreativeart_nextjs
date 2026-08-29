import type { Metadata } from 'next'
import { env } from '@/lib/env'

/** Brand constants — single source of truth for SEO across the site. */
export const SITE_NAME = 'Notion Creative Art'
export const SITE_URL = env.siteUrl

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
}

/**
 * Builds Next.js Metadata for any page — replaces the client-side useMeta hook.
 * Server-rendered metadata is indexable immediately (no JS execution required).
 */
export function buildMetadata(opts: PageMetaInput): Metadata {
  const fullTitle = opts.exactTitle
    ? opts.title
    : opts.title === SITE_NAME
      ? opts.title
      : `${opts.title} — ${SITE_NAME}`
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

/** JSON-LD Product schema for rich search results on pattern pages. */
export function buildProductJsonLd(product: {
  title: string
  description: string | null
  slug: string
  price: number
  images: string[]
  sold_out: boolean
}) {
  return {
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
