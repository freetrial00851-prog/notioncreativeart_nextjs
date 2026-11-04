import type { Guide } from '@/lib/guides'

export const abbreviationsGuide: Guide = {
  slug: 'crochet-abbreviations-us-vs-uk',
  title: 'Crochet Abbreviations: US vs UK Terms Chart',
  description:
    'A plain chart of common crochet abbreviations and the US vs UK name for each stitch, so you never work the wrong stitch from a pattern.',
  datePublished: '2026-10-25',
  dateModified: '2026-11-05',
  author: 'Notion Creative Art',
  related: ['how-to-read-a-crochet-pattern', 'how-to-read-crochet-symbols-and-charts', 'basic-crochet-stitches-for-beginners'],
  body: [
    {
      type: 'p',
      text: 'Crochet patterns are written in abbreviations, and the same word can mean a different stitch depending on where the pattern was written. The most common mix-up is "double crochet": in US terms it is one stitch, in UK terms it is a smaller, shorter one. Check which terms your pattern uses before you start, and this chart will help you translate every abbreviation you meet.',
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
        ['Skip', 'sk', 'Miss', 'miss'],
        ['Yarn over', 'yo', 'Yarn round hook', 'yrh'],
        ['Gauge', 'gauge', 'Tension', 'tension'],
      ],
    },
    {
      type: 'note',
      text: 'Quick rule: a US stitch name is one step shorter than the UK name with the same letters. US single crochet is UK double crochet, and US double crochet is UK treble.',
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
    { type: 'h2', text: 'Shaping and position terms' },
    {
      type: 'table',
      head: ['Abbreviation', 'Meaning'],
      rows: [
        ['tog', 'together, for example "dc2tog" is two double crochet worked together'],
        ['inv dec', 'invisible decrease, worked through the front loops only'],
        ['sp / ch-sp', 'space / chain space, the gap made by one or more chains'],
        ['beg', 'beginning'],
        ['rem', 'remaining'],
        ['pm', 'place marker'],
        ['lp / lps', 'loop / loops'],
        ['RS / WS', 'right side / wrong side of the work'],
        ['FPdc / BPdc', 'front post double crochet / back post double crochet, worked around the post of a stitch'],
        ['cl', 'cluster, several unfinished stitches closed together'],
      ],
    },
    { type: 'h2', text: 'How to read the brackets, asterisks and counts' },
    {
      type: 'p',
      text: 'Brackets and asterisks save space by telling you to repeat a group. A line such as "Rnd 3: (sc, inc) x 6 (18)" means: work one single crochet, then an increase, and repeat that pair six times. The number in the last brackets, (18), is the total stitches you should have at the end of the round.',
    },
    {
      type: 'p',
      text: 'Check the arithmetic once and it makes sense. Starting from 12 stitches, each repeat of "sc, inc" uses two stitches and makes three, so six repeats give 18. A decrease line works the opposite way: "Rnd 5: (sc, dec) x 6 (12)" starts with 18 stitches and ends with 12. If your count does not match the number in brackets, stop and recount before the mistake spreads.',
    },
    { type: 'h2', text: 'Amigurumi: a few terms worth knowing' },
    {
      type: 'ul',
      items: [
        'Amigurumi is usually worked in a continuous spiral, so rounds are not joined and you mark the first stitch of each round with a stitch marker.',
        'An invisible decrease works through the front loops only, which closes shaping without leaving a gap. Many patterns abbreviate it as "inv dec". Our guide to the [invisible decrease](/guides/invisible-decrease-amigurumi) shows it step by step.',
        'The number in brackets at the end of a round, for example (18), is the total stitches you should have. Count it each round to catch mistakes early.',
        'Round 1 of a toy often starts in a magic ring ("MR"), a loop that pulls tight so there is no hole at the center.',
      ],
    },
    { type: 'h2', text: 'Common problems and fixes' },
    {
      type: 'table',
      caption: 'Troubleshooting abbreviations',
      head: ['What you see', 'Why', 'What to do'],
      rows: [
        ['The piece comes out too big and loose', 'A US pattern was worked with UK terms, so every stitch is taller', 'Check the terms at the top of the pattern, then use this chart to translate before you start again'],
        ['A stitch count does not match the brackets', 'A repeat was missed, or an inc or dec was swapped', 'Recount the round, find where the count went wrong and rework from there'],
        ['You do not know an abbreviation', 'It is not in the standard list, or it is a designer shorthand', 'Look for the pattern key, usually near the start of the PDF, before you guess'],
        ['A stitch looks different from the photo', 'The pattern may use post stitches or loops-only stitches', 'Check for BLO, FLO, FPdc or BPdc in that round'],
      ],
    },
    { type: 'h2', text: 'How our patterns are written' },
    {
      type: 'p',
      text: 'Each pattern states its terms and skill level on its page. If you are new to reading patterns, start with our [guide to reading a crochet pattern](/guides/how-to-read-a-crochet-pattern), and learn the picture version in [crochet symbols and charts](/guides/how-to-read-crochet-symbols-and-charts). Then pick a beginner-friendly project from the [free crochet patterns](/free-crochet-patterns) or browse [amigurumi patterns](/shop/amigurumi).',
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
    {
      q: 'What does "inc" mean in a crochet pattern?',
      a: 'It stands for increase: you work two stitches into the same stitch, which adds one stitch to the round. Increases are how a flat circle grows and how toys get their round shape.',
    },
    {
      q: 'What does "dec" or "sc2tog" mean?',
      a: 'Both mean a decrease. You work two stitches together so they become one, which removes a stitch from the round. Toys use decreases to close the shape before stuffing.',
    },
    {
      q: 'Where do I find the abbreviation key for a pattern?',
      a: 'Most written patterns list their abbreviations near the start of the PDF. If a term is missing from the key, check this chart before you guess.',
    },
  ],
}
