import type { Product } from './types'

export const LISTING_SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export type ListingSkillLevel = (typeof LISTING_SKILL_LEVELS)[number]

/** Shared Shop / Search / Wishlist product grid column ladder. */
export const LISTING_PRODUCT_GRID_CLASS =
  'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-14'

export const LISTING_PAGE_SIZE = 12

export type ListingSort = 'newest' | 'price-asc' | 'price-desc' | 'best-selling'

export const LISTING_SORT_OPTIONS: { value: ListingSort; label: string; mobileLabel: string }[] = [
  { value: 'newest', label: 'NEWEST', mobileLabel: 'Sort: Newest' },
  { value: 'price-asc', label: 'PRICE: LOW TO HIGH', mobileLabel: 'Sort: Price low to high' },
  { value: 'price-desc', label: 'PRICE: HIGH TO LOW', mobileLabel: 'Sort: Price high to low' },
  { value: 'best-selling', label: 'BEST SELLING', mobileLabel: 'Sort: Best selling' },
]

export type ListingFilterParams = {
  /** Selected skill levels; empty = all levels. */
  levels?: ListingSkillLevel[]
  /** When true, only price === 0 */
  free?: boolean
  /** When true, only price > 0 */
  paid?: boolean
  /** When true, paid products with a real compare-at discount (same as ProductCard badge). */
  sale?: boolean
  /** When true, only bundles */
  bundle?: boolean
}

export function isListingSkillLevel(value: string): value is ListingSkillLevel {
  return (LISTING_SKILL_LEVELS as readonly string[]).includes(value)
}

/** Parse `level=beginner,intermediate` (also accepts a single legacy value). */
export function parseSkillLevels(param: string | null | undefined): ListingSkillLevel[] {
  if (!param?.trim()) return []
  const seen = new Set<ListingSkillLevel>()
  for (const part of param.split(',')) {
    const v = part.trim().toLowerCase()
    if (isListingSkillLevel(v) && !seen.has(v)) seen.add(v)
  }
  return LISTING_SKILL_LEVELS.filter((l) => seen.has(l))
}

export function serializeSkillLevels(levels: ListingSkillLevel[]): string | null {
  if (levels.length === 0) return null
  return LISTING_SKILL_LEVELS.filter((l) => levels.includes(l)).join(',')
}

export function toggleSkillLevel(
  current: ListingSkillLevel[],
  level: ListingSkillLevel,
): ListingSkillLevel[] {
  return current.includes(level)
    ? current.filter((l) => l !== level)
    : [...current, level]
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
  { levels, free, paid, sale, bundle }: ListingFilterParams,
): Product[] {
  const selected = levels ?? []
  return products.filter((p) => {
    if (selected.length > 0 && (!p.skill_level || !selected.includes(p.skill_level))) return false
    if (free && p.price !== 0) return false
    if (paid && !(p.price > 0)) return false
    if (sale && !isProductOnSale(p)) return false
    if (bundle && !p.is_bundle) return false
    return true
  })
}

export function countActiveListingFilters(params: {
  levels: ListingSkillLevel[]
  priceFilter: string | null
  saleFilter: boolean
  bundleFilter: boolean
}): number {
  return (
    (params.levels.length > 0 ? 1 : 0) +
    (params.priceFilter === 'free' || params.priceFilter === 'paid' ? 1 : 0) +
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

export function clearSkillLevelParam(p: URLSearchParams): URLSearchParams {
  p.delete('level')
  return p
}

/**
 * Sort listing products. For `best-selling`, pass paid purchase counts
 * (missing ids = 0). Tie-break: newer `created_at` first.
 */
export function sortProductsByListingSort(
  products: Product[],
  sort: ListingSort,
  purchaseCounts?: Map<string, number>,
): Product[] {
  const list = [...products]
  if (sort === 'price-asc') return list.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') return list.sort((a, b) => b.price - a.price)
  if (sort === 'best-selling') {
    const counts = purchaseCounts ?? new Map<string, number>()
    return list.sort((a, b) => {
      const ca = counts.get(a.id) ?? 0
      const cb = counts.get(b.id) ?? 0
      if (cb !== ca) return cb - ca
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }
  // newest — assume caller may already have newest-first; still stabilize
  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}
