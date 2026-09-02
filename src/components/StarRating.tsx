'use client'

import { MaterialIcon } from './MaterialIcon'

type StarRatingProps = {
  value: number
  /** Max stars (default 5). */
  max?: number
  size?: number
  /** When set, stars are clickable for input. */
  onChange?: (value: number) => void
  className?: string
}

export function StarRating({ value, max = 5, size = 16, onChange, className = '' }: StarRatingProps) {
  const interactive = typeof onChange === 'function'

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? 'Rating' : `${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1
        const filled = value >= star - 0.25
        const half = !filled && value >= star - 0.75
        const icon = filled ? 'star' : half ? 'star_half' : 'star'
        const color = filled || half ? '#c9a227' : 'var(--color-line)'

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={Math.round(value) === star}
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
              onClick={() => onChange(star)}
              className="p-0.5 -m-0.5 rounded hover:opacity-80 transition-opacity"
            >
              <MaterialIcon name={icon} size={size} color={value >= star ? '#c9a227' : 'var(--color-line)'} />
            </button>
          )
        }

        return <MaterialIcon key={star} name={icon} size={size} color={color} />
      })}
    </div>
  )
}

/** Compact summary: ★★★★☆ 4.2 (12) */
export function StarRatingSummary({
  averageRating,
  reviewCount,
  size = 14,
  className = '',
}: {
  averageRating: number
  reviewCount: number
  size?: number
  className?: string
}) {
  if (reviewCount < 1) return null
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] text-ink-soft ${className}`}>
      <StarRating value={averageRating} size={size} />
      <span className="text-ink font-medium tabular-nums">{averageRating.toFixed(1)}</span>
      <span>({reviewCount})</span>
    </span>
  )
}

/** Card/grid variant: ★★★★★ (12) — stars + count only, no decimal average. */
export function StarRatingCardSummary({
  averageRating,
  reviewCount,
  size = 12,
  className = '',
}: {
  averageRating: number
  reviewCount: number
  size?: number
  className?: string
}) {
  if (reviewCount < 1) return null
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] text-ink-soft ${className}`}>
      <StarRating value={averageRating} size={size} />
      <span className="tabular-nums">({reviewCount})</span>
    </span>
  )
}
