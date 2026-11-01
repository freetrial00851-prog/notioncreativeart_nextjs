import type { Guide } from '@/lib/guides'

export const crochetSymbolsGuide: Guide = {
  slug: 'how-to-read-crochet-symbols-and-charts',
  title: 'How to Read Crochet Symbols and Charts (with a Symbol Key)',
  description:
    'Learn what crochet symbols mean and how to read a crochet chart for rows and rounds: the common stitch symbols, reading direction, and how charts match written patterns.',
  datePublished: '2026-11-02',
  dateModified: '2026-11-02',
  author: 'Notion Creative Art',
  related: ['how-to-read-a-crochet-pattern', 'basic-crochet-stitches-for-beginners', 'crochet-abbreviations-us-vs-uk'],
  body: [
    {
      type: 'p',
      text: `A crochet chart is a picture of a pattern. Instead of writing "sc 6, ch 2, dc 3", it draws a small symbol for each stitch, laid out the way the finished fabric looks. Charts are popular in patterns from many countries, because the symbols are the same in every language. This guide explains the common symbols, which way to read a chart and how a chart relates to a written pattern.`,
    },
    { type: 'h2', text: `Why charts are useful` },
    {
      type: 'ul',
      items: [
        `You can see the shape of the fabric, including motifs, lace and increases, at a glance.`,
        `They do not depend on language, so you can follow a chart in a pattern written in a language you do not read.`,
        `They show where each stitch goes, which is helpful for circles, flowers and granny squares.`,
        `They are shorter than writing out every stitch.`,
      ],
    },
    { type: 'h2', text: `Common crochet symbols` },
    {
      type: 'p',
      text: `Symbols are drawn in a similar way in most charts, but every chart should have its own key, usually next to the diagram. Always check the key first. These are the symbols most patterns use for the basic stitches.`,
    },
    {
      type: 'table',
      caption: `Common stitch symbols (US terms)`,
      head: [`Stitch`, `Abbreviation`, `Usual symbol`],
      rows: [
        [`Chain`, `ch`, `A small oval`],
        [`Slip stitch`, `sl st`, `A small filled dot`],
        [`Single crochet`, `sc`, `A plus sign (+) or an X`],
        [`Half double crochet`, `hdc`, `A letter T`],
        [`Double crochet`, `dc`, `A letter T with one slash across the stem`],
        [`Treble crochet`, `tr`, `A letter T with two slashes across the stem`],
      ],
    },
    {
      type: 'p',
      text: `The more slashes on the stem, the taller the stitch. Groups of stitches that start from the same point are drawn as symbols fanning out from one spot. A line with a tiny curve at the top or the bottom often marks a stitch that is worked in the front loop only or in the back loop only, and the chart's key will say so. If you are not sure what a stitch is, our page on [basic crochet stitches for beginners](/guides/basic-crochet-stitches-for-beginners) lists them all.`,
    },
    { type: 'h2', text: `How to read a chart of rows` },
    {
      type: 'ol',
      items: [
        `Find the foundation chain at the bottom of the chart. It is usually drawn as a row of ovals.`,
        `Start at the bottom right (if you crochet right-handed) and read the first row from right to left.`,
        `Turn at the end of the row. The next row is read in the opposite direction, from left to right, because your work is turned.`,
        `Keep alternating: odd rows right to left, even rows left to right, unless the chart says otherwise. Row numbers are often printed at the side to show the direction.`,
        `If you crochet left-handed, the directions are mirrored.`,
      ],
    },
    { type: 'h2', text: `How to read a chart of rounds` },
    {
      type: 'p',
      text: `Charts for circles, such as flowers, coasters and the tops of toys, are drawn as rings that grow outward from the center. The center is the magic ring or the first chain ring. Each ring of symbols is one round. Most charts for right-handed crocheters are worked counterclockwise, from the center outward, and the round number is printed at the start of each ring. Read the first symbol of the round, then continue around until you reach the start again. A [magic ring](/guides/how-to-make-a-magic-ring-crochet) is usually drawn as a small circle in the middle.`,
    },
    { type: 'h2', text: `Charts and written patterns together` },
    {
      type: 'p',
      text: `Many patterns give both a chart and written instructions. They should match. If you are not sure about a symbol, compare the chart with the written line, which uses the abbreviations explained in our guide on [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern). Written patterns that use UK terms and charts that use US terms (or the other way around) can look different, so check the system the pattern uses. Our [US and UK crochet terms chart](/guides/crochet-abbreviations-us-vs-uk) shows both.`,
    },
    { type: 'h2', text: `Tips for following a chart` },
    {
      type: 'ul',
      items: [
        `Print the chart and the key together, or keep both open on a tablet.`,
        `Cover the rows you have finished with a ruler or a sheet of paper, so you can see only the row you are working on.`,
        `Mark the repeat with a pencil or a highlighter if the pattern repeats across the row.`,
        `Count the stitches at the end of each row and compare with the chart.`,
        `Work a small test piece first, if the chart is new to you.`,
      ],
    },
    {
      type: 'p',
      text: `Written patterns are still the most common way to share toy patterns, and our patterns list the materials, the abbreviations and the stitch counts for each round. If you want to practice, try one of the [crochet patterns for beginners](/crochet-patterns-for-beginners), or download a [free crochet pattern](/free-crochet-patterns).`,
    },
  ],
  faq: [
    {
      q: `What do the symbols in a crochet chart mean?`,
      a: `Each symbol stands for a stitch. For example, an oval is a chain, a filled dot is a slip stitch, a plus sign or an X is a single crochet, and a T with slashes on the stem is a half double or a double crochet. Every chart should have a key.`,
    },
    {
      q: `Which way do I read a crochet chart?`,
      a: `For rows, read the first row from right to left and the next row from left to right, if you crochet right-handed. For rounds, read from the center outward, counterclockwise. The chart or its key usually says so.`,
    },
    {
      q: `Are crochet symbols the same in every country?`,
      a: `Mostly, yes. The symbols are widely shared, but the names of the stitches differ between US and UK terms. Always check the key of the chart in front of you.`,
    },
    {
      q: `Do I need a chart to crochet a toy?`,
      a: `No. Most toy patterns are written in rounds with stitch counts. Charts are more common in lace, motifs, flowers and granny squares.`,
    },
    {
      q: `What if a symbol is not in the key?`,
      a: `Compare it with the written instructions, if there are any, or contact the designer. Charts should always come with a key that explains every symbol.`,
    },
  ],
}
