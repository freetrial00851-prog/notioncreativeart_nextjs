import { supabase } from './supabase'
import {
  loadShopCatalog,
  shopFiltersKey,
  type ShopCatalogSnapshot,
  type ShopFilters,
} from './shopCatalog'

export type { ShopCatalogSnapshot, ShopFilters }
export { shopFiltersKey }

/** Warm TTL — back-nav within this window can reuse the last listing. */
const TTL_MS = 2.5 * 60 * 1000

type CacheEntry = { key: string; data: ShopCatalogSnapshot; at: number }

let entry: CacheEntry | null = null
const inflight = new Map<string, Promise<ShopCatalogSnapshot>>()

export function getShopCatalogCache(filters: ShopFilters): ShopCatalogSnapshot | null {
  if (!entry) return null
  if (Date.now() - entry.at > TTL_MS) {
    entry = null
    return null
  }
  if (entry.key !== shopFiltersKey(filters)) return null
  return entry.data
}

export function setShopCatalogCache(data: ShopCatalogSnapshot) {
  entry = { key: shopFiltersKey(data.filters), data, at: Date.now() }
}

export function fetchShopCatalog(filters: ShopFilters): Promise<ShopCatalogSnapshot> {
  const key = shopFiltersKey(filters)
  const existing = inflight.get(key)
  if (existing) return existing

  const promise = loadShopCatalog(supabase, filters)
    .then((result) => {
      setShopCatalogCache(result)
      return result
    })
    .finally(() => {
      inflight.delete(key)
    })
  inflight.set(key, promise)
  return promise
}
