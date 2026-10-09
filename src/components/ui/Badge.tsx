import type { Product } from '@/lib/types'
import { SKILL_PILL_STYLES, skillLevelTagLabel } from '@/lib/productCardMeta'

/** Skill level pill — DESIGN_SPEC §3.5 */
export function LevelBadge({
  level,
  className = '',
}: {
  level: NonNullable<Product['skill_level']>
  className?: string
}) {
  const label = skillLevelTagLabel(level)
  if (!label) return null
  const style = SKILL_PILL_STYLES[level]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold leading-none ${className}`}
      style={{ background: style.background, color: style.color }}
    >
      {label}
    </span>
  )
}

type Status = 'new' | 'sale' | 'free' | 'featured' | 'sold_out'

const STATUS_CLASS: Record<Status, string> = {
  new: 'bg-primary text-white',
  sale: 'bg-sale text-white',
  free: 'bg-free text-white',
  featured: 'bg-ink text-white',
  sold_out: 'bg-ink text-white',
}

const STATUS_LABEL: Record<Status, string> = {
  new: 'NEW',
  sale: 'SALE',
  free: 'FREE',
  featured: 'FEATURED',
  sold_out: 'SOLD OUT',
}

/** NEW / SALE / FREE (and featured / sold out) — DESIGN_SPEC §3.5 */
export function StatusBadge({
  status,
  className = '',
}: {
  status: Status
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-[0.06em] ${STATUS_CLASS[status]} ${className}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

/** Neutral outline category chip */
export function CategoryChip({
  label,
  className = '',
}: {
  label: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border bg-white px-3 py-1 text-[11px] font-medium text-ink-soft ${className}`}
    >
      {label}
    </span>
  )
}
