import type { CategoryContent } from '@/lib/categoryContent'

export const homeDecorContent: CategoryContent = {
  slug: 'home-decor',
  body: [
    { type: 'h2', text: `Crochet home decor: make your space your own` },
    {
      type: 'p',
      text: `Crocheted home decor adds warmth and texture that shop-bought items rarely have. A cushion cover, a throw blanket, a wall hanging, a plant holder or a basket gives a room a handmade character, and you can choose the colors to match your home exactly. Because the pieces are not worn, they are also forgiving: a slightly different size is rarely a problem, and the stitches can be bold and decorative.`,
    },
    {
      type: 'p',
      text: `This page is where our home decor crochet patterns are collected. The range is still being built, so there may be few patterns here for now. The guide below explains how to choose projects, yarn and stitches for the home, so that what you make looks good and lasts.`,
    },
    { type: 'h2', text: `Popular crochet projects for the home` },
    {
      type: 'table',
      caption: `Decor ideas and what to expect`,
      head: [`Project`, `Time it takes`, `Skill level`],
      rows: [
        [`Coasters and mats`, `One evening`, `Beginner`],
        [`Cushion cover`, `A few evenings to a weekend`, `Beginner to intermediate`],
        [`Basket or storage bin`, `A weekend`, `Beginner to intermediate`],
        [`Wall hanging or garland`, `A weekend`, `Beginner to intermediate`],
        [`Plant hanger or pot cover`, `One to two evenings`, `Beginner`],
        [`Throw blanket`, `Several weeks`, `Beginner to advanced, depending on the stitch`],
        [`Rug or floor cushion`, `A few weekends`, `Intermediate`],
      ],
    },
    { type: 'h2', text: `Choosing yarn for the home` },
    {
      type: 'p',
      text: `The yarn depends on how the item will be used. A cushion or a blanket is touched all day, so softness and washability matter. A basket or a rug has to be strong and hold its shape. A wall hanging only has to look good, so you can choose texture and color freely.`,
    },
    {
      type: 'ul',
      items: [
        `Cotton: strong, easy to wash and great for baskets, rugs, coasters and plant hangers. It holds its shape and does not stretch much.`,
        `Cotton blends and soft acrylic: comfortable for cushion covers and throws and easy to care for.`,
        `Chunky and jumbo yarn: works up quickly into thick, cozy blankets and floor cushions. It is heavy, so check that your hands and your storage can handle it.`,
        `T-shirt yarn or jute: sturdy, a modern look, ideal for baskets and rugs. Both need a larger hook.`,
        `Wool and wool blends: warm and durable, great for blankets, though some people may be sensitive to wool.`,
      ],
    },
    { type: 'h2', text: `Choose stitches that suit the job` },
    {
      type: 'p',
      text: `Dense stitches such as single crochet and moss stitch make firm fabric. They are good for baskets, bags and anything that must keep its shape. Taller stitches such as double crochet work up quicker and drape better, which suits blankets and cushion covers. Textured stitches like waffle, bobble and popcorn stitches add depth, but they use more yarn than a plain stitch, so check the amount that your pattern asks for. Lacy stitches suit curtains, table runners and wall hangings, where light passing through the work is part of the look.`,
    },
    { type: 'h2', text: `Color and style: making it match your room` },
    {
      type: 'ul',
      items: [
        `Start with the room: pick two or three colors that already appear in your space and use them in the project.`,
        `Neutrals such as cream, oatmeal and grey give a calm, modern look and go with almost everything.`,
        `Bold colors add energy to a simple room. Use one strong color for a cushion, and keep everything else quiet.`,
        `Mix textures rather than too many colors: a plain cushion next to a textured throw looks interesting in a single color.`,
        `Look at a swatch in the room itself, in daylight and in the evening, before you buy the whole amount of yarn.`,
      ],
    },
    { type: 'h2', text: `Gauge, size and yardage for bigger pieces` },
    {
      type: 'p',
      text: `Large projects such as blankets and rugs use a lot of yarn, so it is worth planning before you start. Make a swatch to check your gauge and to see how the stitch looks. Follow the pattern's yardage guidance, and buy a little extra yarn from the same dye lot, because colors can differ slightly between batches. Joining a new ball of yarn in the middle of a project can show a change in color, so if you are not sure, buy one more ball than you think you need.`,
    },
    { type: 'h2', text: `Blocking and finishing` },
    {
      type: 'p',
      text: `Blocking makes a big difference to decor pieces. Cushion covers, wall hangings and blanket squares become straighter and more even after they are wet or steamed, pinned to the right size and left to dry. Check the care instructions on your yarn label first, because some fibers should not be heated. Add a neat edging to a blanket or a cushion to give it a finished look, and weave in the ends thoroughly, since a loose end on a big piece is easy to catch.`,
    },
    { type: 'h2', text: `Care and cleaning` },
    {
      type: 'ul',
      items: [
        `Follow the yarn label for the washing temperature and the drying method.`,
        `Wash large pieces in a machine only if the yarn is machine-washable, and use a gentle cycle.`,
        `Dry flat or in the shade, so the color does not fade and the shape is kept.`,
        `Keep items away from candles, fires and heaters, since yarn can burn or melt.`,
        `Store cushions and blankets in a dry place, and fold heavy pieces instead of hanging them.`,
      ],
    },
    { type: 'h2', text: `Practice with small projects first` },
    {
      type: 'p',
      text: `If you have not made a large piece before, start with a coaster, a small mat or a plant pot cover. They use little yarn and let you test the stitch, the colors and your tension before you commit to a blanket. Many of the skills carry over from other crochet: our guide on [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern) explains the notation, and the [US and UK crochet terms chart](/guides/crochet-abbreviations-us-vs-uk) is useful when you try patterns from different countries.`,
    },
    { type: 'h2', text: `A plan for your first cushion cover` },
    {
      type: 'p',
      text: `A cushion cover is a good first larger project, because it is a simple flat shape and gives you something useful. Choose a cushion insert first, and then crochet the cover about a centimeter or two smaller, so it fits snugly.`,
    },
    {
      type: 'ol',
      items: [
        `Measure the cushion insert across and down, and note the numbers.`,
        `Make a gauge swatch in your chosen stitch, and work out how many stitches you need for the width.`,
        `Crochet two squares or rectangles, one for the front and one for the back. The front can be decorative, and the back can be plain, which is quicker.`,
        `Block both pieces, so they are the same size.`,
        `Join three sides with slip stitch or single crochet, insert the cushion, then close the fourth side, or add buttons or a zip for a removable cover.`,
      ],
    },
    { type: 'h2', text: `Wall hangings and garlands` },
    {
      type: 'p',
      text: `Wall hangings are mostly decorative, so you can be creative with color, texture and shape. A simple design might be a few rows of colorful stripes hanging from a wooden dowel, finished with a fringe. A garland is a string of small shapes, such as flowers, stars or pennants, joined by a chain. Both can be made from leftovers and do not need any exact sizing, which makes them a relaxing project. Hang them with small hooks that do not damage the wall, and keep them away from sources of heat.`,
    },
    { type: 'h2', text: `Plant hangers and pot covers` },
    {
      type: 'p',
      text: `Plants and crochet go well together. A plant hanger is made from several long cords joined to a ring at the top and a base that holds the pot. Cotton cord is a good choice, as it is strong and does not stretch much. A pot cover is a small basket-style piece that slides over a plain plastic pot to give it a handmade look. Remember that a plant is heavy when watered, so check the strength of the hanger and of the hook on the wall or ceiling. Remove the pot to water the plant, so water does not stain the crochet.`,
    },
    { type: 'h2', text: `Making decor last` },
    {
      type: 'ul',
      items: [
        `Choose a yarn that does not fade quickly in the sun if the item will sit by a window.`,
        `Vacuum or shake out dust from larger pieces, as you would with other textiles.`,
        `Spot clean small marks with a damp cloth and mild soap before you try a full wash.`,
        `Rotate cushions and throws so that the wear is even.`,
      ],
    },
    { type: 'h2', text: `While this section grows` },
    {
      type: 'p',
      text: `Small decorative pieces can be made from our [amigurumi patterns](/shop/amigurumi). A row of little crocheted animals on a shelf adds charm to a nursery or a living room. Our [free crochet patterns](/free-crochet-patterns) are a good place to start if you want to try a design first. After you pay for a pattern, the PDF is ready to download straight away, and a link is also sent to your email. Payment is handled securely by Paddle. If you have any questions, [contact us](/contact).`,
    },
  ],
  faq: [
    {
      q: `Which yarn is best for a crochet basket?`,
      a: `Cotton, T-shirt yarn or jute. They are strong and hold their shape. Use a hook that makes a tight, firm fabric.`,
    },
    {
      q: `How much yarn do I need for a blanket?`,
      a: `It depends on the size, the stitch and the yarn weight. Follow the yardage in the pattern, and buy an extra ball from the same dye lot.`,
    },
    {
      q: `Can I machine wash crochet home decor?`,
      a: `Only if the yarn label says it is machine-washable. Use a gentle cycle and dry flat.`,
    },
    {
      q: `Are there home decor patterns in this section yet?`,
      a: `The range is still being built, so the number of patterns changes. You can check the page for the current list.`,
    },
  ],
}
