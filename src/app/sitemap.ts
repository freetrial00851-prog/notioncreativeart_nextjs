import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'
import { getSitemapData } from '@/lib/data/products'
import { getAllGuides } from '@/lib/guides'
import { deriveVariantUrl } from '@/lib/imageVariants'

/** Rebuild hourly so new patterns reach the sitemap without a deploy. */
export const revalidate = 3600

/** Static routes with SEO priority weights — mirrors the Vite sitemap generator. */
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1.0 },
  { url: `${SITE_URL}/shop`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/free-crochet-patterns`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${SITE_URL}/guides`, changeFrequency: 'weekly', priority: 0.6 },
  { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.3 },
  { url: `${SITE_URL}/refund-policy`, changeFrequency: 'monthly', priority: 0.2 },
  { url: `${SITE_URL}/terms`, changeFrequency: 'monthly', priority: 0.2 },
  { url: `${SITE_URL}/privacy`, changeFrequency: 'monthly', priority: 0.2 },
]

/**
 * Dynamic sitemap — regenerated at build time and on revalidation.
 * Includes all active product pages for search engine discovery.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [...STATIC_ROUTES]

  // Guides live in the repo, so they are listed even if the database is unreachable.
  for (const g of getAllGuides()) {
    routes.push({ url: `${SITE_URL}/guides/${g.slug}`, lastModified: new Date(g.dateModified), changeFrequency: 'monthly', priority: 0.6 })
  }

  try {
    const { products, categories } = await getSitemapData()

    for (const p of products) {
      routes.push({
        url: `${SITE_URL}/pattern/${p.slug}`,
        // Honest date: when the pattern was added (there is no updated_at column yet).
        lastModified: p.created_at ? new Date(p.created_at) : undefined,
        changeFrequency: 'weekly',
        priority: 0.8,
        images: ((p.images as string[] | null) ?? []).slice(0, 5).map((u) => deriveVariantUrl(u, 'large')),
      })
    }

    for (const cat of categories) {
      const path = `${SITE_URL}/shop/${cat.slug}`
      if (!routes.some((r) => r.url === path)) {
        routes.push({ url: path, changeFrequency: 'weekly', priority: 0.7 })
      }
    }
  } catch (err) {
    // Build without Supabase access — static routes still included, but say so in the build log.
    console.error('sitemap: could not load products, publishing static routes only', err)
  }

  return routes
}
