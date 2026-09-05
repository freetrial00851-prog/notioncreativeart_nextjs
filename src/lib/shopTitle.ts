import { parseSkillLevels } from './listingFilters'

/** Virtual shop paths that are not rows in `categories`. */
export function virtualShopCategoryTitle(slug: string | undefined): string | null {
  if (slug === 'new') return 'New Arrivals'
  if (slug === 'sale') return 'Sale'
  if (slug === 'bestsellers') return 'Featured Items'
  return null
}

export type ShopTitleInput = {
  categorySlug?: string
  /** Real category display name from DB (when known). */
  categoryName?: string | null
  price?: string | null
  bundle?: string | null
  sale?: string | null
  level?: string | null
}

/**
 * Single source of truth for Shop listing H1 / breadcrumb title —
 * usable on the server (SSR) and in the client Shop view.
 */
export function resolveShopPageTitle(input: ShopTitleInput): string {
  const { categorySlug, categoryName } = input
  const virtual = virtualShopCategoryTitle(categorySlug)
  if (virtual) return virtual
  if (categorySlug) {
    if (categoryName?.trim()) return categoryName.trim()
    // Last resort while waiting for a name — prefer slug title-case over bare "Shop"
    return categorySlug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  if (input.bundle === '1') return 'Pattern Bundles'
  if (input.price === 'free') return 'Free Patterns'
  if (input.price === 'paid') return 'Shop'
  if (input.sale === '1') return 'On Sale'
  const levels = parseSkillLevels(input.level)
  if (levels.length > 0) {
    return `${levels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(' & ')} Patterns`
  }
  return 'All Patterns'
}

/** Read Next.js `searchParams` record into ShopTitleInput filter fields. */
export function shopTitleFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): Pick<ShopTitleInput, 'price' | 'bundle' | 'sale' | 'level'> {
  const one = (key: string) => {
    const v = searchParams?.[key]
    return Array.isArray(v) ? v[0] ?? null : v ?? null
  }
  return {
    price: one('price'),
    bundle: one('bundle'),
    sale: one('sale'),
    level: one('level'),
  }
}
