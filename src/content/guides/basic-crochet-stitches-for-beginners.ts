import type { Guide } from '@/lib/guides'

export const basicStitchesGuide: Guide = {
  slug: 'basic-crochet-stitches-for-beginners',
  title: 'Basic Crochet Stitches for Beginners: Names, Abbreviations and How They Work',
  description:
    'The basic crochet stitches in one place: chain, slip stitch, single, half double and double crochet, with abbreviations, US and UK names and when to use each.',
  datePublished: '2026-11-02',
  dateModified: '2026-11-05',
  author: 'Notion Creative Art',
  related: ['how-to-single-crochet', 'how-to-half-double-crochet', 'how-to-double-crochet', 'how-to-slip-stitch-and-slip-knot', 'crochet-hook-sizes-chart'],
  body: [
    {
      type: 'p',
      text: `Almost everything in crochet is made from a small set of basic stitches. If you learn the chain, the slip stitch, the single crochet, the half double crochet and the double crochet, you can follow most beginner patterns. This page lists each stitch with its abbreviation, a short description of how it is made, and the projects it suits. For the full step-by-step instructions, follow the link under each stitch. Whatever the stitch, the tools are the same: a crochet hook, a ball of yarn, scissors and a yarn needle for weaving in ends.`,
    },
    { type: 'h2', text: `The basic stitches at a glance` },
    {
      type: 'table',
      caption: `Basic crochet stitches (US terms and abbreviations)`,
      head: [`Stitch`, `Abbreviation`, `UK name`, `Height`],
      rows: [
        [`Chain`, `ch`, `chain`, `Smallest, used for the base`],
        [`Slip stitch`, `sl st`, `slip stitch`, `Flat, adds no height`],
        [`Single crochet`, `sc`, `double crochet (dc)`, `Short`],
        [`Half double crochet`, `hdc`, `half treble (htr)`, `Medium`],
        [`Double crochet`, `dc`, `treble (tr)`, `Tall`],
      ],
    },
    {
      type: 'p',
      text: `Notice that the same abbreviation, "dc", means a different stitch in the US and the UK. Always check which system a pattern uses before you start. Our [US and UK crochet terms chart](/guides/crochet-abbreviations-us-vs-uk) lists the names side by side.`,
    },
    { type: 'h2', text: `The slip knot` },
    {
      type: 'p',
      text: `Every project starts with a slip knot, which holds the first loop on the hook. Make a loop in the yarn, pull a second loop of yarn through it, put that second loop on the hook and pull the tail to tighten it. The knot should slide easily on the hook, but it should not fall off.`,
    },
    { type: 'h2', text: `Chain (ch)` },
    {
      type: 'p',
      text: `Yarn over the hook and pull the yarn through the loop that is already on the hook. Repeat to make a longer chain. A chain forms the foundation of flat projects, makes the turning chains at the end of rows, and creates space in lace patterns. Keep the loops even, and do not count the loop on the hook when you count your chains. Learn it in our guide to [how to crochet for beginners](/guides/how-to-crochet-for-beginners).`,
    },
    { type: 'h2', text: `Slip stitch (sl st)` },
    {
      type: 'p',
      text: `Put the hook into a stitch, yarn over, and pull the yarn through both the stitch and the loop on the hook in one motion. The slip stitch is very flat. It is used to join the end of a round to the beginning, to finish a project's edge and to travel across stitches without adding height.`,
    },
    { type: 'h2', text: `Single crochet (sc)` },
    {
      type: 'p',
      text: `Put the hook into the stitch, yarn over and pull up a loop (2 loops on the hook), then yarn over and pull through both loops. It makes a short, dense fabric that does not show stuffing, so it is the main stitch for amigurumi toys, and it also suits bags and coasters. See the full steps in [how to single crochet](/guides/how-to-single-crochet).`,
    },
    { type: 'h2', text: `Half double crochet (hdc)` },
    {
      type: 'p',
      text: `Yarn over first, then put the hook into the stitch, yarn over and pull up a loop (3 loops on the hook), then yarn over and pull through all 3. It is taller than a single crochet and makes a soft but sturdy fabric, good for hats, scarves and blankets. See [how to half double crochet](/guides/how-to-half-double-crochet).`,
    },
    { type: 'h2', text: `Double crochet (dc)` },
    {
      type: 'p',
      text: `Yarn over, put the hook into the stitch, yarn over and pull up a loop (3 loops), then yarn over and pull through 2 loops, and yarn over again to pull through the last 2. It is tall and drapey, and it covers ground quickly, which makes it the favorite for blankets, shawls and granny squares. See [how to double crochet](/guides/how-to-double-crochet).`,
    },
    { type: 'h2', text: `Increase and decrease` },
    {
      type: 'ul',
      items: [
        `Increase (inc): work two stitches into the same stitch. It makes the fabric wider.`,
        `Decrease (dec): work two stitches together into one. It makes the fabric narrower. For single crochet, this is written "sc2tog".`,
        `Invisible decrease: a decrease worked through the front loops only. It leaves a smaller gap, so toy patterns often prefer it.`,
      ],
    },
    {
      type: 'p',
      text: `Increases and decreases are how crocheters shape a flat circle into a ball or a toy. Most toys start with a [magic ring](/guides/how-to-make-a-magic-ring-crochet), then increase every round until the shape is wide enough, and decrease to close it.`,
    },
    { type: 'h2', text: `Front loops and back loops` },
    {
      type: 'p',
      text: `The top of every stitch has a V made of two loops: a front loop closest to you, and a back loop farther away. Unless a pattern says otherwise, you put the hook under both loops. Some patterns ask you to work in the back loop only (blo) or the front loop only (flo). Working in one loop creates a ridge, which is used for ribbing, textured fabric and for turning a flat shape into a corner.`,
    },
    { type: 'h2', text: `Turning chains and stitch height` },
    {
      type: 'p',
      text: `When you work in rows, you chain a few stitches at the end of each row to lift the yarn to the height of the next row. This is the turning chain, and the taller the stitch, the longer the chain. Patterns often tell you whether it counts as a stitch, so read that note before you count.`,
    },
    {
      type: 'table',
      caption: `Typical turning chain by stitch (US terms)`,
      head: [`Stitch`, `Turning chain`, `Yarn overs before the hook enters the stitch`],
      rows: [
        [`Single crochet`, `1`, `0`],
        [`Half double crochet`, `2`, `1`],
        [`Double crochet`, `3`, `1`],
      ],
    },
    {
      type: 'p',
      text: `Past the double crochet there are taller stitches, such as the treble crochet (tr in US terms), which wraps the yarn twice before entering the stitch. They are used in lace, shells and shawls. Most beginner and amigurumi patterns need only the stitches above. A hook that suits your yarn matters as much as the stitch, so see the [crochet hook sizes chart](/guides/crochet-hook-sizes-chart).`,
    },
    { type: 'h2', text: `Which stitch for which project` },
    {
      type: 'table',
      caption: `Choosing a stitch`,
      head: [`Project`, `Common stitch`, `Why`],
      rows: [
        [`Amigurumi toys`, `Single crochet`, `Dense fabric hides the stuffing and holds the shape.`],
        [`Hats and beanies`, `Half double crochet or single crochet`, `Warm, sturdy, and works up quickly.`],
        [`Blankets and shawls`, `Double crochet or half double crochet`, `Tall stitches cover a large area fast and drape well.`],
        [`Baskets and bags`, `Single crochet`, `A dense stitch gives structure.`],
        [`Granny squares`, `Double crochet`, `Built from groups of tall stitches.`],
      ],
    },
    { type: 'h2', text: `How to practice` },
    {
      type: 'ol',
      items: [
        `Master the chain and the slip stitch on a short practice chain.`,
        `Make a swatch of single crochet, and check the stitch count of each row.`,
        `Learn the half double crochet and the double crochet the same way, one at a time.`,
        `Learn the magic ring and a flat circle.`,
        `Try a project that uses the stitches you now know.`,
      ],
    },
    {
      type: 'p',
      text: `Ready to try a real pattern? Browse our [crochet patterns for beginners](/crochet-patterns-for-beginners), where the free patterns are listed first, or open the [free crochet patterns](/free-crochet-patterns) page. Our guide on [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern) explains the abbreviations you will meet.`,
    },
  ],
  faq: [
    {
      q: `What are the basic crochet stitches?`,
      a: `The chain, slip stitch, single crochet, half double crochet and double crochet. Almost every beginner pattern is made from these, together with increases and decreases.`,
    },
    {
      q: `Which crochet stitch should I learn first?`,
      a: `The chain, then the single crochet. They are short, simple and used in most beginner projects, including amigurumi toys.`,
    },
    {
      q: `Why is dc a different stitch in UK and US patterns?`,
      a: `The two systems use the same names for different stitches. A US double crochet is a UK treble, and a US single crochet is a UK double crochet. Check which system your pattern uses.`,
    },
    {
      q: `What does it mean to work in the back loop only?`,
      a: `You put the hook under only the loop of the V that is farthest from you. It leaves the front loop as a visible ridge, which is used for ribbing and texture.`,
    },
    {
      q: `How long does it take to learn all the basic stitches?`,
      a: `Most people can make all five within a week of short practice sessions. It takes longer to make them smooth and even, which comes with practice.`,
    },
    {
      q: `What is a turning chain in crochet?`,
      a: `It is a short chain worked at the end of a row to bring the yarn up to the height of the next row. Single crochet usually uses 1, half double crochet 2 and double crochet 3. Your pattern says whether it counts as a stitch.`,
    },
    {
      q: `Can I make amigurumi with only single crochet?`,
      a: `Yes. Many toy patterns use only single crochet, increases and decreases, plus a magic ring to start. Some also add a slip stitch to finish a round or a chain for small parts.`,
    },
    {
      q: `What is the easiest crochet stitch for a complete beginner?`,
      a: `The chain is the simplest motion, and the single crochet is the easiest stitch to make a fabric with. Learn those two first, then move to the taller stitches.`,
    },
  ],
}
