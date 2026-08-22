import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/** Robots.txt — blocks private pages from indexing, points to dynamic sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/admin', '/cart', '/wishlist'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
