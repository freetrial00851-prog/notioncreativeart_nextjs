import type { Product } from './types'

const SKILL_LABELS: Record<NonNullable<Product['skill_level']>, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export const SKILL_PILL_STYLES: Record<
  NonNullable<Product['skill_level']>,
  { background: string; color: string }
> = {
  beginner: {
    background: 'var(--color-skill-beginner-soft)',
    color: 'var(--color-skill-beginner-ink)',
  },
  intermediate: {
    background: 'var(--color-skill-intermediate-soft)',
    color: 'var(--color-skill-intermediate-ink)',
  },
  advanced: {
    background: 'var(--color-skill-advanced-soft)',
    color: 'var(--color-skill-advanced-ink)',
  },
}

/** Skill-level pill label, or null when unset (no pill rendered). */
export function skillLevelTagLabel(skillLevel: Product['skill_level']): string | null {
  if (!skillLevel) return null
  return SKILL_LABELS[skillLevel]
}

export type StatusBadgeKind = 'sold_out' | 'sale' | 'new' | 'featured'

/**
 * The ONE status badge a product shows on its image (cards, product page).
 * Priority: SOLD OUT > SALE > NEW > FEATURED.
 *
 * - SALE needs a real discount (compare-at price above price) — a "sale" tag
 *   without a struck-through price is misleading.
 * - There is deliberately no FREE badge: the green "Free" price (and the
 *   download button) already say it, so a badge would repeat it.
 * - Skill level is a separate attribute (bottom-left pill), not a status.
 */
export function getStatusBadge(
  product: Pick<Product, 'sold_out' | 'card_badge' | 'price' | 'compare_at_price'>,
): StatusBadgeKind | null {
  if (product.sold_out) return 'sold_out'
  const onSale =
    Number(product.price) > 0 &&
    !!product.compare_at_price &&
    Number(product.compare_at_price) > Number(product.price)
  if (product.card_badge === 'sale' && onSale) return 'sale'
  if (product.card_badge === 'new') return 'new'
  if (product.card_badge === 'featured') return 'featured'
  return null
}
