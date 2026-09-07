'use client'

import type { ReactNode } from 'react'
import {
  LISTING_SKILL_LEVELS,
  LISTING_SORT_OPTIONS,
  type ListingSkillLevel,
  type ListingSort,
} from '../lib/listingFilters'

const CHECKBOX_CLASS =
  'listing-filter-check shrink-0 w-5 h-5 rounded-sm border border-line bg-white ' +
  'appearance-none cursor-pointer transition-colors ' +
  'checked:bg-[var(--color-accent)] checked:border-[var(--color-accent)] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'

const RADIO_CLASS =
  'listing-filter-radio shrink-0 w-5 h-5 rounded-full border border-line bg-white ' +
  'appearance-none cursor-pointer transition-colors ' +
  'checked:bg-white checked:border-[var(--color-accent)] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'

/** Label left, control right — matches Sort & Filter mockup / Etsy-style rows. */
const ROW_CLASS =
  'flex items-center justify-between gap-3 py-2.5 px-1 -mx-1 rounded-md text-[14px] cursor-pointer ' +
  'text-ink hover:bg-surface transition-colors'

const SECTION_TITLE_CLASS = 'text-[11px] tracking-[0.15em] text-ink-soft mb-1'

const SORT_SHEET_LABELS: Record<ListingSort, string> = {
  newest: 'Newest',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  'best-selling': 'Best Selling',
}

type ProductListingFiltersProps = {
  levels: ListingSkillLevel[]
  priceFilter: string | null
  /** Toggle free / paid (and legacy sale/bundle if still in URL tooling). */
  onToggleParam: (key: string, value: string) => void
  onToggleLevel: (level: ListingSkillLevel) => void
  /** Optional browse-only block (Shop subcategory list). Omit on Search. */
  categories?: ReactNode
  /** When set, renders the Sort section (mobile Sort & Filter sheet). */
  sort?: ListingSort
  onSortChange?: (sort: ListingSort) => void
  /**
   * Mobile sheet: no outer card chrome, tighter vertical rhythm.
   * Desktop sidebar keeps the bordered card.
   */
  variant?: 'panel' | 'sheet'
}

/** Shared skill-level + pricing (+ optional sort) filters for Shop and Search. */
export function ProductListingFilters({
  levels,
  priceFilter,
  onToggleParam,
  onToggleLevel,
  categories,
  sort,
  onSortChange,
  variant = 'panel',
}: ProductListingFiltersProps) {
  const showSort = sort !== undefined && onSortChange !== undefined
  const sectionsClass = variant === 'sheet' ? 'space-y-5' : 'space-y-6'
  const wrapClass =
    variant === 'sheet'
      ? sectionsClass
      : `bg-white border border-line rounded-lg p-5 ${sectionsClass}`

  return (
    <div className={wrapClass}>
      {showSort && (
        <div>
          <p className={SECTION_TITLE_CLASS}>SORT</p>
          <div className="space-y-0">
            {LISTING_SORT_OPTIONS.map((opt) => (
              <label key={opt.value} className={ROW_CLASS}>
                <span>{SORT_SHEET_LABELS[opt.value]}</span>
                <input
                  type="radio"
                  name="listing-sort"
                  checked={sort === opt.value}
                  onChange={() => onSortChange(opt.value)}
                  className={RADIO_CLASS}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className={SECTION_TITLE_CLASS}>SKILL LEVEL</p>
        <div className="space-y-0">
          {LISTING_SKILL_LEVELS.map((l) => (
            <label key={l} className={ROW_CLASS}>
              <span className="capitalize">{l}</span>
              <input
                type="checkbox"
                checked={levels.includes(l)}
                onChange={() => onToggleLevel(l)}
                className={CHECKBOX_CLASS}
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className={SECTION_TITLE_CLASS}>PRICING</p>
        <div className="space-y-0">
          <label className={ROW_CLASS}>
            <span>Paid</span>
            <input
              type="checkbox"
              checked={priceFilter === 'paid'}
              onChange={() => onToggleParam('price', 'paid')}
              className={CHECKBOX_CLASS}
            />
          </label>
          <label className={ROW_CLASS}>
            <span>Free</span>
            <input
              type="checkbox"
              checked={priceFilter === 'free'}
              onChange={() => onToggleParam('price', 'free')}
              className={CHECKBOX_CLASS}
            />
          </label>
        </div>
      </div>

      {categories ? <div className="pt-1 border-t border-line">{categories}</div> : null}
    </div>
  )
}
