'use client'

export type ListingPaginationProps = {
  currentPage: number
  pageCount: number
  onPageChange: (page: number) => void
  /**
   * `full` = numbered pages (default; always visible — Search/Wishlist).
   * `simple` = Page X of N (shop mobile/tablet).
   * `desktop` = numbered pages, laptop-only (shop).
   */
  variant?: 'full' | 'simple' | 'desktop'
}

type PageItem = number | 'ellipsis'

/**
 * Build page items with ellipsis compression when there are more than 7 pages.
 * Always includes first + last; keeps current ± 1 neighbors.
 */
export function getListingPageItems(currentPage: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }

  const current = Math.min(Math.max(currentPage, 1), pageCount)
  const set = new Set<number>()
  set.add(1)
  set.add(pageCount)
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= pageCount) set.add(p)
  }

  if (current <= 3) {
    for (let p = 1; p <= 4; p++) set.add(p)
  }
  if (current >= pageCount - 2) {
    for (let p = pageCount - 3; p <= pageCount; p++) set.add(p)
  }

  const sorted = [...set].sort((a, b) => a - b)
  const items: PageItem[] = []
  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i]
    if (i > 0 && page - sorted[i - 1] > 1) items.push('ellipsis')
    items.push(page)
  }
  return items
}

/**
 * Shared Shop / Search / Wishlist pagination — DESIGN_SPEC §4.2.
 */
export function ListingPagination({
  currentPage,
  pageCount,
  onPageChange,
  variant = 'full',
}: ListingPaginationProps) {
  if (pageCount <= 1) return null

  const btn =
    'w-9 h-9 flex items-center justify-center rounded-full border border-border hover:bg-surface-warm disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-ink'

  if (variant === 'simple') {
    return (
      <div className="flex lg:hidden items-center justify-center gap-4 mt-10">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className={btn}
        >
          ‹
        </button>
        <span className="text-[13px] text-muted">
          Page {currentPage} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === pageCount}
          aria-label="Next page"
          className={btn}
        >
          ›
        </button>
      </div>
    )
  }

  const items = getListingPageItems(currentPage, pageCount)
  const wrapClass =
    variant === 'desktop'
      ? 'hidden lg:flex items-center justify-center gap-2 mt-14'
      : 'flex items-center justify-center gap-2 mt-14'

  return (
    <div className={wrapClass}>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={btn}
      >
        ‹
      </button>
      {items.map((item, i) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${i}`}
            aria-hidden="true"
            className="w-9 h-9 flex items-center justify-center text-[13px] text-muted select-none"
          >
            …
          </span>
        ) : (
          <button
            type="button"
            key={item}
            onClick={() => onPageChange(item)}
            aria-label={`Page ${item}`}
            aria-current={item === currentPage ? 'page' : undefined}
            className={`w-9 h-9 flex items-center justify-center rounded-full text-[13px] transition-colors ${
              item === currentPage
                ? 'bg-primary text-white'
                : 'border border-border hover:bg-surface-warm text-ink'
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pageCount}
        aria-label="Next page"
        className={btn}
      >
        ›
      </button>
    </div>
  )
}
