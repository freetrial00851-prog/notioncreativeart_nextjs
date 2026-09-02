import type { Product } from '../lib/types'
import { SKILL_PILL_STYLES } from '../lib/productCardMeta'

/** Matches product-detail tag pills (category, skill level, etc.). */
export function ProductTagPill({
  label,
  skillLevel,
  compact = false,
  className = '',
}: {
  label: string
  /** When set, uses skill-level color coding; omit for neutral category/badge pills. */
  skillLevel?: Product['skill_level']
  /** Slightly tighter padding for shop cards. */
  compact?: boolean
  className?: string
}) {
  const skillStyle = skillLevel ? SKILL_PILL_STYLES[skillLevel] : null

  return (
    <span
      className={`inline-flex items-center text-[10px] tracking-[0.14em] uppercase rounded-full whitespace-nowrap ${
        compact ? 'px-2.5 py-0.5' : 'px-3 py-1'
      } ${className}`}
      style={
        skillStyle
          ? { background: skillStyle.background, color: skillStyle.color }
          : { background: 'var(--color-surface)', color: 'var(--color-ink-soft)' }
      }
    >
      {label}
    </span>
  )
}
