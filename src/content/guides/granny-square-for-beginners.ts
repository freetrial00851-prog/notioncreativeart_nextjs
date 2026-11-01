import type { Guide } from '@/lib/guides'

export const grannySquareGuide: Guide = {
  slug: 'granny-square-for-beginners',
  title: 'Granny Square Crochet: Classic Pattern for Beginners',
  description:
    'Learn how to crochet a classic granny square in US terms, with exact stitch counts for rounds 1 to 4, fixes for wavy edges, and two ways to join squares.',
  datePublished: '2026-11-02',
  dateModified: '2026-11-02',
  author: 'Notion Creative Art',
  related: ['how-to-double-crochet', 'how-to-change-colors-in-crochet', 'simple-crochet-blanket-for-beginners'],
  body: [
    {
      type: 'p',
      text: `A granny square is a small square of crochet worked in rounds from the center out, and a friendly way to practice the double crochet stitch. Once you know how to crochet a granny square, you can join several into coasters, bags and blankets. This guide gives the classic granny square pattern in US terms, with a stitch count for every round.`,
    },
    { type: 'h2', text: `What you need` },
    {
      type: 'ul',
      items: [
        `Smooth medium (worsted) weight yarn in a light color.`,
        `A 5 mm hook is a comfortable size for practice. See our [hook sizes chart](/guides/crochet-hook-sizes-chart) if you are unsure.`,
        `Scissors and a yarn needle.`,
      ],
    },
    {
      type: 'p',
      text: `The main stitch is the double crochet, abbreviated dc, which is explained in our [double crochet guide](/guides/how-to-double-crochet). All terms below are US terms. If a pattern uses UK terms, check the [US and UK chart](/guides/crochet-abbreviations-us-vs-uk) first.`,
    },
    { type: 'h2', text: `Corners and sides` },
    {
      type: 'p',
      text: `Every granny square has two kinds of places. A corner is a space where you work 3 dc, chain 2, then 3 dc, and it is what turns the work into a square. A side is the stretch between two corners, where you work a plain group of 3 dc. Groups are separated by a chain 1, which gives the square its small gaps. Round 2 has no side groups, and each new round adds one side group to every side.`,
    },
    { type: 'h2', text: `Round 1: the center` },
    {
      type: 'ol',
      items: [
        `Chain 4 and join with a slip stitch to the first chain to make a ring.`,
        `Chain 3. This counts as your first double crochet.`,
        `Work 2 dc into the ring. You now have 3 dc, counting the chain 3.`,
        `Chain 2. This is the first corner space.`,
        `Work 3 dc into the ring, then chain 2. Repeat this 3 more times, so there are 4 groups of 3 dc and 4 corner spaces. The last chain 2 is the fourth corner.`,
        `Join with a slip stitch to the top of the starting chain 3.`,
      ],
    },
    {
      type: 'note',
      text: `Count check: 4 groups of 3 dc is 12 dc, with 4 chain-2 corner spaces. The starting chain 3 is one of the 12.`,
    },
    { type: 'h2', text: `Round 2: your first real corners` },
    {
      type: 'ol',
      items: [
        `Slip stitch across the next 2 dc and into the first corner space, so the hook sits in the gap.`,
        `Chain 3 (counts as the first dc), work 2 dc in the same corner space, chain 2, then 3 dc in the same corner space. This is your first corner.`,
        `Chain 1. This is the space between corners.`,
        `In the next corner space work 3 dc, chain 2, 3 dc. Chain 1.`,
        `Repeat for the next two corners, working 3 dc, chain 2, 3 dc in each, with a chain 1 after each.`,
        `Join with a slip stitch to the top of the starting chain 3.`,
      ],
    },
    {
      type: 'note',
      text: `Count check: each corner holds 6 dc, so 4 x 6 = 24 dc, with 4 chain-1 spaces.`,
    },
    { type: 'h2', text: `Round 3: adding a side group` },
    {
      type: 'p',
      text: `Slip stitch across the next 2 dc and into the first corner space. Chain 3, work 2 dc, chain 2, 3 dc in the same corner. Chain 1, then work 3 dc into the chain-1 space on the side and chain 1. Work the next corner as 3 dc, chain 2, 3 dc, chain 1. Repeat around, working 3 dc in each side space, and join to the top of the starting chain 3.`,
    },
    {
      type: 'note',
      text: `Count check: 4 corners x 6 dc = 24, plus 4 side groups x 3 dc = 12, so 24 + 12 = 36 dc.`,
    },
    { type: 'h2', text: `Round 4 and beyond` },
    {
      type: 'p',
      text: `Work round 4 the same way, but each side now has two chain-1 spaces, so work 3 dc in each, with a chain 1 after every group.`,
    },
    {
      type: 'table',
      caption: `Stitch counts by round`,
      head: [`Round`, `Corners (6 dc each)`, `Side groups (3 dc each)`, `Total dc`],
      rows: [
        [`1`, `4 groups of 3 dc`, `0`, `12`],
        [`2`, `4 x 6 = 24`, `0`, `24`],
        [`3`, `4 x 6 = 24`, `4 x 3 = 12`, `36`],
        [`4`, `4 x 6 = 24`, `8 x 3 = 24`, `48`],
      ],
    },
    {
      type: 'p',
      text: `Each round adds 12 dc, which is 4 more groups of 3. A finished 4-round square has 12 dc along each edge, counting half of each corner, which helps when you join squares. `,
    },
    { type: 'h2', text: `Changing colors between rounds` },
    {
      type: 'p',
      text: `Change color at the end of a round. After the final slip stitch, fasten off, join the new yarn in a corner space and chain 3. Our guide to [changing colors in crochet](/guides/how-to-change-colors-in-crochet) shows the neat way to do this. Leave tails of about 6 inches to weave in later.`,
    },
    { type: 'h2', text: `To turn or not to turn` },
    {
      type: 'p',
      text: `Most classic patterns work every round on the same side and do not turn, so the right side always faces you. Some patterns turn the work at the end of each round and work back the other way, which gives a slightly flatter, more even fabric but changes where you start. Follow your pattern, and if it does not say, do not turn.`,
    },
    { type: 'h2', text: `Common problems and fixes` },
    {
      type: 'table',
      caption: `Granny square troubleshooting`,
      head: [`What you see`, `Why it happens`, `What to do`],
      rows: [
        [`Wavy or bowed edges`, `Too many stitches on the side, or tension that is too loose`, `Count each group. Make sure each side group goes into the chain-1 space, not between stitches. Try a smaller hook.`],
        [`The square looks like a circle or a hexagon`, `Corners have fewer than 3 dc or the chain 2 was skipped`, `Each corner needs 3 dc, chain 2, 3 dc. Check the chain 2 in every corner.`],
        [`Losing the chain-3 count`, `The starting chain 3 looks like a stitch but is easy to miss at the end of a round`, `Remember that it is the first dc of the round. Join to its top, and count it in the total.`],
        [`One corner is bigger than the others`, `Uneven tension, or an extra stitch crept in`, `Count 3 dc on each side of the corner. Unpick back to the last correct corner and redo it.`],
        [`The edges pull in`, `Tension is too tight, especially on the chains`, `Relax your grip, and keep the chain 1 and chain 2 loose.`],
      ],
    },
    { type: 'h2', text: `Two ways to join granny squares` },
    {
      type: 'p',
      text: `Lay your squares out first so the sides line up.`,
    },
    {
      type: 'ul',
      items: [
        `Slip stitch seam: place two squares together, either wrong sides together for a raised ridge on the front, or right sides together for a ridge on the back. Put the hook through both layers at the corner, then slip stitch along the edge, working into the matching stitches or spaces of both squares.`,
        `Whip stitch: with a yarn needle and matching yarn, lay two squares side by side, right sides up, edges touching. Pass the needle through the outer loop of a stitch on one square and the matching stitch on the other, and repeat along the edge. This gives a flat, almost invisible seam.`,
      ],
    },
    {
      type: 'p',
      text: `For a larger project, our [simple crochet blanket guide](/guides/simple-crochet-blanket-for-beginners) is a good next step.`,
    },
    { type: 'h2', text: `Practice and next steps` },
    {
      type: 'p',
      text: `Make three squares of four rounds each, counting 12, 24, 36 and 48 stitches as you go. Then try a new color on each round. For more beginner projects, browse our [crochet patterns for beginners](/crochet-patterns-for-beginners) or pick up a [free crochet pattern](/free-crochet-patterns).`,
    },
  ],
  faq: [
    {
      q: `How many stitches are in each round of a granny square?`,
      a: `In the classic version the totals are 12 dc in round 1, 24 in round 2, 36 in round 3 and 48 in round 4. The starting chain 3 counts as the first dc.`,
    },
    {
      q: `Does the chain 3 count as a stitch?`,
      a: `Yes. At the start of each round, the chain 3 counts as the first double crochet, so you join with a slip stitch to the top of that chain at the end of the round.`,
    },
    {
      q: `Why are my granny square corners not sharp?`,
      a: `Usually a corner is missing a stitch, or the chain 2 is too tight. Work 3 dc, chain 2, 3 dc all in the same space, and keep the chain 2 loose.`,
    },
    {
      q: `How big is a granny square?`,
      a: `It depends on the yarn, hook, tension and number of rounds, so measure your own. A 4-round square in medium weight yarn is usually small enough to sit in your palm.`,
    },
    {
      q: `Can I make a granny square with any yarn?`,
      a: `Yes, but smooth medium weight yarn in a light color is easiest to see while you learn. Fuzzy or dark yarn hides the chain spaces.`,
    },
  ],
}
