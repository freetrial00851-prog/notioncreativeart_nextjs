/** Longest slug we create from a title. Longer web addresses look spammy when shared and add nothing for search. */
export const MAX_SLUG_LENGTH = 60

/** Tail phrases that only repeat the title's marketing words. */
const STOP_PHRASES = [
  'instant-download',
  'digital-download',
  'pdf-pattern',
  'crochet-tutorial',
  'for-beginners',
  'beginner-friendly',
  'baby-shower-gift',
  'baby-shower',
  'nursery-decor',
  'gift-idea',
  'us-terms',
  'intermediate-level',
  'advanced-level',
  'pdf',
  'tutorial',
  'easy',
  'beginner',
  'intermediate',
  'advanced',
  'kawaii',
  'cute',
]

function plain(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Web address for a new product made from its title: lowercase words, marketing filler removed,
 * cut at a word boundary to at most {@link MAX_SLUG_LENGTH} characters.
 */
export function slugFromTitle(title: string): string {
  const full = plain(title)
  let slug = full
  for (const phrase of STOP_PHRASES) {
    slug = `-${slug}-`.replace(new RegExp(`-${phrase}(?=-)`, 'g'), '').replace(/^-+|-+$/g, '')
  }
  if (!slug) slug = full
  if (slug.length > MAX_SLUG_LENGTH) {
    const cut = slug.slice(0, MAX_SLUG_LENGTH)
    const lastDash = cut.lastIndexOf('-')
    slug = lastDash > 20 ? cut.slice(0, lastDash) : cut
  }
  return slug.replace(/-+$/g, '')
}
