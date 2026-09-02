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
