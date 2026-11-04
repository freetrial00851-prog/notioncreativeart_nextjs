import type { Guide } from '@/lib/guides'

export const crochetInTheRoundGuide: Guide = {
  slug: 'how-to-crochet-in-the-round',
  title: 'How to Crochet in the Round: Spiral Rounds, Joined Rounds and Flat Circles',
  description:
    'Learn how to crochet in the round: start a circle, how many stitches each round needs, spiral versus joined rounds, tubes, and how to fix cupping and ruffling.',
  datePublished: '2026-11-02',
  dateModified: '2026-11-05',
  author: 'Notion Creative Art',
  related: ['how-to-make-a-magic-ring-crochet', 'how-to-single-crochet', 'invisible-decrease-amigurumi', 'crochet-hook-sizes-chart', 'best-yarn-for-amigurumi'],
  body: [
    {
      type: 'p',
      text: `Working in the round means crocheting in a circle instead of back and forth in rows. It is how toys, hats, coasters, baskets and bags are made, and it is the base of nearly every amigurumi pattern. This guide explains how to start a circle, how many stitches you need in each round to keep it flat, the difference between spiral and joined rounds, and how to fix a circle that curls or ruffles.`,
    },
    { type: 'h2', text: `How a circle begins` },
    {
      type: 'p',
      text: `A round starts with a small ring that all the first stitches are worked into. There are two common ways to make it.`,
    },
    {
      type: 'ul',
      items: [
        `Magic ring: a loop of yarn that you tighten after the first round, so there is no hole. See our guide on [how to make a magic ring](/guides/how-to-make-a-magic-ring-crochet).`,
        `Chain ring: chain 2 and work the first stitches into the first chain, or chain 4 or 5 and close it into a ring with a slip stitch. It is simpler, but a small hole may remain in the middle.`,
      ],
    },
    { type: 'h2', text: `How many stitches does each round need?` },
    {
      type: 'p',
      text: `A flat circle grows by the same number of stitches in every round. The number depends on the height of the stitch. If you add too few stitches, the circle curls up into a cup. If you add too many, the edge ruffles.`,
    },
    {
      type: 'table',
      caption: `Stitches added per round to keep a circle flat`,
      head: [`Stitch`, `Round 1`, `Then add`, `Counts`],
      rows: [
        [`Single crochet (sc)`, `6`, `6 each round`, `6, 12, 18, 24, 30`],
        [`Half double crochet (hdc)`, `8`, `8 each round`, `8, 16, 24, 32, 40`],
        [`Double crochet (dc)`, `12`, `12 each round`, `12, 24, 36, 48, 60`],
      ],
    },
    {
      type: 'p',
      text: `For a single crochet circle, round 2 is "2 sc in each stitch" (12). Round 3 is "sc 1, then 2 sc in the next stitch" repeated all round (18). Round 4 is "sc 2, then 2 sc in the next stitch" repeated (24). The increases move around the circle, so the pattern spreads the extra stitches evenly. Patterns write this as "(sc 2, inc) x 6 (24)".`,
    },
    { type: 'h2', text: `Spiral rounds and joined rounds` },
    {
      type: 'table',
      caption: `Two ways to work in the round`,
      head: [`Method`, `How it works`, `Used for`, `Notes`],
      rows: [
        [`Spiral (continuous)`, `You do not join. After the last stitch of a round, you simply start the next one in the next stitch.`, `Most amigurumi`, `Mark the first stitch of each round with a stitch marker, or you will lose your place.`],
        [`Joined rounds`, `You finish a round with a slip stitch into the first stitch, chain 1 (or as the pattern says), and begin the next round.`, `Hats, coasters, baskets, flat circles`, `You get a visible seam line, but it is easy to see where each round begins.`],
      ],
    },
    {
      type: 'p',
      text: `A spiral never closes, so it leaves a small step, or jog, where one round meets the next. It is normal and easy to hide at the back of a toy. In a joined round, the seam gives a clear line instead. Your pattern says which one to use. If it only says "Rnd 1, Rnd 2" with no mention of joining, it is usually a spiral. Our guide on [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern) explains how the lines are written.`,
    },
    { type: 'h2', text: `Using a stitch marker` },
    {
      type: 'p',
      text: `Place a marker in the first stitch of the round (or in the last, depending on the pattern) as soon as you have made it. When you reach the marker, you have finished a round. Move it up to the new first stitch before you carry on. A paper clip, a safety pin or a scrap of contrasting yarn works well. This small habit saves most beginners from losing count, which is the main reason a toy ends up lopsided.`,
    },
    { type: 'h2', text: `From a circle to a tube or a ball` },
    {
      type: 'ul',
      items: [
        `Flat circle: increase every round. This makes the base of a coaster, a basket or the top of a head.`,
        `Tube or cylinder: after the circle is as wide as you need, stop increasing and work the same number of stitches in each round. This makes the sides of a basket, an arm or a body.`,
        `Ball or sphere: increase for a few rounds, work several rounds with no increases, then decrease evenly. A [guide to the invisible decrease](/guides/invisible-decrease-amigurumi) shows how to close it neatly.`,
      ],
    },
    { type: 'h2', text: `Making rounds firm enough for toys` },
    {
      type: 'p',
      text: `A toy needs a dense fabric so the stuffing does not show. Most amigurumi uses single crochet worked with a hook one or two sizes smaller than the yarn label suggests, which pulls the stitches close together. Keep your tension even from the first round to the last, because rounds that are tight in one place and loose in another make a lumpy shape. Our [crochet hook sizes chart](/guides/crochet-hook-sizes-chart) lists common sizes in millimeters and US letters, and [best yarn for amigurumi](/guides/best-yarn-for-amigurumi) explains which yarns hold their shape.`,
    },
    { type: 'h2', text: `Turning, rows and rounds: the terms` },
    {
      type: 'p',
      text: `A row is worked back and forth, and you turn the work at the end. A round is worked in a circle, and you do not turn, so the right side always faces you. In a joined round you may turn at the end if the pattern says so, but spirals never do. If a pattern for a flat piece uses "Row 1, Row 2", it is not worked in the round, even if it later shapes into a tube.`,
    },
    { type: 'h2', text: `Common problems and how to fix them` },
    {
      type: 'table',
      caption: `Crocheting in the round troubleshooting`,
      head: [`What you see`, `Why`, `What to do`],
      rows: [
        [`The circle curls up like a bowl`, `Too few increases`, `Check the round counts against the table, and add the missing stitches.`],
        [`The edge ruffles`, `Too many increases`, `Count the stitches in each round and rip back to the last correct round.`],
        [`You lost the start of the round`, `No marker was used`, `Find the first stitch by the position of the tail, and put a marker in it.`],
        [`A visible step on the side`, `The jog of a spiral`, `Place it at the back of the toy, or use the joined method if the pattern allows.`],
        [`A hole in the middle`, `The ring was not closed`, `Tighten the magic ring, or make the chain ring smaller.`],
      ],
    },
    {
      type: 'p',
      text: `Practice with a small circle in single crochet first. See [how to single crochet](/guides/how-to-single-crochet) if you need to refresh the stitch. Then try a toy from our [crochet patterns for beginners](/crochet-patterns-for-beginners), or a [free crochet pattern](/free-crochet-patterns), and the finishing steps are in [how to stuff and assemble amigurumi](/guides/how-to-stuff-and-assemble-amigurumi).`,
    },
  ],
  faq: [
    {
      q: `What does it mean to crochet in the round?`,
      a: `You work in a circle, so the end of each round meets its beginning. You do not turn the work. It is used for toys, hats, coasters and baskets.`,
    },
    {
      q: `How many stitches should my circle have?`,
      a: `For single crochet, start with 6 and add 6 in each round: 6, 12, 18, 24. For half double crochet, start with 8 and add 8. For double crochet, start with 12 and add 12.`,
    },
    {
      q: `Do I need to join each round?`,
      a: `Not always. Amigurumi usually uses a continuous spiral with a stitch marker. Hats and flat circles often use joined rounds. The pattern tells you which one to use.`,
    },
    {
      q: `Why does my circle curl?`,
      a: `It probably has too few increases. Count the stitches in each round and compare with the numbers for the stitch you are using.`,
    },
    {
      q: `What is the difference between a round and a row in crochet?`,
      a: `A row goes back and forth and you turn the work. A round goes in a circle and you keep the same side facing you. Rounds make toys, hats and baskets.`,
    },
    {
      q: `Why do amigurumi patterns use a smaller hook?`,
      a: `A smaller hook makes tighter stitches, so the fabric is dense and the stuffing does not show through. The pattern lists the hook size to use.`,
    },
    {
      q: `How do I make the sides straight?`,
      a: `Stop increasing and work the same number of stitches in every round. The circle becomes a tube, which is how the sides of baskets and toy bodies are made.`,
    },
  ],
}
