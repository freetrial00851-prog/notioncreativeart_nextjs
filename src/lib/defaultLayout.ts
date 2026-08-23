import type { LayoutSection } from './types'

/** Default homepage section order — Newsletter last. Used as fallback and for
 *  merging newly-added section ids into a saved admin layout. */
export const DEFAULT_LAYOUT: LayoutSection[] = [
  { id: 'hero', label: 'Hero Banner', visible: true },
  { id: 'trust', label: 'Trust Strip', visible: true },
  { id: 'categories', label: 'Shop by Category', visible: true },
  { id: 'chapters', label: 'Skill Level Chapters', visible: true },
  { id: 'trending', label: 'Featured Items', visible: true },
  { id: 'new_arrivals', label: 'New Arrivals', visible: true },
  { id: 'skill_browse', label: 'Browse by Skill Level', visible: true },
  { id: 'free_patterns', label: 'Free Patterns Banner', visible: true },
  { id: 'bundles', label: 'Pattern Bundles', visible: true },
  { id: 'why_us', label: 'Why Makers Love Us', visible: true },
  { id: 'testimonials', label: 'Customer Testimonials', visible: true },
  { id: 'newsletter', label: 'Newsletter Banner', visible: true },
]

/** Merge a saved layout with any newly-added default sections (appended,
 *  visible) so a site that saved its layout before those sections existed
 *  still picks them up automatically instead of silently hiding them. */
export function mergeLayout(saved: LayoutSection[]): LayoutSection[] {
  const savedIds = new Set(saved.map((s) => s.id))
  const missing = DEFAULT_LAYOUT.filter((s) => !savedIds.has(s.id))
  return [...saved, ...missing]
}
