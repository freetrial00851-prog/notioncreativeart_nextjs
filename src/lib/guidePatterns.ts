/**
 * Which real patterns each guide points at. A guide shows up to four patterns under the article, picked by words in the
 * pattern title, so the links stay real as the catalogue changes. If a guide's words match fewer than two patterns it
 * falls back to the beginner patterns.
 */
export type GuidePicks = { kind: 'beginner' | 'terms'; heading: string; blurb: string; terms?: string[] }

const BEGINNER: GuidePicks = {
  kind: 'beginner',
  heading: 'Patterns to practice on',
  blurb: 'Easy patterns that show their skill level, with the free ones first.',
}

const AMIGURUMI: GuidePicks = {
  kind: 'terms',
  heading: 'Amigurumi patterns to try',
  blurb: 'Put these skills to work on a real pattern.',
  terms: ['bunny', 'teddy', 'cat', 'fox', 'panda', 'frog'],
}

const WEARABLES: GuidePicks = {
  kind: 'terms',
  heading: 'Wearable patterns to try',
  blurb: 'Crochet clothes where gauge and finishing matter most.',
  terms: ['cardigan', 'shawl'],
}

const MINI: GuidePicks = {
  kind: 'terms',
  heading: 'Small patterns to try',
  blurb: 'Quick makes that are good for practising one skill at a time.',
  terms: ['mini', 'keychain', 'tiny', 'charm'],
}

const BY_SLUG: Record<string, GuidePicks> = {
  'crochet-gauge-swatch': WEARABLES,
  'how-to-block-crochet': WEARABLES,
  'invisible-decrease-amigurumi': MINI,
  'how-to-make-a-magic-ring-crochet': MINI,
  'how-to-wash-crochet-and-amigurumi': AMIGURUMI,
}

const BY_GROUP: Record<string, GuidePicks> = {
  'start-here': BEGINNER,
  'yarn-and-hooks': BEGINNER,
  'stitches-and-techniques': BEGINNER,
  amigurumi: AMIGURUMI,
  'finishing-and-care': AMIGURUMI,
}

export function getGuidePicks(slug: string, groupId: string): GuidePicks {
  return BY_SLUG[slug] ?? BY_GROUP[groupId] ?? BEGINNER
}
