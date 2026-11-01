import type { Guide } from '@/lib/guides'

export const yarnLabelsGuide: Guide = {
  slug: 'how-to-read-yarn-labels',
  title: 'How to Read a Yarn Label: Symbols, Dye Lots and Yardage',
  description:
    'Learn how to read a yarn label: weight number, fiber, grams, yardage, hook size, gauge, care symbols and dye lot, plus how many balls a project needs.',
  datePublished: '2026-11-02',
  dateModified: '2026-11-02',
  author: 'Notion Creative Art',
  related: ['best-yarn-for-amigurumi', 'crochet-gauge-swatch', 'how-to-read-a-crochet-pattern'],
  body: [
    {
      type: 'p',
      text: `A yarn label looks like a jumble of numbers and tiny pictures, but it answers almost every question you have before you buy: how thick the yarn is, what it is made of, how much is in the ball, which hook to start with and how to wash the finished piece. Once you know how to read a yarn label, you can compare two yarns in a minute and buy the right amount the first time.`,
    },
    { type: 'h2', text: `Everything on a typical label` },
    {
      type: 'p',
      text: `Layouts differ, and some makers split the information between a paper band and the back. Nearly every label carries the same items. Use this table as a map.`,
    },
    {
      type: 'table',
      caption: `What each label item tells you`,
      head: [`Label item`, `What it looks like`, `What it tells you`],
      rows: [
        [`Weight category`, `A number from 0 to 7 in a yarn-ball picture`, `How thick the yarn is. Number 4 is medium (worsted).`],
        [`Fiber content`, `Percentages, such as 80% acrylic, 20% wool`, `What it is made of: warmth, stretch, softness, washing.`],
        [`Net weight`, `For example 100 g (3.5 oz)`, `How heavy the ball is.`],
        [`Length`, `For example 200 m (219 yd)`, `How far the yarn stretches. Use this to plan a project.`],
        [`Hook and needle size`, `A hook picture and a needle picture with sizes`, `A suggested starting size, not a rule.`],
        [`Gauge square`, `A small square with stitch and row counts`, `The stitches and rows the maker measured over 4 in (10 cm).`],
        [`Care symbols`, `Pictures of a wash tub, triangle, square, iron`, `How to wash, dry and press.`],
        [`Dye lot or batch number`, `A short code of letters and numbers`, `Which dye batch the ball came from.`],
        [`Color name and number`, `For example "Sage, 114"`, `The shade. The number is the same in every batch.`],
      ],
    },
    { type: 'h2', text: `Weight category: the number in the ball` },
    {
      type: 'p',
      text: `The number is a thickness label, not a quality rating. Most amigurumi uses category 3 (light) or 4 (medium). Our [yarn weight chart](/guides/yarn-weight-chart) lists every category with typical hook sizes. Match the category your pattern asks for, or the toy will come out larger or smaller than the photo.`,
    },
    { type: 'h2', text: `Fiber content, grams and ounces` },
    {
      type: 'p',
      text: `Cotton is firm and barely stretches, acrylic is light and easy to wash, and wool adds springiness. Our guide to the [best yarn for amigurumi](/guides/best-yarn-for-amigurumi) explains which fibers suit toys. Net weight is printed in grams and ounces. A 100 g ball is about 3.5 oz, and a 50 g ball is about 1.75 oz. Weight alone tells you little, because 100 g of thin yarn is much longer than 100 g of thick yarn.`,
    },
    { type: 'h2', text: `Yardage and meters` },
    {
      type: 'p',
      text: `The length line is the most useful number on the label. One yard is 0.9144 meters, so 220 yards is about 201 meters.`,
    },
    { type: 'h2', text: `How many balls does a project need?` },
    {
      type: 'p',
      text: `Divide the yardage the pattern asks for by the yardage in one ball and round up. Then add about 10 percent for tension differences and ripped-out rows. A worked example follows.`,
    },
    {
      type: 'ol',
      items: [
        `The pattern needs 640 yards (about 585 meters). Your ball holds 220 yards (about 201 meters).`,
        `640 divided by 220 is 2.909, so you need at least 3 balls.`,
        `Add 10 percent: 640 times 1.1 is 704 yards.`,
        `704 divided by 220 is 3.2, so buy 4 balls.`,
      ],
    },
    {
      type: 'note',
      text: `Three balls give only 660 yards, just 20 more than the pattern needs. That is thin cover if your tension runs loose.`,
    },
    { type: 'h2', text: `Dye lot: why it matters` },
    {
      type: 'p',
      text: `Yarn is dyed in batches, and each batch gets a lot number. Two balls with the same color name but different lots can differ slightly. You may not see it in the ball, but it can show as a band once the piece is worked up. Check the lot number on every ball, take all your yarn from one lot and buy a spare ball at the same time, because that lot may be gone when you return.`,
    },
    { type: 'h2', text: `Hook size and gauge square` },
    {
      type: 'p',
      text: `The suggested hook suits general crochet. Amigurumi uses a hook one or two sizes smaller, so the fabric is tight and the stuffing cannot show. Look up sizes in our [crochet hook sizes chart](/guides/crochet-hook-sizes-chart). The gauge square is a guide only. To learn your own gauge, follow our [gauge swatch guide](/guides/crochet-gauge-swatch).`,
    },
    { type: 'h2', text: `What "ply" does and does not mean` },
    {
      type: 'p',
      text: `Ply is the number of strands twisted together. A 4-ply yarn has four strands, but each strand can be thick or thin, so ply does not tell you the thickness. Some regions also use "4 ply" as a loose name for a thin weight. Rely on the weight category and the yardage instead.`,
    },
    { type: 'h2', text: `Comparing two yarns by yardage per 100 g` },
    {
      type: 'p',
      text: `Balls come in different sizes, so divide the length by the weight and multiply by 100.`,
    },
    {
      type: 'ul',
      items: [
        `Yarn A: 50 g and 120 m. 120 divided by 50 is 2.4 m per gram, so 240 m per 100 g.`,
        `Yarn B: 100 g and 200 m. 200 divided by 100 is 2 m per gram, so 200 m per 100 g.`,
        `Yarn A gives you 20 percent more length for the same weight (240 compared with 200), so it is probably the finer yarn.`,
      ],
    },
    { type: 'h2', text: `Care symbols` },
    {
      type: 'p',
      text: `A wash tub means machine washing, and a number in it is the highest water temperature. A tub with a hand means hand wash. A triangle refers to bleach, a square with a circle to tumble drying, an iron to pressing and a circle to dry cleaning. A cross over a symbol means do not. Symbols vary by region, so read the small print too.`,
    },
    { type: 'h2', text: `Hank, skein and ball` },
    {
      type: 'p',
      text: `A hank is a large loop of yarn twisted on itself. It tangles if you pull from the middle, so wind it first. A skein is an oblong, machine-wound shape, often pulled from the center, and a ball is round. To wind a hank:`,
    },
    {
      type: 'ol',
      items: [
        `Untwist the hank into a large loop.`,
        `Slip it over a chair back or a friend's hands, taut but not stretched.`,
        `Cut only the ties that hold the loop together, never the yarn.`,
        `Wind the yarn into a ball around your fingers, turning the ball often and winding loosely so the yarn keeps its stretch.`,
      ],
    },
    { type: 'h2', text: `Common problems and fixes` },
    {
      type: 'table',
      head: [`What you see`, `Why`, `What to do`],
      rows: [
        [`Two balls look different in one piece`, `They come from different dye lots`, `Alternate balls every two rows to blend the change.`],
        [`You run short near the end`, `No margin was added to the yardage`, `Look for the same lot, or use a new color for a trim.`],
        [`Your toy is bigger than the photo`, `The yarn or hook was thicker than the pattern's`, `Match the weight category, then swatch first.`],
        [`The hank is a knotted mess`, `It was pulled from the middle before winding`, `Wind it slowly, working out each knot as you reach it.`],
      ],
    },
    { type: 'h2', text: `Practice` },
    {
      type: 'p',
      text: `At your next shop visit, find the weight category, yardage and lot number on three labels, then work out the yardage per 100 g for two of them. When you are ready to use this, try a project from our [crochet patterns for beginners](/crochet-patterns-for-beginners), where every pattern lists its materials and skill level.`,
    },
  ],
  faq: [
    {
      q: `What does the number on a yarn label mean?`,
      a: `The number from 0 to 7 in a small ball picture is the weight category, which tells you how thick the yarn is. Number 4 is medium, or worsted. Also check the yardage and your own swatch.`,
    },
    {
      q: `Can I mix two dye lots in one project?`,
      a: `You can, but the join may show as a faint band. If you must, work two rows from each ball in turn for a few rounds so the change blends. It is easier to buy everything from one lot.`,
    },
    {
      q: `Is a 4-ply yarn the same as a number 4 weight?`,
      a: `No. Ply counts the strands twisted together, while the number 4 describes thickness. A 4-ply yarn can be quite thin, and a number 4 yarn can have a different ply count.`,
    },
    {
      q: `Which is better for planning, grams or yardage?`,
      a: `Yardage, because it is the actual length you will work with. Grams only show how heavy the ball is, and fibers differ in weight for the same length.`,
    },
    {
      q: `Do I have to use the hook size on the label?`,
      a: `No. It is a suggestion for general crochet. Use the hook your pattern names, and for amigurumi go smaller than the label suggests so the stitches are tight.`,
    },
  ],
}
