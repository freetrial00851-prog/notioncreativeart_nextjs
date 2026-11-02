import type { Guide } from '@/lib/guides'

/** Icon names understood by <GuideIcon>. */
export type GuideIconName = 'flag' | 'yarn' | 'hook' | 'bear' | 'sparkle'

export type GuideGroup = {
  id: string
  title: string
  /** One short line under the section heading. */
  intro: string
  icon: GuideIconName
  /** Accent for the icon tile and small labels. Every pair is AA on white, and groups are also told apart by icon and name. */
  accent: string
  slugs: string[]
}

/** The reading order: each section builds on the one before it. A guide not listed here still shows up under "More guides". */
export const GUIDE_GROUPS: GuideGroup[] = [
  {
    id: 'start-here',
    title: 'Start here',
    intro: 'What crochet is, how to hold the hook, and how to read a pattern.',
    icon: 'flag',
    accent: '#B9472F',
    slugs: [
      'how-to-crochet-for-beginners',
      'crochet-vs-knitting',
      'what-is-amigurumi',
      'how-to-hold-yarn-and-hook-crochet',
      'left-handed-crochet-guide',
      'crochet-skill-levels-explained',
      'how-to-read-a-crochet-pattern',
      'crochet-abbreviations-us-vs-uk',
      'how-to-read-crochet-symbols-and-charts',
    ],
  },
  {
    id: 'yarn-and-hooks',
    title: 'Yarn and hooks',
    intro: 'Choose your materials and check your gauge before you start.',
    icon: 'yarn',
    accent: '#1F6F78',
    slugs: [
      'crochet-hook-sizes-chart',
      'yarn-weight-chart',
      'how-to-read-yarn-labels',
      'best-yarn-for-amigurumi',
      'crochet-gauge-swatch',
    ],
  },
  {
    id: 'stitches-and-techniques',
    title: 'Stitches and techniques',
    intro: 'From the first stitch to small projects, each guide builds on the one before.',
    icon: 'hook',
    accent: '#7A3B5E',
    slugs: [
      'basic-crochet-stitches-for-beginners',
      'how-to-slip-stitch-and-slip-knot',
      'how-to-single-crochet',
      'how-to-half-double-crochet',
      'how-to-double-crochet',
      'how-to-fasten-off-and-weave-in-ends',
      'how-to-fix-mistakes-in-crochet',
      'how-to-crochet-in-the-round',
      'how-to-join-new-yarn-in-crochet',
      'how-to-change-colors-in-crochet',
      'granny-square-for-beginners',
      'simple-crochet-blanket-for-beginners',
    ],
  },
  {
    id: 'amigurumi',
    title: 'Amigurumi',
    intro: 'Everything for stuffed toys, from the magic ring to resizing a pattern.',
    icon: 'bear',
    accent: '#8A6A12',
    slugs: [
      'how-to-make-a-magic-ring-crochet',
      'invisible-decrease-amigurumi',
      'how-to-stuff-and-assemble-amigurumi',
      'safety-eyes-for-amigurumi',
      'how-to-embroider-faces-on-amigurumi',
      'how-to-make-amigurumi-bigger-or-smaller',
    ],
  },
  {
    id: 'finishing-and-care',
    title: 'Finishing and care',
    intro: 'Shape your finished work and look after it.',
    icon: 'sparkle',
    accent: '#4B5563',
    slugs: ['how-to-block-crochet', 'how-to-wash-crochet-and-amigurumi'],
  },
]

const FALLBACK_GROUP: GuideGroup = {
  id: 'more-guides',
  title: 'More guides',
  intro: '',
  icon: 'sparkle',
  accent: '#4B5563',
  slugs: [],
}

export function getGuideGroup(slug: string): GuideGroup {
  return GUIDE_GROUPS.find((g) => g.slugs.includes(slug)) ?? FALLBACK_GROUP
}

function plainText(text: string): string {
  return text.replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '$1')
}

/** Every visible word of the article, used for the read time. */
export function guideWordCount(guide: Guide): number {
  const parts: string[] = []
  for (const b of guide.body) {
    if (b.type === 'h2' || b.type === 'p' || b.type === 'note') parts.push(plainText(b.text))
    else if (b.type === 'ul' || b.type === 'ol') parts.push(...b.items.map(plainText))
    else if (b.type === 'table') parts.push(...b.head, ...b.rows.flat())
  }
  for (const f of guide.faq ?? []) parts.push(f.q, f.a)
  return parts.join(' ').split(/\s+/).filter(Boolean).length
}

/** Minutes to read at an average 200 words a minute (never below 1). */
export function guideReadMinutes(guide: Guide): number {
  return Math.max(1, Math.round(guideWordCount(guide) / 200))
}

export function guideTocItems(guide: Guide): { id: string; text: string }[] {
  const seen = new Map<string, number>()
  return guide.body
    .filter((b): b is Extract<typeof b, { type: 'h2' }> => b.type === 'h2')
    .map((b) => {
      const base = slugifyHeading(b.text)
      const n = (seen.get(base) ?? 0) + 1
      seen.set(base, n)
      return { id: n === 1 ? base : `${base}-${n}`, text: b.text }
    })
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
