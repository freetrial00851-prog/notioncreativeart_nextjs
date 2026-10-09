'use client'

import type { ReactNode } from 'react'
import {
  LISTING_SKILL_LEVELS,
  type ListingSkillLevel,
} from '@/lib/listingFilters'

export type ShopFilterCategoryOption = {
  id: string
  name: string
  slug: string
  count: number
}

export type ShopFilterDraft = {
  /** null = all patterns */
  categorySlug: string | null
  levels: ListingSkillLevel[]
  price: 'free' | 'paid' | null
  sale: boolean
  bundle: boolean
}

type Props = {
  /** `sheet` = mobile bottom sheet; `panel` = tablet/laptop centered modal */
  variant: 'sheet' | 'panel'
  draft: ShopFilterDraft
  onChange: (next: ShopFilterDraft) => void
  categories: ShopFilterCategoryOption[]
  /** Live count for “Show N patterns” */
  resultCount: number
  onClear: () => void
  onApply: () => void
  onClose: () => void
}

/** Filters UI for shop — DESIGN_SPEC §4.2 mobile sheet / tablet panel / laptop More filters. */
export function ShopFiltersOverlay({
  variant,
  draft,
  onChange,
  categories,
  resultCount,
  onClear,
  onApply,
  onClose,
}: Props) {
  const isSheet = variant === 'sheet'

  const set = (patch: Partial<ShopFilterDraft>) => onChange({ ...draft, ...patch })

  const toggleLevel = (level: ListingSkillLevel) => {
    const levels = draft.levels.includes(level)
      ? draft.levels.filter((l) => l !== level)
      : [...draft.levels, level]
    set({ levels })
  }

  const body = (
    <>
      <Section title="Category">
        <RadioRow
          label="All patterns"
          checked={draft.categorySlug === null}
          onSelect={() => set({ categorySlug: null })}
        />
        {categories.map((c) => (
          <RadioRow
            key={c.id}
            label={c.name}
            count={c.count}
            checked={draft.categorySlug === c.slug}
            onSelect={() => set({ categorySlug: c.slug })}
          />
        ))}
      </Section>

      <Section title="Skill level">
        {LISTING_SKILL_LEVELS.map((level) => (
          <CheckRow
            key={level}
            label={level.charAt(0).toUpperCase() + level.slice(1)}
            checked={draft.levels.includes(level)}
            onToggle={() => toggleLevel(level)}
          />
        ))}
      </Section>

      <Section title="Price">
        <CheckRow
          label="Free"
          checked={draft.price === 'free'}
          onToggle={() => set({ price: draft.price === 'free' ? null : 'free' })}
        />
        <CheckRow
          label="Paid"
          checked={draft.price === 'paid'}
          onToggle={() => set({ price: draft.price === 'paid' ? null : 'paid' })}
        />
      </Section>

      <Section title="Offers">
        <CheckRow
          label="On sale"
          checked={draft.sale}
          onToggle={() => set({ sale: !draft.sale })}
        />
        <CheckRow
          label="Bundles"
          checked={draft.bundle}
          onToggle={() => set({ bundle: !draft.bundle })}
        />
      </Section>
    </>
  )

  const footer = (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-border bg-surface shrink-0">
      <button type="button" onClick={onClear} className="text-[14px] font-semibold text-primary">
        Clear all
      </button>
      <button
        type="button"
        onClick={onApply}
        className="min-h-12 px-6 rounded-full bg-primary text-white text-[14px] font-semibold hover:bg-primary-hover"
      >
        Show {resultCount} pattern{resultCount === 1 ? '' : 's'}
      </button>
    </div>
  )

  if (isSheet) {
    return (
      <div className="fixed inset-0 z-50 md:hidden">
        <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close filters" onClick={onClose} />
        <div className="absolute left-0 right-0 bottom-0 bg-surface rounded-t-2xl flex flex-col max-h-[88dvh] shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
          <div className="flex justify-center pt-2.5 pb-1" aria-hidden>
            <span className="w-10 h-1 rounded-full bg-border" />
          </div>
          <div className="flex items-center justify-between px-5 pb-3">
            <h2 className="text-[18px] font-bold text-ink">Filters</h2>
            <CloseBtn onClick={onClose} />
          </div>
          <div className="overflow-y-auto overscroll-contain min-h-0 flex-1 divide-y divide-border">
            {body}
          </div>
          {footer}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 hidden md:flex items-center justify-center p-6">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close filters" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="relative w-full max-w-md bg-surface rounded-2xl border border-border shadow-card flex flex-col max-h-[min(80dvh,640px)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-[18px] font-bold text-ink">Filters</h2>
          <CloseBtn onClick={onClose} />
        </div>
        <div className="overflow-y-auto overscroll-contain min-h-0 flex-1 divide-y divide-border">
          {body}
        </div>
        {footer}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-2">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function RadioRow({
  label,
  count,
  checked,
  onSelect,
}: {
  label: string
  count?: number
  checked: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 min-h-12 text-left text-[15px] text-ink"
    >
      <span
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
          checked ? 'border-primary' : 'border-border'
        }`}
        aria-hidden
      >
        {checked ? <span className="w-2.5 h-2.5 rounded-full bg-primary" /> : null}
      </span>
      <span className="flex-1">{label}</span>
      {typeof count === 'number' ? (
        <span className="text-[13px] text-muted">({count})</span>
      ) : null}
    </button>
  )
}

function CheckRow({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string
  count?: number
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 min-h-12 text-left text-[15px] text-ink"
    >
      <span
        className={`w-5 h-5 rounded-[4px] border-2 flex items-center justify-center shrink-0 ${
          checked ? 'bg-primary border-primary text-white' : 'border-border bg-white'
        }`}
        aria-hidden
      >
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="flex-1">{label}</span>
      {typeof count === 'number' ? (
        <span className="text-[13px] text-muted">({count})</span>
      ) : null}
    </button>
  )
}

function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClick}
      className="w-9 h-9 rounded-full bg-surface-warm flex items-center justify-center text-ink text-lg leading-none"
    >
      ×
    </button>
  )
}
