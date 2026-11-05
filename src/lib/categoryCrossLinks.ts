/**
 * Categories with no patterns of their own. The matching patterns are filed under Amigurumi, so these pages point
 * visitors there instead of leaving an empty grid. Only existing pages are linked; nothing says "coming soon".
 */
export type CrossLinks = { lead: string; links: { href: string; label: string }[]; /** Words matched against pattern titles, to show a few real patterns on an otherwise empty category page. */ terms?: string[]; /** Guides to show as cards, for a category that is about know-how rather than patterns. */ guideSlugs?: string[] }

const AMIGURUMI = { href: '/shop/amigurumi', label: 'All amigurumi patterns' }
const FREE = { href: '/free-crochet-patterns', label: 'Free crochet patterns' }

export const CATEGORY_CROSS_LINKS: Record<string, CrossLinks> = {
  accessories: {
    lead: 'Our keychains, bag charms, pencil cases and glasses cases are amigurumi patterns, so you will find them under Amigurumi.',
    links: [AMIGURUMI, { href: '/mini-amigurumi-and-keychains', label: 'Mini amigurumi and keychains' }, { href: '/search?q=keychain', label: 'Crochet keychain patterns' }, { href: '/search?q=case', label: 'Case and pouch patterns' }, FREE],
    terms: ['keychain', 'charm', 'case', 'pouch'],
  },
  'baby-kids': {
    lead: 'Rattles, lovey toys and baby animal sets are amigurumi patterns, so they are listed under Amigurumi.',
    links: [
      AMIGURUMI,
      { href: '/search?q=rattle', label: 'Rattle patterns' },
      { href: '/search?q=baby', label: 'Baby animal patterns' },
      { href: '/amigurumi-animals', label: 'Amigurumi animals' },
      { href: '/guides/safety-eyes-for-amigurumi', label: 'Safety eyes guide' },
    ],
    terms: ['rattle', 'lovey', 'teether', 'baby'],
  },
  bundles: {
    lead: 'Pattern sets, such as boy and girl pairs, trios and family sets, are listed under Amigurumi.',
    links: [AMIGURUMI, { href: '/search?q=set', label: 'Pattern sets' }, FREE],
    terms: ['set', 'trio', 'pair', 'boy and girl', 'duo'],
  },
  holiday: {
    lead: 'Halloween, Christmas and Easter amigurumi patterns are listed under Amigurumi.',
    links: [
      AMIGURUMI,
      { href: '/search?q=halloween', label: 'Halloween patterns' },
      { href: '/search?q=christmas', label: 'Christmas patterns' },
      { href: '/search?q=easter', label: 'Easter patterns' },
    ],
    terms: ['halloween', 'pumpkin', 'witch', 'ghost', 'spider'],
  },
  seasonal: {
    lead: 'Seasonal amigurumi, from pumpkins and woodland animals to spring bunnies and sea creatures, is listed under Amigurumi.',
    links: [AMIGURUMI, { href: '/amigurumi-animals', label: 'Amigurumi animals' }, { href: '/search?q=pumpkin', label: 'Pumpkin patterns' }, { href: '/search?q=bunny', label: 'Bunny patterns' }, FREE],
    terms: ['pumpkin', 'bunny', 'sun hat', 'sea', 'turtle'],
  },
  'home-decor': {
    lead: 'Decor toys, baskets and shelf sitters are amigurumi patterns, so they are listed under Amigurumi.',
    links: [AMIGURUMI, { href: '/search?q=basket', label: 'Basket patterns' }, { href: '/guides/how-to-block-crochet', label: 'How to block crochet' }],
    terms: ['basket', 'cactus', 'ornament', 'pillow'],
  },
  'kitchen-storage': {
    lead: 'The storage-style patterns we sell, such as baskets and cases, are amigurumi patterns and are listed under Amigurumi.',
    links: [AMIGURUMI, { href: '/search?q=basket', label: 'Basket patterns' }, { href: '/search?q=case', label: 'Case and pouch patterns' }],
    terms: ['basket', 'case', 'pouch'],
  },
  'tools-guides': {
    lead: 'This is the place for tools and know-how. Our guides cover hooks, yarn, gauge and every basic stitch.',
    links: [
      { href: '/guides', label: 'All crochet guides' },
      { href: '/guides/crochet-hook-sizes-chart', label: 'Hook sizes chart' },
      { href: '/guides/yarn-weight-chart', label: 'Yarn weight chart' },
      { href: '/guides/best-yarn-for-amigurumi', label: 'Best yarn for amigurumi' },
    ],
    guideSlugs: ['crochet-hook-sizes-chart', 'yarn-weight-chart', 'crochet-gauge-swatch', 'how-to-read-yarn-labels', 'best-yarn-for-amigurumi', 'safety-eyes-for-amigurumi'],
  },
}
