/**
 * Shared homepage product grid for Featured Items + New Arrivals.
 * Columns come from container width ÷ min card size (not breakpoint steps).
 * auto-fill keeps empty tracks so a short last row does not stretch cards.
 * min(100%, 220px) avoids overflow on very narrow viewports.
 */
export const HOME_PRODUCT_GRID_CLASS =
  'grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-x-6 lg:gap-x-8 gap-y-10 lg:gap-y-12'
