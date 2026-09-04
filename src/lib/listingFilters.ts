import type { Product } from './types'

export const LISTING_SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const

/** Shared Shop / Search / Wishlist product grid column ladder. */
export const LISTING_PRODUCT_GRID_CLASS =
  'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-14'

export const LISTING_PAGE_SIZE = 12

export type ListingFilterParams = {
  level?: string | null
  /** When true, only price === 0 */
  free?: boolean
  /** When true, paid products with a real compare-at discount (same as ProductCard badge). */
  sale?: boolean
  /** When true, only bundles */
  bundle?: boolean
}

/** True when the product would show an “On sale” badge. */
export function isProductOnSale(p: Product): boolean {
  return p.price > 0 && !!p.compare_at_price && p.compare_at_price > p.price
}

/**
 * Client-side listing filters (Search applies these on top of text results;
 * Shop uses the same sale predicate after the Supabase query).
 */
export function filterProductsByListingParams(
  products: Product[],
  { level, free, sale, bundle }: ListingFilterParams,
): Product[] {
  return products.filter((p) => {
    if (level && p.skill_level !== level) return false
    if (free && p.price !== 0) return false
    if (sale && !isProductOnSale(p)) return false
    if (bundle && !p.is_bundle) return false
    return true
  })
}

export function countActiveListingFilters(params: {
  level: string | null
  priceFilter: string | null
  saleFilter: boolean
  bundleFilter: boolean
}): number {
  return (
    (params.level ? 1 : 0) +
    (params.priceFilter === 'free' ? 1 : 0) +
    (params.saleFilter ? 1 : 0) +
    (params.bundleFilter ? 1 : 0)
  )
}

/** Clears level / price / sale / bundle; leaves other params (e.g. `q`) intact. */
export function clearListingFilterParams(p: URLSearchParams): URLSearchParams {
  p.delete('level')
  p.delete('price')
  p.delete('sale')
  p.delete('bundle')
  return p
}
