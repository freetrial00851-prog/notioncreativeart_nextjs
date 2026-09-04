'use client'

import type { ReactNode } from 'react'
import { LISTING_SKILL_LEVELS } from '../lib/listingFilters'

type ProductListingFiltersProps = {
  level: string | null
  priceFilter: string | null
  saleFilter: boolean
  bundleFilter: boolean
  /** Toggle a query param: if already set to `value`, remove it; otherwise set it. */
  onToggleParam: (key: string, value: string) => void
  /** Clear skill level (select “All Levels”). */
  onClearLevel: () => void
  /** Optional browse-only block (Shop subcategory list). Omit on Search. */
  categories?: ReactNode
}

/** Shared skill-level + free/sale/bundle filters for Shop and Search sidebars. */
export function ProductListingFilters({
  level,
  priceFilter,
  saleFilter,
  bundleFilter,
  onToggleParam,
  onClearLevel,
  categories,
}: ProductListingFiltersProps) {
  return (
    <>
      <div>
        <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">SKILL LEVEL</p>
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={onClearLevel}
            className={`w-full text-left px-3 py-2 rounded-full text-[13px] transition-colors ${!level ? 'bg-surface font-medium text-ink' : 'text-ink-soft hover:bg-surface hover:text-ink'}`}
          >
            All Levels
          </button>
          {LISTING_SKILL_LEVELS.map((l) => (
            <button
              type="button"
              key={l}
              onClick={() => onToggleParam('level', l)}
              className={`w-full text-left px-3 py-2 rounded-full text-[13px] capitalize transition-colors ${level === l ? 'bg-surface font-medium text-ink' : 'text-ink-soft hover:bg-surface hover:text-ink'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">FILTERS</p>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              checked={priceFilter === 'free'}
              onChange={() => onToggleParam('price', 'free')}
              className="accent-ink"
            />
            Free patterns only
          </label>
          <label className="flex items-center gap-2.5 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              checked={saleFilter}
              onChange={() => onToggleParam('sale', '1')}
              className="accent-ink"
            />
            On sale
          </label>
          <label className="flex items-center gap-2.5 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              checked={bundleFilter}
              onChange={() => onToggleParam('bundle', '1')}
              className="accent-ink"
            />
            Bundles only
          </label>
        </div>
      </div>

      {categories}
    </>
  )
}
