import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'
import { getAllProductSlugs, getAllCategories } from '@/lib/data/products'

/** Static routes with SEO priority weights — mirrors the Vite sitemap generator. */
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1.0 },
  { url: `${SITE_URL}/shop`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${SITE_URL}/shop/amigurumi`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/shop/wearables`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/shop/home-decor`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/shop/bundles`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${SITE_URL}/shop/new`, changeFrequency: 'daily', priority: 0.6 },
  { url: `${SITE_URL}/shop/sale`, changeFrequency: 'daily', priority: 0.6 },
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

  try {
    const [slugs, categories] = await Promise.all([
      getAllProductSlugs(),
      getAllCategories(),
    ])

    for (const slug of slugs) {
      routes.push({
        url: `${SITE_URL}/pattern/${slug}`,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }

    for (const cat of categories) {
      const path = `${SITE_URL}/shop/${cat.slug}`
      if (!routes.some((r) => r.url === path)) {
        routes.push({ url: path, changeFrequency: 'weekly', priority: 0.7 })
      }
    }
  } catch {
    // Build without Supabase access — static routes still included
  }

  return routes
}
