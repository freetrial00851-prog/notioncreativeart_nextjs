/**
 * Picks the guide and hub links shown on a product page, based on what the pattern is.
 * Plain internal links: they help buyers who are new to a technique and give crawlers
 * a topical path from every pattern to the guides and hubs that cover it.
 */

export type ProductGuideLink = { href: string; title: string; text: string }

const G = {
  magicRing: { href: '/guides/how-to-make-a-magic-ring-crochet', title: 'How to make a magic ring', text: 'The starting loop almost every amigurumi uses.' },
  safetyEyes: { href: '/guides/safety-eyes-for-amigurumi', title: 'Safety eyes for amigurumi', text: 'Sizes, placement and baby-safe alternatives.' },
  joinLimbs: { href: '/guides/how-to-join-limbs-and-sew-on-parts-amigurumi', title: 'Join limbs and sew on parts', text: 'Neat seams for arms, legs, ears and tails.' },
  stuffing: { href: '/guides/how-to-stuff-and-assemble-amigurumi', title: 'How to stuff and assemble amigurumi', text: 'Firm, even stuffing and tidy assembly.' },
  faces: { href: '/guides/how-to-embroider-faces-on-amigurumi', title: 'Embroider faces on amigurumi', text: 'Noses, mouths and brows that look right.' },
  pose: { href: '/guides/make-amigurumi-sit-stand-or-pose', title: 'Make amigurumi sit, stand or pose', text: 'Weighting, wire and shaping tips.' },
  gauge: { href: '/guides/crochet-gauge-swatch', title: 'How to make a gauge swatch', text: 'Check your tension before you start a garment.' },
  hooks: { href: '/guides/crochet-hook-sizes-chart', title: 'Crochet hook sizes chart', text: 'Convert mm, US and UK hook sizes.' },
  blocking: { href: '/guides/how-to-block-crochet', title: 'How to block crochet', text: 'Open up lace and set the shape of a finished piece.' },
  yarnWeight: { href: '/guides/yarn-weight-chart', title: 'Yarn weight chart', text: 'What worsted, DK, fingering and bulky mean.' },
  readPattern: { href: '/guides/how-to-read-a-crochet-pattern', title: 'How to read a crochet pattern', text: 'What the abbreviations, brackets and stitch counts mean.' },
  usUk: { href: '/guides/crochet-abbreviations-us-vs-uk', title: 'US and UK crochet terms', text: 'The same stitch name can mean two different stitches.' },
  vsKnitting: { href: '/guides/crochet-vs-knitting', title: 'Crochet vs knitting', text: 'How the two crafts differ and when to choose which.' },
  granny: { href: '/guides/granny-square-for-beginners', title: 'Granny squares for beginners', text: 'Build the motif this pattern is based on.' },
  skill: { href: '/guides/crochet-skill-levels-explained', title: 'Crochet skill levels explained', text: 'What beginner, easy and intermediate really mean.' },
} satisfies Record<string, ProductGuideLink>

const HUBS = {
  animals: { href: '/amigurumi-animals', title: 'Amigurumi animals', text: 'Crochet animal patterns grouped by creature.' },
  mini: { href: '/mini-amigurumi-and-keychains', title: 'Mini amigurumi and keychains', text: 'Small patterns, charms and quick gifts.' },
  dressed: { href: '/amigurumi-in-clothes-and-hats', title: 'Dressed amigurumi', text: 'Animals and dolls in outfits, hats and scarves.' },
  beginners: { href: '/crochet-patterns-for-beginners', title: 'Crochet patterns for beginners', text: 'Free and paid patterns marked beginner level.' },
} satisfies Record<string, ProductGuideLink>

const has = (text: string, re: RegExp) => re.test(text)

export function getProductGuideLinks(input: {
  title: string
  categorySlug?: string | null
  skillLevel?: string | null
}): ProductGuideLink[] {
  const text = input.title.toLowerCase()
  const cat = (input.categorySlug ?? '').toLowerCase()

  if (has(text, /\bknit(ting)?\b/) && !has(text, /crochet/)) {
    return [HUBS.beginners, G.vsKnitting, G.readPattern, G.yarnWeight]
  }

  const wearable = cat === 'wearables' || has(text, /\b(top|tank|vest|shrug|capelet|cardigan|skirt|poncho|sweater|blouse|shawl|wrap|bolero|dress)\b/)
  if (wearable) {
    return [
      G.gauge,
      G.hooks,
      G.blocking,
      has(text, /granny/) ? G.granny : G.readPattern,
    ]
  }

  const jewelry = cat === 'accessories' || has(text, /\b(earring|earrings|bracelet|necklace|jewelry|jewellery|bag|tote|scrunchie)\b/)
  if (jewelry) {
    return has(text, /\b(bag|tote)\b/)
      ? [G.granny, G.hooks, G.readPattern, G.usUk]
      : [G.hooks, G.yarnWeight, G.readPattern, G.usUk]
  }

  const amigurumi =
    ['amigurumi', 'baby-kids', 'seasonal'].includes(cat) ||
    has(text, /amigurumi|plush|plushie|lovey|doll|toy|keychain|stuffed/)
  if (amigurumi) {
    const hub = has(text, /keychain|charm|mini|tiny|ornament|pocket/)
      ? HUBS.mini
      : has(text, /dressed|overall|dungaree|sweater|outfit|hat|scarf|apron|skirt/)
        ? HUBS.dressed
        : HUBS.animals
    const picks: ProductGuideLink[] = [hub, G.magicRing]
    picks.push(has(text, /wire|poseable|pose/) ? G.pose : G.safetyEyes)
    picks.push(has(text, /dressed|overall|dungaree|sweater|outfit|hat/) ? G.joinLimbs : G.stuffing)
    return picks
  }

  return [HUBS.beginners, G.readPattern, G.usUk, G.skill]
}
