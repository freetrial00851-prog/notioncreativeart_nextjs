'use client'

import type { ReactNode } from 'react'
import {
  LISTING_SKILL_LEVELS,
  LISTING_SORT_OPTIONS,
  type ListingSkillLevel,
  type ListingSort,
} from '../lib/listingFilters'

/** Desktop sidebar — compact controls. */
const CHECKBOX_CLASS_PANEL =
  'listing-filter-check shrink-0 w-5 h-5 rounded-sm border border-line bg-white ' +
  'appearance-none cursor-pointer transition-colors ' +
  'checked:bg-[var(--color-accent)] checked:border-[var(--color-accent)] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'

const RADIO_CLASS_PANEL =
  'listing-filter-radio shrink-0 w-5 h-5 rounded-full border-2 border-ink/40 bg-white ' +
  'appearance-none cursor-pointer transition-colors ' +
  'checked:bg-[var(--color-accent)] checked:border-[var(--color-accent)] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'

/** Mobile sheet — ~24px Etsy-scale controls, bold ink border. */
const CHECKBOX_CLASS_SHEET =
  'listing-filter-check shrink-0 w-6 h-6 rounded-[4px] border-2 border-ink bg-white ' +
  'appearance-none cursor-pointer transition-colors ' +
  'checked:bg-[var(--color-accent)] checked:border-[var(--color-accent)] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'

const RADIO_CLASS_SHEET =
  'listing-filter-radio shrink-0 w-6 h-6 rounded-full border-2 border-ink bg-white ' +
  'appearance-none cursor-pointer transition-colors ' +
  'checked:bg-[var(--color-accent)] checked:border-[var(--color-accent)] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'

const ROW_CLASS_PANEL =
  'flex items-center justify-between gap-3 min-h-[44px] py-2.5 px-1 -mx-1 rounded-md ' +
  'text-[14px] font-normal text-ink cursor-pointer hover:bg-surface transition-colors'

/** Etsy-like rows: ~16–20px vertical padding, comfortable 48px+ targets. */
const ROW_CLASS_SHEET =
  'flex items-center justify-between gap-3 min-h-12 py-4 ' +
  'text-[16px] font-normal text-ink cursor-pointer'

/** Desktop: small muted caps. */
const SECTION_TITLE_PANEL =
  'text-[11px] font-normal uppercase tracking-[0.15em] text-ink-soft mb-1'

/** Sheet: Etsy-style sentence case, bold, ~19–20px, full ink. */
const SECTION_TITLE_SHEET =
  'text-[20px] font-bold leading-tight text-ink mb-1'

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
   * Mobile sheet: Etsy-like typography, large controls, section dividers.
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
  const isSheet = variant === 'sheet'
  const rowClass = isSheet ? ROW_CLASS_SHEET : ROW_CLASS_PANEL
  const titleClass = isSheet ? SECTION_TITLE_SHEET : SECTION_TITLE_PANEL
  const radioClass = isSheet ? RADIO_CLASS_SHEET : RADIO_CLASS_PANEL
  const checkClass = isSheet ? CHECKBOX_CLASS_SHEET : CHECKBOX_CLASS_PANEL
  const sectionClass = isSheet
    ? 'px-5 pt-5 pb-1 border-t border-line first:border-t-0 first:pt-4'
    : ''
  const wrapClass = isSheet
    ? ''
    : 'bg-white border border-line rounded-lg p-5 space-y-6'

  return (
    <div className={wrapClass}>
      {showSort && (
        <div className={sectionClass}>
          <p className={titleClass}>{isSheet ? 'Sort' : 'SORT'}</p>
          <div>
            {LISTING_SORT_OPTIONS.map((opt) => (
              <label key={opt.value} className={rowClass}>
                <span>{SORT_SHEET_LABELS[opt.value]}</span>
                <input
                  type="radio"
                  name="listing-sort"
                  checked={sort === opt.value}
                  onChange={() => onSortChange(opt.value)}
                  className={radioClass}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={isSheet ? sectionClass : ''}>
        <p className={titleClass}>{isSheet ? 'Skill level' : 'SKILL LEVEL'}</p>
        <div>
          {LISTING_SKILL_LEVELS.map((l) => (
            <label key={l} className={rowClass}>
              <span className="capitalize">{l}</span>
              <input
                type="checkbox"
                checked={levels.includes(l)}
                onChange={() => onToggleLevel(l)}
                className={checkClass}
              />
            </label>
          ))}
        </div>
      </div>

      <div className={isSheet ? sectionClass : ''}>
        <p className={titleClass}>{isSheet ? 'Pricing' : 'PRICING'}</p>
        <div>
          <label className={rowClass}>
            <span>Paid</span>
            <input
              type="checkbox"
              checked={priceFilter === 'paid'}
              onChange={() => onToggleParam('price', 'paid')}
              className={checkClass}
            />
          </label>
          <label className={rowClass}>
            <span>Free</span>
            <input
              type="checkbox"
              checked={priceFilter === 'free'}
              onChange={() => onToggleParam('price', 'free')}
              className={checkClass}
            />
          </label>
        </div>
      </div>

      {categories ? <div className="pt-1 border-t border-line">{categories}</div> : null}
    </div>
  )
}
