/** Min card width for Featured Items / New Arrivals (matches Featured visual size). */
export const HOME_PRODUCT_GRID_MIN_PX = 220

/**
 * Skeleton / SSR-friendly fallback: auto-fill grid with the same min card width.
 * Live sections use HomeProductRow (one row, no scroll, width-driven columns).
 */
export const HOME_PRODUCT_GRID_CLASS =
  `grid grid-cols-[repeat(auto-fill,minmax(min(100%,${HOME_PRODUCT_GRID_MIN_PX}px),1fr))] gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-12`
