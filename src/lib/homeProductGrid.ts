/**
 * Shared homepage product row for Featured Items + New Arrivals.
 * Always exactly one row — card count is not chosen by breakpoints.
 * Cards share the row (grow from ~220px); if they cannot all fit, the
 * row scrolls horizontally instead of wrapping to a second line.
 */
export const HOME_PRODUCT_ROW_CLASS =
  'flex flex-nowrap gap-x-6 lg:gap-x-8 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

/** Flex child: grow with the screen, never wrap below the Featured card size. */
export const HOME_PRODUCT_ROW_ITEM_CLASS =
  'min-w-[min(100%,220px)] flex-[1_0_min(100%,220px)]'
