import type { CategoryContent } from '@/lib/categoryContent'

export const bundlesContent: CategoryContent = {
  slug: 'bundles',
  body: [
    { type: 'h2', text: `What are crochet pattern bundles?` },
    {
      type: 'p',
      text: `Crochet pattern bundles are sets of several patterns sold together as one purchase, usually built around a theme, a size or a skill level. The point is not only a lower price. A good bundle gives you toys that match, a yarn list you can buy in one trip, and a sensible order to make things in. This guide shows how to judge whether a bundle is worth buying and how to plan a whole set.`,
    },
    {
      type: 'p',
      text: `A single pattern answers one question: how do I make this? A bundle answers a bigger one: what do I want to end up with? Thinking about the finished set first turns a bundle from a discount into a plan.`,
    },
    { type: 'h2', text: `How do you tell if a crochet pattern bundle is worth it?` },
    {
      type: 'p',
      text: `A bundle only saves money on patterns you will actually make. Check these before you buy.`,
    },
    {
      type: 'ol',
      items: [
        `Count the patterns you truly want. If you would happily make most of them, a bundle makes sense. If you only want one or two, buy those singly.`,
        `Compare prices. Add up the single prices of the patterns you would really use and set that against the bundle price on the listing. Do the sum yourself instead of assuming.`,
        `Check the yarn weight and hook size on each pattern. A set that is all worsted weight (category 4) with a 2.5 to 3.5 mm hook means one shopping trip. A set that jumps between lace weight and chunky means three.`,
        `Match the skill level to yours. Mostly beginner patterns with one or two stretches are ideal. A set where every pattern needs shaping tricks you have never tried will sit unused.`,
        `Look at the finished sizes. Toys meant to stand together should be close in height, and the listing should say how tall each one is.`,
      ],
    },
    { type: 'h2', text: `Which type of amigurumi pattern bundle suits you?` },
    {
      type: 'table',
      caption: `Common kinds of crochet pattern sets and who they suit`,
      head: [`Bundle type`, `What it offers`, `Best for`],
      rows: [
        [`Themed animal set`, `Several animals from one world, such as farm, forest or ocean, designed in one style`, `Nursery shelves, baby gifts, collectors`],
        [`Skill ladder`, `Patterns ordered from easy to harder, each adding one new skill`, `Beginners who want a clear path`],
        [`Quick-make set`, `Tiny projects such as keychains and charms, 1 to 2 hours each`, `Gift makers, craft fairs, using up scraps`],
        [`Same-technique set`, `Patterns that all use one method, such as no-sew construction`, `Makers who dislike sewing parts together`],
      ],
    },
    {
      type: 'p',
      text: `If seams are your least favorite part, a same-technique set is worth a look. Our [no-sew amigurumi patterns](/shop/no-sew-amigurumi) are worked in one piece, so a whole set of them needs far less finishing.`,
    },
    { type: 'h2', text: `How do you plan yarn for several projects at once?` },
    {
      type: 'p',
      text: `This is where a bundle repays you. Instead of buying yarn for each toy as you go, you make one list for the whole set. Here is a worked example with four small toys about 10 cm (4 inches) tall: a bear, a bunny, a duck and a fox. All figures are approximate. Your tension, stuffing and yarn will shift them, and every pattern states its own amounts, so treat this as a method rather than a promise.`,
    },
    {
      type: 'p',
      text: `Assume worsted weight cotton or acrylic and a 2.5 mm hook, which gives the tight fabric amigurumi needs. Worsted cotton runs about 2 meters per gram, so a 50 g ball is roughly 90 to 100 meters.`,
    },
    {
      type: 'table',
      caption: `Yarn used per toy (approximate meters)`,
      head: [`Toy`, `Main color`, `Second color`, `Details`],
      rows: [
        [`Bear`, `Tan, 45 m`, `Brown, 8 m`, `Black embroidery, 1 m`],
        [`Bunny`, `Cream, 50 m`, `Pink, 6 m`, `Black embroidery, 1 m`],
        [`Duck`, `Yellow, 40 m`, `Orange, 7 m`, `Black embroidery, 1 m`],
        [`Fox`, `Orange, 45 m`, `Cream, 12 m`, `Brown, 5 m`],
      ],
    },
    {
      type: 'p',
      text: `Now combine by color. Cream appears twice (bunny 50 m plus fox 12 m) for 62 m. Orange appears twice (fox 45 m plus duck 7 m) for 52 m. Brown appears twice (bear 8 m plus fox 5 m) for 13 m. Black is three tiny amounts that add up to 3 m. Add a 25 percent buffer, because running out mid-toy is the most common planning failure.`,
    },
    {
      type: 'table',
      caption: `The combined shopping list (approximate)`,
      head: [`Color`, `Used by`, `Needed`, `With 25% buffer`, `Buy`],
      rows: [
        [`Cream`, `Bunny, fox`, `62 m`, `78 m`, `One 50 g ball`],
        [`Tan`, `Bear`, `45 m`, `56 m`, `One 50 g ball`],
        [`Yellow`, `Duck`, `40 m`, `50 m`, `One 50 g ball`],
        [`Orange`, `Fox, duck`, `52 m`, `65 m`, `One 50 g ball`],
        [`Pink`, `Bunny`, `6 m`, `8 m`, `Scrap or mini skein`],
        [`Brown`, `Bear, fox`, `13 m`, `16 m`, `Scrap or mini skein`],
        [`Black`, `All four faces`, `3 m`, `4 m`, `Scrap`],
      ],
    },
    {
      type: 'p',
      text: `Four full balls and three scraps cover four toys. Buying all the cream in one go also means the dye lot matches, so the bunny and the fox share the same white.`,
    },
    { type: 'h2', text: `How do you keep a set of matching crochet toys consistent?` },
    {
      type: 'p',
      text: `Toys from one bundle should look like siblings. The things that most often break the family resemblance are small, and each has a simple fix.`,
    },
    {
      type: 'ul',
      items: [
        `Tension drift. Your stitches loosen when you are relaxed and tighten when you are rushing. Make a gauge swatch of 10 single crochet by 10 rows, and compare each new toy's first rounds against it. If a toy comes out bigger, drop a hook size for the next one instead of squeezing harder.`,
        `Uneven stuffing. Weigh your fiberfill. Giving each toy of the same size the same amount, say 12 to 15 g for a 10 cm toy, keeps them equally firm. Push small pieces into the limbs first.`,
        `Eye placement. Cut a paper template with pin holes marking eye distance, and reuse it. For the same face style, keep eyes about 6 to 8 stitches apart and one or two rounds above the nose.`,
        `Yarn mixing. Do not swap cotton for acrylic halfway through a set. Cotton is heavier and stiffer, so toys stand differently.`,
        `Finishing. Decide your method once: invisible decrease at the end, tails woven in twice, and the same stitch for sewing.`,
      ],
    },
    { type: 'h2', text: `Can you use a crochet pattern bundle to learn new skills?` },
    {
      type: 'p',
      text: `Yes, and a skill-ladder bundle is one of the gentlest ways to do it. Start with a simple round shape worked entirely in single crochet. The second might add sewn-on ears, the third a color change. By the fourth you are using techniques that felt out of reach a week earlier.`,
    },
    {
      type: 'p',
      text: `If the pattern language is the obstacle, read our guide to [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern) before you begin. If you follow patterns from both sides of the Atlantic, the [US vs UK crochet abbreviations chart](/guides/crochet-abbreviations-us-vs-uk) will save you from a wrong stitch, since the same word can mean a different stitch in each system.`,
    },
    { type: 'h2', text: `How do you batch-make a set of amigurumi?` },
    {
      type: 'p',
      text: `Making four toys one after another gets dull by the third. Instead, work the same stage on every toy before moving on to the next stage.`,
    },
    {
      type: 'ol',
      items: [
        `Bodies first. Crochet all four bodies, stopping before the final decreases. Same hook, same session, same tension.`,
        `Parts second. Make all ears, arms, tails and beaks in a row. These small pieces take 10 to 15 minutes each, so you will finish a pile in an evening.`,
        `Stuff and close. Stuff every body to the same firmness, then close them.`,
        `Attach with pins. Pin every part before you sew any. Check that the ears sit level, and step back to look at the set before you commit.`,
        `Faces last. Add eyes, noses and cheeks to all four in one sitting.`,
      ],
    },
    { type: 'h2', text: `How do you give and photograph a crochet gift set?` },
    {
      type: 'p',
      text: `A set of three or four small toys feels generous in a way a single toy does not. For a baby shower, choose soft, simple designs with embroidered faces, and tie them together with a ribbon or place them in a small box lined with tissue paper. A card with the fiber content and washing advice from your yarn label is a thoughtful touch. For toys meant for young children, check the safety rules for your country on small parts, and consider embroidering faces instead of using safety eyes.`,
    },
    {
      type: 'p',
      text: `To photograph a set, use a plain background such as a wooden board or a folded cloth, and shoot beside a window in daylight, not under a ceiling lamp. Arrange the toys in a loose group with the tallest at the back, leaving a little space so each outline reads clearly. A phone camera is plenty.`,
    },
    { type: 'h2', text: `Can you sell toys made from a pattern bundle?` },
    {
      type: 'p',
      text: `Terms differ from pattern to pattern, and they are the designer's to set. Many designers allow sales of small quantities of finished items if you credit them. Others do not allow sales at all. Some ask that you never share, resell or give away the pattern file itself. Read the terms of use that come with your pattern before you sell anything, and if they are not clear, ask the designer through the [contact page](/contact).`,
    },
    { type: 'h2', text: `Where are the bundles, and what can you do meanwhile?` },
    {
      type: 'p',
      text: `To be straightforward about it: the shop is still growing. At the moment [amigurumi](/shop/amigurumi) has about 150 patterns, [no-sew amigurumi](/shop/no-sew-amigurumi) has 7, and [wearables](/shop/wearables) has 1, which is free. Bundles, like most other categories, have no listings yet and are being added over time.`,
    },
    {
      type: 'p',
      text: `You do not have to wait to make a set, though. Pick three or four amigurumi patterns of the same skill level and similar size, and apply the methods above: one yarn weight, one hook, one shopping list, batch-made. If you want to test a style before spending anything, the [free crochet patterns](/free-crochet-patterns) page is a good place to start.`,
    },
    { type: 'h2', text: `How does buying a pattern work?` },
    {
      type: 'p',
      text: `Every pattern is a PDF file. You do not need an account to buy. Payment is handled by Paddle, and the download is available right after payment, with a link also sent to your email so you can find it again. If something goes wrong, the [refund policy](/refund-policy) explains your options, and the [FAQ](/faq) answers common questions.`,
    },
  ],
  faq: [
    {
      q: `Are crochet pattern bundles cheaper than buying patterns separately?`,
      a: `They are usually priced to be better value, but not always by much, and only if you want most of what is inside. Add up the single prices of the patterns you would really make and compare that total with the bundle price on the listing.`,
    },
    {
      q: `How much yarn do I need for a set of amigurumi?`,
      a: `For four toys about 10 cm tall in worsted weight, expect roughly 40 to 50 meters of main color per toy and a few meters for details. Add the amounts for each color across all toys, then add about 25 percent as a buffer. Always follow the yardage printed in each pattern, since it varies with your tension.`,
    },
    {
      q: `Can I use different yarn for each pattern in a set?`,
      a: `You can, but the toys will not look like a family. A different weight changes the size, and a different fiber changes how the toy feels and holds its shape. If you want a matching set, keep one weight, one fiber and one hook size throughout.`,
    },
    {
      q: `What is a good first bundle for a beginner?`,
      a: `Look for a skill-ladder set or a themed set of simple, round shapes in worsted weight with a 2.5 to 3.5 mm hook, where the first pattern gives clear round-by-round counts.`,
    },
    {
      q: `Can I sell toys I make from a pattern bundle?`,
      a: `That depends on the designer's terms, which can differ between patterns. Read the terms that come with each pattern before you sell anything. If they do not say, ask the designer, and never share or resell the pattern file itself.`,
    }
  ],
}
