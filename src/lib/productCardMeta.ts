import type { Product } from './types'

const SKILL_LABELS: Record<NonNullable<Product['skill_level']>, string> = {
  beginner: 'Beginner Friendly',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

/** Skill-level pill label, or null when unset (no pill rendered). */
export function skillLevelTagLabel(skillLevel: Product['skill_level']): string | null {
  if (!skillLevel) return null
  return SKILL_LABELS[skillLevel]
}
