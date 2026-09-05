'use client'

import type { ReactNode } from 'react'
import {
  LISTING_SKILL_LEVELS,
  type ListingSkillLevel,
} from '../lib/listingFilters'

const CHECKBOX_CLASS =
  'listing-filter-check shrink-0 w-4 h-4 rounded-sm border border-line bg-white ' +
  'appearance-none cursor-pointer transition-colors ' +
  'checked:bg-[var(--color-accent)] checked:border-[var(--color-accent)] ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'

const ROW_CLASS =
  'flex items-center gap-2.5 py-1.5 px-1 -mx-1 rounded-md text-[13px] cursor-pointer ' +
  'text-ink hover:bg-surface transition-colors'

type ProductListingFiltersProps = {
  levels: ListingSkillLevel[]
  priceFilter: string | null
  saleFilter: boolean
  bundleFilter: boolean
  /** Toggle free / sale / bundle query params. */
  onToggleParam: (key: string, value: string) => void
  onToggleLevel: (level: ListingSkillLevel) => void
  /** Clear skill levels only. */
  onClearLevels: () => void
  /** Optional browse-only block (Shop subcategory list). Omit on Search. */
  categories?: ReactNode
}

/** Shared skill-level + refine filters for Shop and Search sidebars. */
export function ProductListingFilters({
  levels,
  priceFilter,
  saleFilter,
  bundleFilter,
  onToggleParam,
  onToggleLevel,
  onClearLevels,
  categories,
}: ProductListingFiltersProps) {
  return (
    <div className="bg-white border border-line rounded-lg p-5 space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-[11px] tracking-[0.15em] text-ink-soft">SKILL LEVEL</p>
          {levels.length > 0 && (
            <button
              type="button"
              onClick={onClearLevels}
              className="text-[11px] font-semibold underline underline-offset-2 shrink-0"
              style={{ color: 'var(--color-accent)' }}
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-0.5">
          {LISTING_SKILL_LEVELS.map((l) => (
            <label key={l} className={ROW_CLASS}>
              <input
                type="checkbox"
                checked={levels.includes(l)}
                onChange={() => onToggleLevel(l)}
                className={CHECKBOX_CLASS}
              />
              <span className="capitalize">{l}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">REFINE</p>
        <div className="space-y-0.5">
          <label className={ROW_CLASS}>
            <input
              type="checkbox"
              checked={saleFilter}
              onChange={() => onToggleParam('sale', '1')}
              className={CHECKBOX_CLASS}
            />
            On Sale
          </label>
          <label className={ROW_CLASS}>
            <input
              type="checkbox"
              checked={bundleFilter}
              onChange={() => onToggleParam('bundle', '1')}
              className={CHECKBOX_CLASS}
            />
            Bundles
          </label>
          <label className={ROW_CLASS}>
            <input
              type="checkbox"
              checked={priceFilter === 'paid'}
              onChange={() => onToggleParam('price', 'paid')}
              className={CHECKBOX_CLASS}
            />
            Paid Patterns
          </label>
          <label className={ROW_CLASS}>
            <input
              type="checkbox"
              checked={priceFilter === 'free'}
              onChange={() => onToggleParam('price', 'free')}
              className={CHECKBOX_CLASS}
            />
            Free Patterns
          </label>
        </div>
      </div>

      {categories ? <div className="pt-1 border-t border-line">{categories}</div> : null}
    </div>
  )
}
