import type { Guide } from '@/lib/guides'

export const abbreviationsGuide: Guide = {
  slug: 'crochet-abbreviations-us-vs-uk',
  title: 'Crochet Abbreviations: US vs UK Terms Chart',
  description:
    'A plain chart of common crochet abbreviations and the US vs UK name for each stitch, so you never work the wrong stitch from a pattern.',
  datePublished: '2026-10-25',
  dateModified: '2026-10-25',
  author: 'Notion Creative Art',
  related: ['how-to-read-a-crochet-pattern'],
  body: [
    {
      type: 'p',
      text: 'Crochet patterns are written in abbreviations, and the same word can mean a different stitch depending on where the pattern was written. The most common mix-up is "double crochet": in US terms it is one stitch, in UK terms it is a smaller, shorter one. Check which terms your pattern uses before you start, and this chart will help you translate.',
    },
    { type: 'h2', text: 'The one thing to check first' },
    {
      type: 'p',
      text: 'Most patterns say near the top whether they use US or UK terms. If yours does not, look at the stitches used in the first rounds. A pattern with "sc" (single crochet) is almost certainly US. A pattern that starts with "dc" and works a flat round of tight stitches, such as for a toy, may be UK. When in doubt, make a small swatch of the first round and compare it with the picture.',
    },
    { type: 'h2', text: 'US and UK stitch names' },
    {
      type: 'table',
      caption: 'Standard stitch names. The stitch is the same, only its name changes.',
      head: ['US term', 'US abbreviation', 'UK term', 'UK abbreviation'],
      rows: [
        ['Slip stitch', 'sl st', 'Slip stitch', 'ss'],
        ['Single crochet', 'sc', 'Double crochet', 'dc'],
        ['Half double crochet', 'hdc', 'Half treble', 'htr'],
        ['Double crochet', 'dc', 'Treble', 'tr'],
        ['Treble crochet', 'tr', 'Double treble', 'dtr'],
        ['Double treble', 'dtr', 'Triple treble', 'trtr'],
        ['Skip', 'skip', 'Miss', 'miss'],
        ['Yarn over', 'yo', 'Yarn round hook', 'yrh'],
        ['Gauge', 'gauge', 'Tension', 'tension'],
      ],
    },
    { type: 'h2', text: 'Common abbreviations in any pattern' },
    {
      type: 'table',
      head: ['Abbreviation', 'Meaning'],
      rows: [
        ['ch', 'chain'],
        ['st / sts', 'stitch / stitches'],
        ['rnd / rnds', 'round / rounds'],
        ['rep', 'repeat'],
        ['inc', 'increase (two stitches in the same stitch)'],
        ['dec', 'decrease (two stitches worked together)'],
        ['sc2tog', 'single crochet two stitches together (a decrease)'],
        ['BLO / FLO', 'back loop only / front loop only'],
        ['MR', 'magic ring (also called a magic circle)'],
        ['FO', 'fasten off'],
        ['( )', 'a group of stitches worked into one stitch, or the stitch count at the end of a round'],
        ['*  *', 'repeat the part between the asterisks as many times as the pattern says'],
      ],
    },
    { type: 'h2', text: 'Amigurumi: a few terms worth knowing' },
    {
      type: 'ul',
      items: [
        'Amigurumi is usually worked in a continuous spiral, so rounds are not joined and you mark the first stitch of each round with a stitch marker.',
        'An invisible decrease works through the front loops only, which closes shaping without leaving a gap. Many patterns abbreviate it as "inv dec".',
        'The number in brackets at the end of a round, for example (18), is the total stitches you should have. Count it each round to catch mistakes early.',
      ],
    },
    { type: 'h2', text: 'How our patterns are written' },
    {
      type: 'p',
      text: 'Each pattern states its terms and skill level on its page. If you are new to reading patterns, start with our [guide to reading a crochet pattern](/guides/how-to-read-a-crochet-pattern), then pick a beginner-friendly project from the [free crochet patterns](/free-crochet-patterns) or browse [amigurumi patterns](/shop/amigurumi).',
    },
  ],
  faq: [
    {
      q: 'Is a UK double crochet the same as a US single crochet?',
      a: 'Yes. The UK double crochet (dc) is the stitch called single crochet (sc) in the US. The UK treble (tr) is the US double crochet (dc).',
    },
    {
      q: 'What happens if I work a US pattern with UK terms?',
      a: 'You will work taller stitches than intended and the piece will come out bigger and looser. For amigurumi the stuffing can show through, so confirm the terms before you start.',
    },
  ],
}
