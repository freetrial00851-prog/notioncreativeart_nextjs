/** Max products fetched/rendered per homepage product section. */
export const HOME_PRODUCT_SECTION_LIMIT = 6

/**
 * Featured Items, New Arrivals, Free Patterns — fixed 3-tier breakpoints:
 *   <640px  → 2 columns
 *   640–1023px → 3 columns
 *   ≥1024px → 6 columns (one full row at the fetch limit)
 */
export const HOME_PRODUCT_GRID_CLASS =
  'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-12'
