import { supabase } from './supabase'
import {
  loadHomeCatalog,
  type HomeCatalogFetchResult,
  type HomeCatalogSnapshot,
} from './homeCatalog'

export type { HomeCatalogFetchResult, HomeCatalogSnapshot }

/**
 * Warm TTL — soft-nav within this window skips network and paints instantly.
 * Freshness after admin edits is handled by on-demand revalidatePath, so this
 * can stay longer than the old 2.5-minute window.
 */
const TTL_MS = 10 * 60 * 1000

type CacheEntry = { data: HomeCatalogSnapshot; at: number }

let entry: CacheEntry | null = null
let inflight: Promise<HomeCatalogFetchResult> | null = null

export function getHomeCatalogCache(): HomeCatalogSnapshot | null {
  if (!entry) return null
  if (Date.now() - entry.at > TTL_MS) {
    entry = null
    return null
  }
  return entry.data
}

export function setHomeCatalogCache(data: HomeCatalogSnapshot) {
  entry = { data, at: Date.now() }
}

export function clearHomeCatalogCache() {
  entry = null
}

function shouldSimulateFeaturedFailure(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV === 'production') return false
  return new URLSearchParams(window.location.search).get('failFeatured') === '1'
}

/**
 * Deduped browser fetch. Successful featured queries (including a real empty list) are
 * cached; featured query failures are never written to the module cache.
 */
export function fetchHomeCatalog(): Promise<HomeCatalogFetchResult> {
  if (inflight) return inflight
  inflight = loadHomeCatalog(supabase, {
    simulateFeaturedFailure: shouldSimulateFeaturedFailure(),
  })
    .then((result) => {
      if (!result.featuredError) {
        setHomeCatalogCache(result.snapshot)
      }
      return result
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}
