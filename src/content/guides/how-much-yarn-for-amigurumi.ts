import type { Guide } from '@/lib/guides'

export const yarnAmountGuide: Guide = {
  slug: 'how-much-yarn-for-amigurumi',
  title: 'How Much Yarn for Amigurumi? Estimating Yardage by Size',
  description:
    'Wondering how much yarn for amigurumi you need? Learn to read yardage and grams, see rough ranges by toy size, and estimate from a swatch or first piece.',
  datePublished: '2026-11-05',
  dateModified: '2026-11-05',
  author: 'Notion Creative Art',
  related: ['how-to-read-yarn-labels', 'amigurumi-sizes-mini-small-plush', 'best-yarn-for-amigurumi'],
  body: [
    {
      type: 'p',
      text: `Running out of yarn halfway through the second ear is a very common beginner surprise, and so is buying five skeins for a toy that needed one. Knowing how much yarn for amigurumi a project needs saves money and frustration. There is no single answer, but you can learn to make a sensible estimate. This guide explains what changes the amount, how to read a label, and how to plan for color changes.`,
    },
    { type: 'h2', text: `Why the amount changes from toy to toy` },
    {
      type: 'p',
      text: `Two toys of the same height can use quite different amounts of yarn. The main reasons are listed below.`,
    },
    {
      type: 'ul',
      items: [
        `Size: a toy twice as tall is much more than twice the yarn, because the surface area grows faster than the height.`,
        `Yarn weight: thicker yarn covers more area per yard, so a chunky toy needs fewer yards than a fingering-weight toy of the same size.`,
        `Hook size and tension: a small hook with tight stitches packs more yarn into each round, which is what you want for toys. Looser stitches use less yarn but let the stuffing show.`,
        `Shape: long limbs, a tail, ears and clothing all add rounds.`,
      ],
    },
    { type: 'h2', text: `Yardage, meters and grams on a yarn label` },
    {
      type: 'p',
      text: `A label lists two numbers that matter: the weight of the ball in grams (or ounces) and the length in yards or meters. Patterns often give the amount you need as yardage, so match that against the length on the label, not the weight. Yarns of different fibers and weights have different lengths per gram, so grams alone can mislead you. Our guide to [reading yarn labels](/guides/how-to-read-yarn-labels) covers the rest of the symbols.`,
    },
    {
      type: 'p',
      text: `To convert, remember that one yard is a little under one meter (about 0.91 m). A ball marked 100 g and 200 yards holds roughly 183 meters, which is about 2 yards, or 1.8 meters, for every gram.`,
    },
    { type: 'h2', text: `Rough yarn amounts by toy size` },
    {
      type: 'p',
      text: `The table gives very loose ranges for toys made in a medium (worsted) weight yarn with a small hook, in one main color. They are estimates only. A different yarn weight or stitch tension can land well outside them.`,
    },
    {
      type: 'table',
      caption: `Approximate yarn for a medium weight toy (estimates only)`,
      head: [`Toy size`, `Typical height`, `Rough amount`],
      rows: [
        [`Keychain or mini`, `About 2 to 4 inches (5 to 10 cm)`, `Often under 50 yards (about 45 m)`],
        [`Small`, `About 5 to 7 inches (13 to 18 cm)`, `Roughly 80 to 150 yards (about 75 to 140 m)`],
        [`Medium`, `About 8 to 10 inches (20 to 25 cm)`, `Roughly 150 to 300 yards (about 140 to 275 m)`],
        [`Large plush`, `About 12 inches (30 cm) or more`, `Often 300 yards (275 m) or more, sometimes several times that`],
      ],
    },
    {
      type: 'note',
      text: `These numbers are guesses to help you plan a shopping trip. The materials list in your pattern always wins. If it names an amount, use that, and ignore this table.`,
    },
    {
      type: 'p',
      text: `If you are unsure how toy sizes compare, see our guide to [amigurumi sizes from mini to plush](/guides/amigurumi-sizes-mini-small-plush).`,
    },
    { type: 'h2', text: `How to estimate from a swatch or a first piece` },
    {
      type: 'p',
      text: `When a pattern gives no yardage, you can measure it yourself with a small kitchen scale. This works best on the first part you make, such as the head.`,
    },
    {
      type: 'ol',
      items: [
        `Weigh the full ball before you start, and write the number down.`,
        `Crochet one finished part, for example the head, and weigh the ball again. The difference is the weight that part used.`,
        `Estimate how many parts of similar size the toy has. A body is often similar to or a little smaller than a head, and limbs are much smaller.`,
        `Add up the parts, then turn grams into yardage using the label. With the 100 g and 200 yard ball above, 15 g of yarn is about 30 yards.`,
        `Add a margin of at least 10 to 20 percent, as the next section explains.`,
      ],
    },
    {
      type: 'p',
      text: `A [gauge swatch](/guides/crochet-gauge-swatch) in the same yarn and hook is also useful. Weigh it and count its stitches to see how much yarn a given number of stitches takes.`,
    },
    { type: 'h2', text: `Buying extra for color changes and small parts` },
    {
      type: 'p',
      text: `Color changes waste a little yarn: you leave tails, you cut and rejoin, and you often end up with a leftover bit that is too short to use. A toy with five or six colors can easily need more total yarn than a one-color toy of the same size. Our guide to [changing colors in crochet](/guides/how-to-change-colors-in-crochet) helps keep tails short.`,
    },
    {
      type: 'p',
      text: `Limbs, ears, tails and finishing details also ask for extra. A margin of 10 to 20 percent over your estimate is a comfortable starting point, and more if you plan to embroider a face, because [embroidered features](/guides/how-to-embroider-faces-on-amigurumi) and sewing up take their own length of yarn.`,
    },
    { type: 'h2', text: `Dye lots and matching colors` },
    {
      type: 'p',
      text: `Yarn is dyed in batches, and the label usually shows a dye lot number. Two balls of the same color name from different lots can look slightly different, and on a plain toy body that difference shows. Buy all the yarn for one main color together and check that the lot numbers match. If you are unsure you have enough, buy one extra ball now rather than hunting for a match later.`,
    },
    { type: 'h2', text: `Using up scraps` },
    {
      type: 'p',
      text: `Small toys, noses, ears and clothes are good ways to use leftover yarn. Choose scraps of the same weight and fiber as the rest of the toy, so the stitches look even and the toy washes the same way.`,
    },
    { type: 'h2', text: `Common problems and fixes` },
    {
      type: 'table',
      caption: `Running short or having too much`,
      head: [`What you see`, `Why it happens`, `What to do`],
      rows: [
        [`The ball ends before the toy does`, `The estimate had no margin, or your stitches were tighter than the pattern`, `Check the pattern for the amount, and buy extra of the main color before you start the next toy.`],
        [`The new ball looks a different shade`, `It came from another dye lot`, `Switch balls at a natural break, such as a seam, or use the second ball for small parts.`],
        [`The stuffing shows through the stitches`, `The hook is too large for the yarn`, `Try a smaller hook. It uses a little more yarn, so allow for that.`],
        [`Your toy uses far more than the pattern says`, `A heavier yarn or a bigger hook makes a bigger toy`, `Compare your yarn with the one the pattern names, and see [how to make amigurumi bigger or smaller](/guides/how-to-make-amigurumi-bigger-or-smaller).`],
      ],
    },
    { type: 'h2', text: `Next steps` },
    {
      type: 'p',
      text: `Each of our [amigurumi patterns](/shop/amigurumi) lists the materials and the skill level on the page before you buy, so you can plan the yarn before you start. For a first try, choose a small toy from our [beginner crochet patterns](/crochet-patterns-for-beginners), weigh your ball before and after, and write down what you used. After two or three toys you will estimate much more accurately by eye.`,
    },
  ],
  faq: [
    {
      q: `How many grams of yarn does a small amigurumi use?`,
      a: `A small toy often uses something like 20 to 50 grams of medium weight yarn, but this depends on the shape and your tension. Treat it as a rough guide and follow the materials list in the pattern.`,
    },
    {
      q: `Can I use less yarn by using a bigger hook?`,
      a: `You will use slightly less, but the stitches become loose and the stuffing starts to show. Most toy patterns work best with a hook smaller than the one on the yarn label, so the fabric stays dense.`,
    },
    {
      q: `Is yardage or weight more accurate when buying yarn?`,
      a: `Yardage or meters is the better number, because it tells you the actual length. Weight in grams is useful for comparing balls of the same yarn, but different yarns have different lengths per gram.`,
    },
    {
      q: `Should I buy extra yarn for a color-changing toy?`,
      a: `Yes, a little extra is wise, since each color change leaves tails and short leftovers. Patterns with many colors often need more total yarn than a one-color toy of the same size.`,
    },
    {
      q: `What if the pattern does not say how much yarn to buy?`,
      a: `Weigh the ball after making the first part, estimate the total, and add 10 to 20 percent. You can also ask the designer, or send us a note through the [contact page](/contact) if the question is about one of our patterns.`,
    },
  ],
}
