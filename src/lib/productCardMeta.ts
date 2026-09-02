import type { Product } from './types'

const SKILL_LABELS: Record<NonNullable<Product['skill_level']>, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

/** "Beginner · PDF" or "PDF" when skill level is unset. */
export function formatProductSkillFormat(skillLevel: Product['skill_level']): string {
  const skill = skillLevel ? SKILL_LABELS[skillLevel] : null
  return skill ? `${skill} · PDF` : 'PDF'
}
