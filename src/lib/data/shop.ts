import { createStaticClient } from '@/lib/supabase/static'
import { loadShopCatalog, type ShopCatalogSnapshot, type ShopFilters } from '@/lib/shopCatalog'

/**
 * Server-side shop catalog for App Router SSR / ISR (`revalidate`).
 * Cookie-free static client — safe at build and request time.
 */
export async function getShopCatalogServer(filters: ShopFilters): Promise<ShopCatalogSnapshot> {
  try {
    const supabase = createStaticClient()
    return await loadShopCatalog(supabase, filters)
  } catch {
    return {
      products: [],
      categories: [],
      sidebarCategories: [],
      suggestions: [],
      filters,
    }
  }
}
