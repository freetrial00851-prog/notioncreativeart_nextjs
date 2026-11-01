import { abbreviationsGuide } from '@/content/guides/crochet-abbreviations-us-vs-uk'
import { readingPatternGuide } from '@/content/guides/how-to-read-a-crochet-pattern'
import { magicRingGuide } from '@/content/guides/how-to-make-a-magic-ring-crochet'
import { singleCrochetGuide } from '@/content/guides/how-to-single-crochet'
import { crochetForBeginnersGuide } from '@/content/guides/how-to-crochet-for-beginners'
import { stuffAndAssembleGuide } from '@/content/guides/how-to-stuff-and-assemble-amigurumi'
import { halfDoubleCrochetGuide } from '@/content/guides/how-to-half-double-crochet'
import { doubleCrochetGuide } from '@/content/guides/how-to-double-crochet'
import { hookSizesGuide } from '@/content/guides/crochet-hook-sizes-chart'
import { basicStitchesGuide } from '@/content/guides/basic-crochet-stitches-for-beginners'
import { invisibleDecreaseGuide } from '@/content/guides/invisible-decrease-amigurumi'
import { slipStitchGuide } from '@/content/guides/how-to-slip-stitch-and-slip-knot'
import { changeColorsGuide } from '@/content/guides/how-to-change-colors-in-crochet'
import { bestYarnGuide } from '@/content/guides/best-yarn-for-amigurumi'
import { fixMistakesGuide } from '@/content/guides/how-to-fix-mistakes-in-crochet'

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
const GUIDES: Guide[] = [abbreviationsGuide, readingPatternGuide, magicRingGuide, singleCrochetGuide, crochetForBeginnersGuide, stuffAndAssembleGuide, halfDoubleCrochetGuide, doubleCrochetGuide, hookSizesGuide, basicStitchesGuide, invisibleDecreaseGuide, slipStitchGuide, changeColorsGuide, bestYarnGuide, fixMistakesGuide]

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
