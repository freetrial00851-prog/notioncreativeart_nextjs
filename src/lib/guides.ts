import { abbreviationsGuide } from '@/content/guides/crochet-abbreviations-us-vs-uk'
import { readingPatternGuide } from '@/content/guides/how-to-read-a-crochet-pattern'

/** One piece of an article. Inline links use [text](/path) inside `text` / list items. */
export type GuideBlock =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; caption?: string; head: string[]; rows: string[][] }
  | { type: 'note'; text: string }

export type Guide = {
  slug: string
  title: string
  /** 140-155 characters: used as meta description and on the index card. */
  description: string
  datePublished: string
  /** Only change on a real edit: it is sent to search engines as the last-modified date. */
  dateModified: string
  author: string
  body: GuideBlock[]
  /** Visible questions at the end of the article (no FAQ markup: Google no longer shows it for shops). */
  faq?: { q: string; a: string }[]
  /** Other guides to link at the bottom. */
  related?: string[]
}

/** Explicit list (not a folder scan) so every route is known at build time. */
const GUIDES: Guide[] = [abbreviationsGuide, readingPatternGuide]

export function getAllGuides(): Guide[] {
  return [...GUIDES].sort((a, b) => b.dateModified.localeCompare(a.dateModified))
}

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug)
}

export function getRelatedGuides(guide: Guide): Guide[] {
  const wanted = guide.related ?? GUIDES.filter((g) => g.slug !== guide.slug).map((g) => g.slug)
  return wanted.map((s) => getGuide(s)).filter((g): g is Guide => !!g && g.slug !== guide.slug)
}
