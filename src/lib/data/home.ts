import { createStaticClient } from '@/lib/supabase/static'
import { loadHomeCatalog, type HomeCatalogFetchResult } from '@/lib/homeCatalog'
import { mergeLayout } from '@/lib/defaultLayout'

/**
 * Server-side homepage catalog for App Router SSR / ISR (`revalidate`).
 * Uses the cookie-free static client — safe at build and request time.
 */
export async function getHomeCatalogServer(): Promise<HomeCatalogFetchResult> {
  try {
    const supabase = createStaticClient()
    return await loadHomeCatalog(supabase)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load homepage catalog'
    return {
      snapshot: {
        trending: [],
        newArrivals: [],
        bundles: [],
        freeProduct: null,
        categories: [],
        chapters: [],
        testimonials: [],
        hero: null,
        layout: mergeLayout([]),
        skillCounts: { beginner: 0, intermediate: 0, advanced: 0 },
        skillPreview: [],
        skillPreviewLevel: 'beginner',
      },
      featuredError: message,
    }
  }
}
