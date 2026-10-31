import type { CategoryContent } from '@/lib/categoryContent'

export const homeDecorContent: CategoryContent = {
  slug: 'home-decor',
  body: [
    { type: 'h2', text: `Crochet home decor patterns: how to make pieces that look designed` },
    {
      type: 'p',
      text: `Crochet home decor patterns work best when you choose the yarn, stitch and color for the job, not just the project. A dense basket, a drapey throw and a textured cushion each need a different approach. This guide covers the choices that separate a styled room from a craft table: stitch by function, fibers that last, a room palette, sizing a cushion cover, blocking, and plant hanger safety.`,
    },
    { type: 'h2', text: `Which crochet home projects are worth making first?` },
    {
      type: 'p',
      text: `Pick by time and yarn, not just looks. These are rough planning ranges for evening crochet; your hook, tension and stitch will move them.`,
    },
    {
      type: 'table',
      caption: `Home decor projects compared (approximate)`,
      head: [`Project`, `Time`, `Yarn needed`, `Skill`, `Best yarn`],
      rows: [
        [`Coaster set of 4`, `2-3 hours`, `40-60 yd (35-55 m)`, `Beginner`, `Worsted cotton`],
        [`Plant hanger`, `3-5 hours`, `60-100 yd (55-90 m) of cord`, `Beginner`, `Cotton cord, 3-4 mm`],
        [`16-inch cushion cover`, `8-14 hours`, `300-450 yd (275-410 m)`, `Beginner to intermediate`, `Cotton blend or soft acrylic`],
        [`Basket, about 9 in wide`, `6-10 hours`, `150-250 yd (140-230 m)`, `Beginner`, `Cotton cord or T-shirt yarn`],
        [`Wall hanging`, `6-12 hours`, `100-250 yd (90-230 m)`, `Beginner to intermediate`, `Cotton, jute or wool blend`],
        [`Throw, about 40 x 50 in`, `3-6 weeks`, `1,000-1,500 yd (900-1,400 m)`, `Beginner and up`, `Worsted wool blend or acrylic`],
      ],
    },
    {
      type: 'p',
      text: `If you have never finished a large piece, the best crochet blanket for beginners is a plain double crochet throw in one solid color. A single color hides small tension changes. Try a coaster first to learn how your fiber behaves.`,
    },
    { type: 'h2', text: `How do I choose the right stitch for baskets, throws and cushions?` },
    {
      type: 'p',
      text: `Short stitches pack tightly and hold shape. Tall stitches leave gaps and drape. Match that to the job.`,
    },
    {
      type: 'ul',
      items: [
        `Baskets and bins: single crochet worked in the back loop only or in the round with a hook two sizes below the yarn label. The small hook makes a stiff fabric with no gaps, which is why a crochet basket stands up on its own instead of slumping.`,
        `Throws: double crochet, half double crochet, or a granny stripe. Taller stitches make a fabric that folds over a sofa arm and moves with you. A throw in single crochet is warm but stiff.`,
        `Cushion covers: textured stitches such as waffle, moss or bobbles. A cushion is viewed up close and sits against a flat insert, so surface texture does the decorating. Textures pull fabric narrower, so swatch first.`,
        `Wall hangings and runners: open stitches, mesh and shells. Light passing through the gaps is part of the look, and the lighter fabric hangs better.`,
      ],
    },
    { type: 'h2', text: `What is the best yarn for crochet home decor?` },
    {
      type: 'p',
      text: `The best yarn for crochet home decor is the one that survives how the piece will be used.`,
    },
    {
      type: 'table',
      caption: `Decor fibers at a glance`,
      head: [`Fiber`, `Good for`, `Washing`, `Watch out for`],
      rows: [
        [`Cotton`, `Coasters, pot covers, runners, cushions`, `Often machine-washable`, `Can shrink, no stretch`],
        [`Cotton cord`, `Baskets, plant hangers, rugs`, `Wash on gentle or by hand`, `Slow to dry`],
        [`T-shirt yarn`, `Baskets, floor mats`, `Often machine-washable, check the label`, `Curls if pulled tight`],
        [`Jute and twine`, `Wall hangings, planter wraps`, `Do not soak, spot clean only`, `Scratchy, fades in sun`],
        [`Acrylic`, `Throws, cushions`, `Machine-washable`, `Pills, and heat can flatten it`],
        [`Wool blends`, `Throws, winter cushions`, `Gentle or hand wash`, `Itchy for some, attracts moths`],
      ],
    },
    {
      type: 'p',
      text: `Sun is the quiet enemy of decor. A cushion on a window seat sees more light in a month than a scarf sees in a winter. Dark and bright dyes fade first. For strong light, choose a mid-tone and rotate the piece now and then.`,
    },
    { type: 'h2', text: `How do I plan crochet colors for a room?` },
    {
      type: 'p',
      text: `A room looks designed when its colors repeat. Use this simple rule: take the largest object in the room, such as the sofa or rug, and pick a main yarn within two shades of it, either a bit lighter or a bit darker. Add one accent color that already appears somewhere else, like a picture frame, a curtain or a plant pot.`,
    },
    {
      type: 'ul',
      items: [
        `Texture counts as a color. Three cushions in cream, oatmeal and ivory, each with a different stitch, look richer than three bright solids.`,
      ],
    },
    {
      type: 'p',
      text: `Always check a swatch in the room itself. Make a 4-inch square, place it where the finished piece will go, and look at it in daylight, then again in the evening with your lamps on. Warm bulbs turn grays beige and dull blues. It is cheaper to find that out with one skein than with ten.`,
    },
    { type: 'h2', text: `How big should a crochet cushion cover be?` },
    {
      type: 'p',
      text: `A cover should be smaller than its insert, so the insert fills it tightly and the corners look plump. This is called negative ease. Aim for about 1 to 2 inches (2.5 to 5 cm) narrower than the insert. A cover the same size as the insert looks baggy.`,
    },
    {
      type: 'p',
      text: `Here is a worked example for a 16-inch (40 cm) square insert.`,
    },
    {
      type: 'ol',
      items: [
        `Target size: 16 minus 2 inches of negative ease gives a 14-inch square panel.`,
        `Swatch: with a 6 mm hook and chunky yarn in single crochet, a 4-inch swatch measures 12 stitches and 13 rows. That is 3 stitches and 3.25 rows per inch.`,
        `Width: 14 inches x 3 stitches = 42 stitches. Chain 43 and work single crochet into the second chain from the hook.`,
        `Height: 14 inches x 3.25 rows = 45.5, so work 46 rows.`,
        `Make a second panel for the back, then join three sides with single crochet through both pieces. Insert the cushion before closing the fourth side, or add buttons for a removable cover.`,
      ],
    },
    {
      type: 'p',
      text: `If your swatch gave 14 stitches per 4 inches instead of 12, you would need 49 stitches. That is why you measure your own swatch. Our guide on [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern) explains how gauge is written. For UK terms, check the [US vs UK crochet abbreviations](/guides/crochet-abbreviations-us-vs-uk), because single crochet in one system is double in the other.`,
    },
    { type: 'h2', text: `How do I block a crochet blanket?` },
    {
      type: 'p',
      text: `Blocking sets the final size and evens out stitches. For acrylic, steam it without letting the iron touch the yarn, since heat can flatten it for good. For cotton and wool blends, wet blocking is more reliable.`,
    },
    {
      type: 'ol',
      items: [
        `Soak the piece in cool water with a drop of wool wash for 15 to 20 minutes.`,
        `Press out the water by rolling it in a clean towel. Do not wring.`,
        `Lay it flat on foam tiles or a bed covered with a towel. Pin the corners first, then the edges, checking the measurements.`,
        `Leave it to dry fully, which can take one to two days for a throw. Turn it over after the first day.`,
      ],
    },
    {
      type: 'p',
      text: `For a granny square blanket, block each square before joining. Matching squares join far more easily.`,
    },
    { type: 'h2', text: `How much yarn do I need for a crochet blanket?` },
    {
      type: 'p',
      text: `Start from the pattern's yardage and add about 10 percent for gauge differences, extra border rounds and mistakes. A tall stitch pattern with a lot of texture can use far more than a plain one, so never swap stitches without a swatch. Weigh your swatch to check: a 4-inch square at 10 grams, scaled to a 40 by 50 inch throw (125 such squares), is about 1,250 grams.`,
    },
    {
      type: 'p',
      text: `Buy all the yarn for one color at the same time and check that the dye lot number matches on every skein. The same color from a different lot can shift slightly, and on a large flat blanket that shows as a stripe across the middle. If you must change lots, alternate two skeins every two rows so the change blends in.`,
    },
    { type: 'h2', text: `Are crochet plant hangers safe?` },
    {
      type: 'p',
      text: `A watered plant is heavier than it looks, and the weight pulls on every join.`,
    },
    {
      type: 'ul',
      items: [
        `Choose cord that is strong and does not stretch, such as cotton or macrame cord. Avoid thin or fuzzy yarn.`,
        `Check the ceiling hook. It must be rated for more weight than the pot, soil and water together, and it should be screwed into a joist or fitted with an anchor suited to the ceiling.`,
        `Take the pot down to water it, let it drain, and then hang it back. Water dripping through the crochet stains it and loosens fibers.`,
        `Inspect the cord every few weeks for wear, especially where it meets the ring.`,
      ],
    },
    {
      type: 'p',
      text: `Keep hanging pieces out of reach of small children and pets, and check the product safety rules in your country if you plan to sell decor.`,
    },
    { type: 'h2', text: `How do I clean and care for crochet decor?` },
    {
      type: 'ul',
      items: [
        `Follow the yarn label, and keep it in a notebook for each project.`,
        `Spot clean with a damp cloth and a drop of mild soap before a full wash.`,
        `Dry flat away from direct sun and radiators. Hanging a wet blanket stretches it.`,
        `Keep every crochet piece away from candles, fireplaces and heaters. Many yarns, especially synthetic ones, can melt or burn.`,
      ],
    },
    { type: 'h2', text: `Where should I start with a first home decor project?` },
    {
      type: 'p',
      text: `Choose by the skill you want to practice. Coasters teach tension in an evening. A pot cover or basket teaches working in the round. A cushion cover teaches gauge and seaming. A throw teaches yarn planning. Do them in that order.`,
    },
    {
      type: 'p',
      text: `If you want a small handmade touch before committing to a big piece, the [amigurumi patterns](/shop/amigurumi) in our shop make charming shelf decor, and the [free crochet patterns](/free-crochet-patterns) page is a no-risk way to try our style. For more help, the [guides](/guides) section covers reading patterns and terms.`,
    },
    { type: 'h2', text: `What is available in the shop right now?` },
    {
      type: 'p',
      text: `This category is still being built. At the moment it has no patterns listed, and we add to it over time. Amigurumi has about 150 patterns, and No-Sew Amigurumi has 7, so most of what is live today is there.`,
    },
    {
      type: 'p',
      text: `Buying works the same everywhere. Patterns are PDF files, the download is available right after payment, and a link is also emailed to you. You do not need an account to buy. Payment is handled by Paddle. If something is not right, the [refund policy](/refund-policy) explains your options, and the [FAQ](/faq) answers common questions.`,
    },
  ],
  faq: [
    {
      q: `What is the best yarn for a crochet basket?`,
      a: `Cotton cord or T-shirt yarn gives the stiffest result, because the fiber is thick and does not stretch. Work single crochet with a hook two sizes smaller than the label suggests, so the fabric is tight enough to stand up.`,
    },
    {
      q: `How long does it take to crochet a blanket?`,
      a: `A throw of about 40 by 50 inches in worsted yarn usually takes 3 to 6 weeks of regular evening crochet. Chunky yarn with a large hook can take a week or two.`,
    },
    {
      q: `Can I wash crochet cushion covers in the washing machine?`,
      a: `Only if the yarn label allows it. Use a gentle cycle in a mesh bag, cool water, and a mild detergent. Do not tumble dry, and reshape the cover flat to dry. If unsure, hand wash it.`,
    },
    {
      q: `How do I stop a crochet blanket from curling at the edges?`,
      a: `Add a border of two or three rounds of single crochet. Work the first round into every stitch along the sides and three stitches into each corner so the corners lie flat.`,
    },
    {
      q: `How much yarn do I need for a 16-inch cushion cover?`,
      a: `Two panels in worsted or chunky yarn use about 300 to 450 yards (275 to 410 meters). Swatch a 4-inch square, weigh it, and scale up to find an accurate amount for your yarn.`,
    },
    {
      q: `Is crochet home decor safe around candles and heaters?`,
      a: `Keep it well away from any flame or heat source, since many yarns burn or melt. With children or pets, also check the safety guidance for your country on small decorations and cords.`,
    },
  ],
}
