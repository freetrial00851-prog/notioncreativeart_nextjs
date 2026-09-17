'use client'

export type ListingPaginationProps = {
  currentPage: number
  pageCount: number
  onPageChange: (page: number) => void
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

  // Near the start or end, keep a denser run so we don't show awkward 1 … 2 3 patterns
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
 * Shared Shop / Search / Wishlist pagination with ellipsis compression for long lists.
 */
export function ListingPagination({ currentPage, pageCount, onPageChange }: ListingPaginationProps) {
  if (pageCount <= 1) return null

  const items = getListingPageItems(currentPage, pageCount)

  return (
    <div className="flex items-center justify-center gap-2 mt-14">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="w-9 h-9 flex items-center justify-center rounded-full border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ‹
      </button>
      {items.map((item, i) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${i}`}
            aria-hidden="true"
            className="w-9 h-9 flex items-center justify-center text-[13px] text-ink-soft select-none"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            aria-label={`Page ${item}`}
            aria-current={item === currentPage ? 'page' : undefined}
            className={`w-9 h-9 flex items-center justify-center rounded-full text-[13px] transition-colors ${item === currentPage ? 'text-white' : 'border border-line hover:bg-surface'}`}
            style={item === currentPage ? { background: 'var(--color-accent)' } : undefined}
          >
            {item}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pageCount}
        aria-label="Next page"
        className="w-9 h-9 flex items-center justify-center rounded-full border border-line hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ›
      </button>
    </div>
  )
}
