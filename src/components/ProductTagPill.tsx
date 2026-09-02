/** Matches product-detail tag pills (category, skill level, etc.). */
export function ProductTagPill({
  label,
  compact = false,
  className = '',
}: {
  label: string
  /** Slightly tighter padding for shop cards. */
  compact?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center text-[10px] tracking-[0.14em] uppercase rounded-full whitespace-nowrap ${
        compact ? 'px-2.5 py-0.5' : 'px-3 py-1'
      } ${className}`}
      style={{ background: 'var(--color-surface)', color: 'var(--color-ink-soft)' }}
    >
      {label}
    </span>
  )
}
