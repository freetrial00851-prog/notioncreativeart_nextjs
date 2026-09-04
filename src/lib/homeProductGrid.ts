/** Free-patterns homepage grid fetch cap (unchanged). */
export const HOME_PRODUCT_SECTION_LIMIT = 6

/**
 * Featured Items fetch cap.
 * Live catalog currently has only 6 `featured=true` products — do not raise
 * without enough real featured rows (no placeholders).
 */
export const HOME_FEATURED_LIMIT = 6

/** New Arrivals fetch cap — 10 fills two complete rows on an xl:5-column grid. */
export const HOME_NEW_ARRIVALS_LIMIT = 10

/**
 * Featured Items, New Arrivals, Free Patterns — column tiers aligned to Shop card width:
 *   <640px     → 2 columns
 *   640–1023px → 3 columns
 *   1024–1279  → 4 columns (≈ Shop 3-col + sidebar card width)
 *   ≥1280      → 5 columns (≈ Shop 4-col + sidebar card width)
 */
export const HOME_PRODUCT_GRID_CLASS =
  'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-12'
