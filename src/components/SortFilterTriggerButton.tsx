'use client'

import { MaterialIcon } from './MaterialIcon'

type SortFilterTriggerButtonProps = {
  activeFilterCount: number
  onClick: () => void
  className?: string
}

/** Compact mobile pill — sits inline with listing h1 (not full-width). */
export function SortFilterTriggerButton({
  activeFilterCount,
  onClick,
  className = '',
}: SortFilterTriggerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap ' +
        'border border-line rounded-full px-3 py-2 text-[12px] font-medium ' +
        'bg-canvas hover:bg-surface transition-colors ' +
        className
      }
    >
      <MaterialIcon name="tune" size={15} />
      Sort & Filter
      {activeFilterCount > 0 && (
        <span
          className="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center"
          style={{ background: 'var(--color-accent)' }}
        >
          {activeFilterCount}
        </span>
      )}
    </button>
  )
}
