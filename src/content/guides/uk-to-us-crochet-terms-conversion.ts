import type { Guide } from '@/lib/guides'

export const ukToUsTermsGuide: Guide = {
  slug: 'uk-to-us-crochet-terms-conversion',
  title: 'UK to US Crochet Terms: How to Convert Any Pattern',
  description:
    'Convert UK to US crochet terms with a full stitch table, clues for spotting which system a pattern uses, and a worked line-by-line example.',
  datePublished: '2026-11-05',
  dateModified: '2026-11-05',
  author: 'Notion Creative Art',
  related: ['crochet-abbreviations-us-vs-uk', 'how-to-read-a-crochet-pattern', 'how-to-double-crochet'],
  body: [
    {
      type: 'p',
      text: `Sooner or later you will find a pattern you love that was written in the other crochet language. Knowing how to convert UK to US crochet terms (and back) keeps you from working the wrong stitch for a whole project. The names are the same words, but most of them point to different stitches. This guide gives you a full conversion table, ways to tell which system a pattern uses, and a worked example you can copy.`,
    },
    { type: 'h2', text: `Why the two systems exist` },
    {
      type: 'p',
      text: `Both systems describe the same stitches. Only the names moved. US terms call the shortest basic stitch a single crochet, while UK terms call it a double crochet. Every name after that is shifted by one step, which is why "double crochet" is the most confusing phrase in crochet. If you want only the short chart, our [US and UK abbreviations guide](/guides/crochet-abbreviations-us-vs-uk) has it. This page adds the method.`,
    },
    { type: 'h2', text: `Full UK to US conversion table` },
    {
      type: 'table',
      caption: `Stitch names in both systems`,
      head: [`UK name`, `UK abbreviation`, `US name`, `US abbreviation`],
      rows: [
        [`Chain`, `ch`, `Chain`, `ch`],
        [`Slip stitch`, `ss`, `Slip stitch`, `sl st`],
        [`Double crochet`, `dc`, `Single crochet`, `sc`],
        [`Half treble`, `htr`, `Half double crochet`, `hdc`],
        [`Treble`, `tr`, `Double crochet`, `dc`],
        [`Double treble`, `dtr`, `Treble crochet`, `tr`],
        [`Triple treble`, `trtr`, `Double treble crochet`, `dtr`],
        [`Two double crochet together`, `dc2tog`, `Two single crochet together`, `sc2tog`],
        [`Yarn round hook`, `yrh`, `Yarn over`, `yo`],
        [`Miss`, `miss`, `Skip`, `sk`],
        [`Tension`, `tension`, `Gauge`, `gauge`],
      ],
    },
    {
      type: 'p',
      text: `Chain stitches, magic rings and slip knots are made the same way in both systems, so they never need converting. Going from US to UK, read the table from right to left.`,
    },
    { type: 'h2', text: `How to tell which system a pattern uses` },
    {
      type: 'p',
      text: `Many designers state it near the top, often in a line like "US terms". When they do not, look for clues.`,
    },
    {
      type: 'ul',
      items: [
        `Any mention of "sc" or "hdc" means US. Any mention of "htr", "dtr" or "miss" means UK.`,
        `The word "tension" instead of "gauge" points to UK. So does "yarn round hook".`,
        `A toy pattern that makes its whole body from "dc" and never uses another stitch is almost certainly UK, because the dense toy stitch is a UK double crochet.`,
        `A toy pattern that uses "dc" for a few taller stitches among many "sc" is US.`,
        `The materials list can help: yarn weights such as "DK" or "aran" are more common in UK patterns, while "worsted" is more common in US ones. This is only a hint, because designers mix them.`,
      ],
    },
    {
      type: 'note',
      text: `If a pattern still gives no clue, work the first round or row and compare it with the photo. A toy that comes out loose and floppy, with visible gaps, was probably worked in taller stitches than the designer meant.`,
    },
    { type: 'h2', text: `How to convert a pattern line by line` },
    {
      type: 'ol',
      items: [
        `Decide the system of the original pattern, using the clues above.`,
        `Copy the pattern and write the new stitch name in the margin above each abbreviation. Do the whole pattern before you start crocheting.`,
        `Convert the stitch names only. Do not change the numbers, the stitch counts in brackets, or the repeats.`,
        `Convert any shorthand words too: miss becomes skip, tension becomes gauge.`,
        `Check one round or row. The stitch count must match the number in brackets before you go on.`,
      ],
    },
    { type: 'h2', text: `A worked example: UK amigurumi ball` },
    {
      type: 'p',
      text: `Here is a short UK round-by-round pattern for a ball, with the US version beside it. The counts do not change, and you can verify them yourself.`,
    },
    {
      type: 'table',
      caption: `UK pattern converted to US terms`,
      head: [`Round`, `UK version`, `US version`, `Stitches`],
      rows: [
        [`1`, `6 dc in a magic ring`, `6 sc in a magic ring`, `6`],
        [`2`, `2 dc in each st around`, `2 sc in each st around`, `12`],
        [`3`, `*dc in next st, 2 dc in next st*, repeat 6 times`, `*sc in next st, 2 sc in next st*, repeat 6 times`, `18`],
        [`4`, `*dc in next 2 sts, 2 dc in next st*, repeat 6 times`, `*sc in next 2 sts, 2 sc in next st*, repeat 6 times`, `24`],
        [`5`, `dc in each st around`, `sc in each st around`, `24`],
        [`6`, `*dc in next 2 sts, dc2tog*, repeat 6 times`, `*sc in next 2 sts, sc2tog*, repeat 6 times`, `18`],
      ],
    },
    {
      type: 'p',
      text: `Check the arithmetic. Round 3 turns each 2 stitches into 3, so 6 repeats take 12 stitches to 18. Round 4 turns each 3 stitches into 4, so 6 repeats take 18 stitches to 24. In round 6 each repeat uses 4 stitches and makes 3, so 24 stitches become 18. If your own count differs, you converted a stitch name wrongly or lost a stitch.`,
    },
    { type: 'h2', text: `Taller stitches need extra care` },
    {
      type: 'p',
      text: `With taller stitches the shift matters most. A UK pattern that says "tr" wants what a US pattern calls a double crochet, and a UK "dtr" is a US treble. Turning chains are usually written in the pattern, so copy that number as written and do not guess. If you are learning the taller stitches, our [double crochet guide](/guides/how-to-double-crochet) and [half double crochet guide](/guides/how-to-half-double-crochet) show how they are made.`,
    },
    { type: 'h2', text: `UK terms and amigurumi` },
    {
      type: 'p',
      text: `Toys are where this matters most. Amigurumi is made from the shortest, tightest stitch so the stuffing cannot show through. In US patterns that is "sc". In UK patterns the same stitch is "dc". If you work a UK toy pattern as US double crochet, you will make a larger, looser piece with gaps. Read [what amigurumi is](/guides/what-is-amigurumi) and [how to stuff and assemble it](/guides/how-to-stuff-and-assemble-amigurumi) if you are new to toys.`,
    },
    { type: 'h2', text: `Common slips and how to fix them` },
    {
      type: 'table',
      caption: `Conversion troubleshooting`,
      head: [`What you see`, `Why it happens`, `What to do`],
      rows: [
        [`The toy is much bigger than the photo`, `A UK dc was worked as a US dc, so every stitch is taller`, `Pull out the piece. Use the table above and work every "dc" as a single crochet.`],
        [`The fabric has gaps and the stuffing shows`, `Stitches are taller than the designer intended`, `Check the system, then redo the first rounds with the shorter stitch.`],
        [`The stitch counts do not match the brackets`, `You converted a stitch name but also changed a number`, `Change names only. Recount each round against the pattern.`],
        [`A flat piece grows wider than the pattern says`, `Turning chains were changed or counted as stitches`, `Use the turning chain given in the pattern. Check whether it counts as a stitch.`],
        [`Part of the pattern is US and part UK`, `The designer mixed terms or a note was missed`, `Read the pattern notes. Convert only the lines that clearly use the other system.`],
      ],
    },
    { type: 'h2', text: `Next steps` },
    {
      type: 'p',
      text: `Practice with a pattern you already know. Take a few lines of a US pattern and write them in UK terms, then convert them back. If you can do it without looking at the table, you can read both systems. Also read our guide to [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern). Every pattern in our [shop](/shop) lists its materials and skill level, so you can pick one that suits you, and you can find more to practice with in our [free crochet patterns](/free-crochet-patterns).`,
    },
  ],
  faq: [
    {
      q: `Is a UK double crochet the same as a US single crochet?`,
      a: `Yes. They are the same stitch with two names. The UK treble (tr) is the matching US double crochet (dc).`,
    },
    {
      q: `How can I tell if a pattern is UK or US?`,
      a: `Look for words such as "htr", "miss", "tension" or "yarn round hook", which point to UK, and "sc", "hdc", "skip" or "gauge", which point to US. If there are no clues, work the first round and compare it with the photo.`,
    },
    {
      q: `Do I need to change the stitch counts when I convert a pattern?`,
      a: `No. Only the stitch names change. The numbers, repeats and the counts in brackets stay exactly the same.`,
    },
    {
      q: `Which system is used for amigurumi?`,
      a: `Both are used. The stitch is the same: short, tight and dense. It is called single crochet (sc) in US patterns and double crochet (dc) in UK patterns.`,
    },
    {
      q: `What if I work a pattern in the wrong system?`,
      a: `Your piece will come out a different size and texture, because the stitches will be taller or shorter than planned. Unravel it, check the system, and begin again with the right stitch.`,
    },
  ],
}
