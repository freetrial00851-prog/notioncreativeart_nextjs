import type { CategoryContent } from '@/lib/categoryContent'

export const wearablesContent: CategoryContent = {
  slug: 'wearables',
  body: [
    { type: 'h2', text: `Crochet wearable patterns: how to make clothes you will actually wear` },
    {
      type: 'p',
      text: `Crochet wearable patterns turn yarn into things you put on, from a first headband to a shawl or a simple top. The gap between a garment you love and one that ends up in a drawer usually comes down to three choices: the yarn, a gauge swatch, and the size you pick. This page walks through each one with real numbers, so your next crochet clothing pattern fits the way you imagined.`,
    },
    { type: 'h2', text: `What should you crochet first? Five wearables in order` },
    {
      type: 'p',
      text: `A garment has to fit, hang well and feel good against skin. These five projects build those skills one at a time, a sensible order for crochet patterns for beginners.`,
    },
    {
      type: 'ol',
      items: [
        `Headband or ear warmer. A strip about 4 inches wide and 18 to 20 inches long. It teaches you to keep a straight edge and to measure a real body part. Mistakes cost an evening, not a month.`,
        `Cowl. A tube worked in the round or a strip joined into a loop. You learn to join without a twist and to keep tension even over long rows or rounds.`,
        `Hat. Your first shaped piece: a flat circle that grows into a cup. This is where gauge starts to matter, because a hat that is 1 inch too small simply does not go on.`,
        `Shawl. A triangle or half circle with increases at set points. It forgives size errors, so you can practice shaping and blocking without a fitting problem.`,
        `Simple top. Two rectangles, or one top-down piece, with a neckline. Now gauge, ease and length all matter at once, and you will be ready for them.`,
      ],
    },
    { type: 'h2', text: `What is gauge in crochet, and why does it change the fit?` },
    {
      type: 'p',
      text: `Gauge is how many stitches and rows fit into 4 inches (10 cm) of finished fabric. Two people can use the same hook and the same yarn and get different sizes, because everyone holds the yarn with a different tightness. On a toy, nobody notices. On a garment, a small difference multiplies across every stitch.`,
    },
    {
      type: 'p',
      text: `Here is the arithmetic. A pattern calls for 4 stitches per inch, and the front of a top is 80 stitches wide, which should measure 20 inches.`,
    },
    {
      type: 'ul',
      items: [
        `You get 5 stitches per inch (tighter, one stitch more): 80 ÷ 5 = 16 inches. Your top is 4 inches too narrow, a full size or more smaller.`,
        `You get 3 stitches per inch (looser, one stitch less): 80 ÷ 3 = 26.7 inches. Your top is almost 7 inches too wide.`,
      ],
    },
    {
      type: 'p',
      text: `One stitch per inch sounds tiny, and it changes the garment by two sizes or more.`,
    },
    { type: 'h2', text: `How to make a gauge swatch (crochet) that tells the truth` },
    {
      type: 'ol',
      items: [
        `Use the yarn, the hook and the stitch pattern the pattern names. Start with the hook it suggests. For worsted weight that is often 5.0 mm (H-8), for DK about 4.0 mm, for fingering about 3.0 mm.`,
        `Make the swatch at least 6 inches square. The edges are always distorted, so you measure from the middle.`,
        `Wash and dry it the way you will treat the finished garment. Cotton often grows, some wool shrinks, and you want to find out now.`,
        `Lay it flat without pulling and count stitches and rows across 4 inches in the center. Use a ruler, not a guess.`,
        `Too many stitches means your fabric is tight: go up a hook size, such as 5.0 mm to 5.5 mm. Too few means it is loose: go down. Swatch again.`,
      ],
    },
    { type: 'h2', text: `What is the best yarn for crochet clothes?` },
    {
      type: 'p',
      text: `Fiber decides how a garment hangs, how warm it is and how it ages. Always read the ball band for the weight, fiber content and care symbols. Here is how the common choices behave.`,
    },
    {
      type: 'table',
      caption: `Common yarn fibers for wearables`,
      head: [`Fiber`, `Drape`, `Warmth`, `Care`, `Best for`],
      rows: [
        [`Cotton`, `Crisp, little stretch, heavy when wet`, `Cool`, `Machine washable on most labels; may grow or shrink`, `Summer tops, bags, headbands`],
        [`Wool`, `Springy, elastic`, `High`, `Hand wash cool, dry flat; may felt with heat and friction`, `Hats, cowls, mittens, sweaters`],
        [`Superwash wool`, `Soft, a little stretchy`, `High`, `Usually machine washable on gentle`, `Hats and cowls for people who dislike hand washing`],
        [`Acrylic`, `Light, can be springy or limp`, `Medium, less breathable`, `Easy wash; heat can damage it`, `Everyday accessories, bright colors, budget projects`],
        [`Bamboo or viscose`, `Fluid, silky, can stretch`, `Cool`, `Gentle wash; weight grows when wet`, `Shawls, light tops, summer wraps`],
        [`Blends (cotton/acrylic, wool/nylon)`, `Depends on the mix`, `Depends on the mix`, `Follow the label`, `A balance of structure, softness and easy care`],
      ],
    },
    {
      type: 'p',
      text: `For a first top, choose a smooth, plied cotton or cotton blend: stitches show clearly and the fabric holds its shape. Viscose or bamboo flows better for a summer layer, but heavy fibers stretch downward with wear, so swatch and wash them first.`,
    },
    { type: 'h2', text: `How to size a crochet garment: ease and measurements` },
    {
      type: 'p',
      text: `Ease is the difference between your body measurement and the finished garment measurement. Positive ease means the piece is looser than you. Negative ease means it is smaller and stretches to fit. As a rough guide for a top, using a 36-inch chest:`,
    },
    {
      type: 'table',
      caption: `Typical ease for a top (36-inch chest)`,
      head: [`Fit`, `Ease`, `Finished chest`],
      rows: [
        [`Close fitting`, `0 to 2 inches`, `36 to 38 inches`],
        [`Standard fit`, `2 to 4 inches`, `38 to 40 inches`],
        [`Relaxed`, `4 to 8 inches`, `40 to 44 inches`],
        [`Oversized`, `8 inches or more`, `44 inches or more`],
      ],
    },
    {
      type: 'p',
      text: `Hats work the other way. A hat is usually made 1 to 2 inches smaller than the head, so a 22-inch head wears a 20- to 21-inch hat. Crochet stretches, and the snugness keeps the hat in place.`,
    },
    {
      type: 'p',
      text: `When you read a size table, look for finished measurements, not only size names, because a medium in one pattern is not a medium in another. Compare the finished chest, length and sleeve numbers with a top you already own and like. If you land between two sizes, choose the one that fits the measurement that is hardest to change, such as chest or head circumference, and adjust length with rows. The [guide to reading a crochet pattern](/guides/how-to-read-a-crochet-pattern) explains how multiple sizes are written, and why you should circle your own numbers before you start.`,
    },
    { type: 'h2', text: `Crochet hat pattern basics` },
    {
      type: 'p',
      text: `A hat starts like an amigurumi circle and ends like a tube. The crown is a flat disc worked with increases, usually 6 or 8 per round. The disc grows until its diameter reaches about the head circumference divided by 3.14, minus a little for negative ease. For a 20-inch hat, that means a crown disc of roughly 6.3 inches across.`,
    },
    {
      type: 'ul',
      items: [
        `Crown: increase evenly each round until the disc is the right diameter. In worsted weight and single crochet, that is often 10 to 12 rounds.`,
        `Body: stop increasing and work straight until the hat measures about 7 to 8 inches from the center of the crown for an adult, or 6 to 7 inches for a child.`,
        `Brim: switch to a stretchier stitch, or go down one hook size, so the hat grips.`,
        `Mistake to avoid: if the crown starts to ruffle, you increased too much. If it cups into a bowl too early, you increased too little. Count the stitches at the end of every round against the pattern.`,
      ],
    },
    { type: 'h2', text: `How to fix common fit problems in crochet clothes` },
    {
      type: 'table',
      caption: `Fit problem and fix`,
      head: [`Problem`, `Likely cause`, `Fix`],
      rows: [
        [`Top is too narrow after washing`, `Tight gauge, or fiber that shrank`, `Swatch and wash first; go up a hook size next time`],
        [`Body grows longer as you wear it`, `Heavy fiber like cotton or viscose pulling down`, `Use a smaller hook, add a ribbed edge, store folded`],
        [`Neckline gapes`, `Too many stitches around the neck`, `Decrease a few stitches in the last rounds or add a rounded edging`],
        [`Hat slides off`, `Brim too loose`, `Redo the brim with a smaller hook or a ribbing stitch`],
      ],
    },
    { type: 'h2', text: `Blocking crochet and seaming for a professional finish` },
    {
      type: 'p',
      text: `Blocking sets the shape and evens out stitches. The right method depends on the fiber.`,
    },
    {
      type: 'ul',
      items: [
        `Wet blocking: soak in cool water, press out the water in a towel without wringing, pin to measurements and let it dry. Good for cotton and wool.`,
        `Steam blocking: hold a steamer just above the fabric without touching it. Test on your swatch first, because steam can flatten or ruin some acrylics for good.`,
      ],
    },
    {
      type: 'p',
      text: `Seam after blocking, since flat pieces are easier to match. Mattress stitch gives an almost invisible join on side seams. A slip stitch seam worked from the right side makes a firm, decorative ridge. Use matching yarn, thinner if yours is thick or fuzzy, and weave the ends in three directions so they stay put in the wash.`,
    },
    { type: 'h2', text: `How to care for crochet clothes` },
    {
      type: 'ul',
      items: [
        `Follow the ball band, and if you have lost it, hand wash in cool water with a mild detergent.`,
        `Press water out with a towel. Wringing and twisting stretch the stitches.`,
        `Dry flat and reshape while damp. Never hang a wet crochet top, because it will grow.`,
      ],
    },
    { type: 'h2', text: `Our wearables range, free patterns and how buying works` },
    {
      type: 'p',
      text: `The range here is small and growing. While it fills in, the [free crochet patterns](/free-crochet-patterns) page is a good place to try a project before you buy, and our [amigurumi patterns](/shop/amigurumi) are a good way to practice stitches and joining that you will use again in hats. Everything currently available is in the [shop](/shop), and the [guides](/guides) cover the basics. If you crochet from UK patterns, check the [US vs UK terms chart](/guides/crochet-abbreviations-us-vs-uk) before you pick up your hook.`,
    },
    {
      type: 'p',
      text: `Every pattern is a PDF. The download is available right after payment, and a link is also emailed to you. You do not need an account to buy, and payment is handled by Paddle. If something is not right, the [refund policy](/refund-policy) explains what to do, and you can [contact us](/contact) with questions.`,
    },
  ],
  faq: [
    {
      q: `Do I really need to make a gauge swatch for crochet clothing?`,
      a: `For anything that has to fit, yes. A 6-inch swatch takes under an hour and can save you from a top that is two sizes off. For a scarf, a shawl or a blanket, being a little off rarely matters, so you can skip it. Wash the swatch before you measure, since many yarns change size after the first wash.`,
    },
    {
      q: `What is the best yarn for a beginner's first crochet clothes?`,
      a: `Choose a smooth, light-colored yarn in the weight the pattern names, such as a cotton blend or a soft acrylic. Light colors make stitches easy to see, and smooth plied yarn splits less under the hook.`,
    },
    {
      q: `How do I choose my size in a crochet clothing pattern?`,
      a: `Measure your chest, waist or head, then compare them with the finished measurements in the pattern, not with the size name. Decide how much ease you want: about 2 to 4 inches for a standard-fit top, more for a relaxed one. If you are between sizes, choose by the measurement that is hardest to change and adjust the length with rows.`,
    },
    {
      q: `Why does my crochet top get longer every time I wear it?`,
      a: `Heavy fibers such as cotton, bamboo and viscose stretch under their own weight, especially in open stitches. Work a smaller hook or a denser stitch, dry flat, and fold the garment rather than hanging it.`,
    },
    {
      q: `Can I make a crochet pattern longer, shorter or wider?`,
      a: `Often, yes. Length is the easiest: add or remove rows in the straight part of the body or sleeve, before any shaping begins. To change width, add stitches in multiples of the stitch repeat so the pattern still lines up, and recalculate any shaping that follows.`,
    },
  ],
}
