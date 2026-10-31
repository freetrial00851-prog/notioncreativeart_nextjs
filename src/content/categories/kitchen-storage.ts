import type { CategoryContent } from '@/lib/categoryContent'

export const kitchenStorageContent: CategoryContent = {
  slug: 'kitchen-storage',
  body: [
    { type: 'h2', text: `Crochet kitchen patterns: useful projects that survive daily use` },
    {
      type: 'p',
      text: `Crochet kitchen patterns are the projects you reach for every day: dishcloths, coasters, pot holders, produce bags and storage baskets. They hold up because they are worked in sturdy cotton, in dense stitches, and they can be washed again and again. This guide covers which cotton to buy, how to keep a coaster flat, how thick a pot holder must be, how to build a basket that stands up, and how to wash everything properly.`,
    },
    { type: 'h2', text: `Which projects suit crochet, and what to make them with` },
    {
      type: 'p',
      text: `Kitchen projects ask more of a stitch than a toy does. They get wet, scrubbed, squeezed, heated and tumbled. Match the stitch to the job and most problems never appear. Your own tension will move these sizes by an inch either way.`,
    },
    {
      type: 'table',
      caption: `Kitchen and storage projects at a glance`,
      head: [`Project`, `Stitch that suits it`, `Yarn and hook`, `Typical finished size`],
      rows: [
        [`Coaster`, `Single crochet in the round`, `DK or sport cotton, 3.5 mm`, `4 in (10 cm) across`],
        [`Dishcloth`, `Waffle, moss or plain single crochet`, `Worsted cotton, 4.0 to 5.0 mm`, `8 to 9 in (20 to 23 cm) square`],
        [`Pot holder`, `Single crochet in back loops, two layers`, `Worsted cotton, 4.0 mm`, `7 to 8 in (18 to 20 cm) square`],
        [`Produce bag`, `Mesh of chains and double crochet`, `Cotton, 4.0 to 5.0 mm`, `12 x 14 in (30 x 35 cm)`],
        [`Basket`, `Single crochet, worked tight`, `Cotton cord, T-shirt yarn or jute, 5.0 to 8.0 mm`, `6 to 10 in (15 to 25 cm) wide`],
      ],
    },
    { type: 'h2', text: `Why 100 percent cotton is the right yarn for the kitchen` },
    {
      type: 'p',
      text: `Cotton is absorbent, it tolerates hot water, and it does not melt. Acrylic and other synthetic fibers can soften and fuse when they touch a hot pan, which is why they have no place in a pot holder. Cotton can still scorch, so treat it as heat resistant, never fireproof.`,
    },
    { type: 'h2', text: `What is the best yarn for dishcloths: mercerized or plain cotton?` },
    {
      type: 'p',
      text: `Both are cotton, and both work. Plain (unmercerized) cotton has a matte, slightly fuzzy surface that grabs food residue and drinks up water, so it suits a scrubbing cloth. Mercerized cotton has been treated to make it smoother, shinier and stronger, and it holds bright color well. That makes it a good pick for coasters and anything you want to look sharp.`,
    },
    {
      type: 'p',
      text: `Check the label for 100 percent cotton. Blends with acrylic or polyester are fine for a table runner but not for anything near heat. If pattern notation is new to you, [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern) walks through it.`,
    },
    { type: 'h2', text: `How to make a flat crochet coaster that does not ruffle or cup` },
    {
      type: 'p',
      text: `A flat circle in single crochet grows by 6 stitches every round. Start with 6 stitches in a magic ring. Round 2 has 12, round 3 has 18, and so on. Round 6 gives you 36 stitches, which is about 4 inches in DK cotton on a 3.5 mm hook.`,
    },
    {
      type: 'table',
      caption: `Single crochet circle: the increase math`,
      head: [`Round`, `Stitches at end`, `How to work it`],
      rows: [
        [`1`, `6`, `6 single crochet in a magic ring`],
        [`2`, `12`, `2 single crochet in every stitch`],
        [`3`, `18`, `*1 single crochet, then 2 in the next*, repeat around`],
        [`4`, `24`, `*2 single crochet, then 2 in the next*, repeat around`],
        [`5`, `30`, `*3 single crochet, then 2 in the next*, repeat around`],
        [`6`, `36`, `*4 single crochet, then 2 in the next*, repeat around`],
      ],
    },
    {
      type: 'p',
      text: `Ruffling means the edge becomes wavy like a pie crust. It happens when you have too many stitches for the diameter. Cupping means the coaster curls up into a shallow bowl. It happens when you have too few. Both are fixed the same way, by changing the stitch count and not by pulling harder.`,
    },
    {
      type: 'ul',
      items: [
        `If it ruffles, pull back one round and work the increases in a slightly wider pattern, or skip one increase in that round.`,
        `If it cups, pull back and add the missing increases. Make sure each one is a full 2 stitches in 1.`,
        `Mark the first stitch of every round, and count at the end of each one: it should be 6 times the round number.`,
      ],
    },
    {
      type: 'p',
      text: `Double crochet circles grow by 12 per round, not 6. UK patterns call single crochet "double crochet", so check the [US versus UK abbreviations chart](/guides/crochet-abbreviations-us-vs-uk) before you start.`,
    },
    { type: 'h2', text: `How to make a crochet pot holder that protects your hand` },
    {
      type: 'p',
      text: `A single thin layer lets heat through in seconds. Work two squares and join them with a round of single crochet, or work one square in back loops only, which produces a thick, ribbed fabric that traps air. Aim for at least a quarter inch (6 mm) of finished thickness, and test it on something warm before you pick up a hot pan.`,
    },
    {
      type: 'ul',
      items: [
        `Use 100 percent cotton only. Never use acrylic or wool-acrylic blends near an oven, stove or pot.`,
        `Keep a pot holder dry. Damp cotton conducts heat much faster and can scald.`,
        `Keep it away from open flame and hot elements, and replace it when it scorches or thins.`,
      ],
    },
    { type: 'h2', text: `How to crochet a basket that stands up on its own` },
    {
      type: 'p',
      text: `A basket is a coaster with walls. Make the flat base first, using the increase math above, and stop when it is as wide as you want the basket. Then work one round in back loops only with no increases. That round creates a crisp corner, and every round after it simply rises.`,
    },
    {
      type: 'p',
      text: `Go down 1 to 2 mm from the hook size on the label. A tight fabric with no gaps is what makes a basket rigid. If you can see light through the stitches, the hook is too big.`,
    },
    {
      type: 'ol',
      items: [
        `Base: single crochet circle, increasing 6 per round until the base is the width you want. A 6 inch base takes roughly 12 rounds in cord.`,
        `Corner: one round in back loops only, no increases.`,
        `Walls: single crochet in both loops, one stitch per stitch, for 15 to 25 rounds.`,
        `Handles: chain 6 to 8, skip the same number of stitches below, and single crochet into the next stitch. Work the following round into the chains.`,
        `Finish: a round of slip stitch makes a firm rim.`,
      ],
    },
    {
      type: 'p',
      text: `For extra stiffness, crochet around a length of clothesline, or slip a circle of plastic canvas under the base. A basket that leans is usually a stitch count error, so count the base again.`,
    },
    { type: 'h2', text: `Crochet produce bags and how much they can hold` },
    {
      type: 'p',
      text: `A crochet produce bag is an open mesh tube with a drawstring and a base. Work the base flat, then a mesh of chain-2 and double crochet for the sides, usually 20 to 25 rounds. Cotton stretches when loaded, so a few pounds of apples is fine but a bag of potatoes will grow long and thin. For heavy loads choose a tighter mesh and double the handle.`,
    },
    { type: 'h2', text: `How to wash crochet dishcloths, coasters and baskets` },
    {
      type: 'p',
      text: `New cotton can shrink a little and shed loose dye, so do a first wash before use. After that, rotate cloths through a regular schedule.`,
    },
    {
      type: 'table',
      caption: `A simple care schedule`,
      head: [`Item`, `How often`, `How`],
      rows: [
        [`Dishcloths`, `Every 2 to 3 days, or sooner if they smell`, `Hot machine cycle if the label allows, then dry fully`],
        [`Coasters and placemats`, `Every few weeks, or after a spill`, `Warm wash, flat dry`],
        [`Produce bags`, `After each trip`, `Warm wash, hang to dry`],
        [`Baskets`, `As needed`, `Spot clean or hand wash, then dry in shape`],
      ],
    },
    {
      type: 'p',
      text: `Test color before you trust it. Wet a small swatch, press it on a white paper towel for a minute, then look for color. If it leaves color, wash that item alone until the water runs clear.`,
    },
    {
      type: 'p',
      text: `Never store cotton while damp. Damp, closed-up cotton is how mold begins, in cupboards and in baskets alike. Hang cloths to dry, and let a basket air for a day before it goes in a cabinet.`,
    },
    { type: 'h2', text: `Are crochet items safe around food?` },
    {
      type: 'p',
      text: `Some general habits go a long way. Wash a new item before first use. Keep separate cloths for hands, dishes and counters. Rinse out raw meat juices straight away and launder the cloth hot. Replace a cloth when it goes thin, smells after washing or starts to unravel. If you plan to sell items that touch food, check the rules for your country or state first.`,
    },
    { type: 'h2', text: `Start with these three crochet kitchen patterns, in this order` },
    {
      type: 'ol',
      items: [
        `A set of four coasters. They take under an hour each and teach you the flat circle. Do not move on until your circles lie flat.`,
        `A square dishcloth in waffle stitch. About 40 rows of simple stitches. It teaches even edges and tension.`,
        `A small basket, 6 inches wide. It uses the coaster base, so it feels familiar, and it teaches you to work tight.`,
      ],
    },
    { type: 'h2', text: `Common mistakes with kitchen crochet, and how to fix them` },
    {
      type: 'ul',
      items: [
        `Wavy or cupped coaster: wrong stitch count. Count each round and keep a marker on the first stitch.`,
        `Baggy dishcloth: hook too large. Go down half a millimeter at a time until the fabric feels firm.`,
        `Floppy basket: loose gauge. Drop 1 to 2 mm, use cord, or add a plastic canvas base.`,
        `Colors that bleed: wash dark and bright items alone and use a dye test next time.`,
        `Musty smell: it was stored damp. Wash hot and dry fully.`,
      ],
    },
    { type: 'h2', text: `What patterns are available right now` },
    {
      type: 'p',
      text: `This category has no patterns listed yet. It is being added to over time. The shop's other categories are further along: [Amigurumi](/shop/amigurumi) has about 150 patterns and [No-Sew Amigurumi](/shop/no-sew-amigurumi) has 7. [Wearables](/shop/wearables) has 1, and it is free. Amigurumi is full of flat circles, so it is good practice for coasters and basket bases, and the [free crochet patterns](/free-crochet-patterns) page lets you try a pattern first.`,
    },
    { type: 'h2', text: `How buying a pattern works` },
    {
      type: 'p',
      text: `Every pattern is a PDF file. You do not need an account to buy. Payment is handled by Paddle, and the download is available straight after payment, with a link also sent to your email. If something is not right, the [refund policy](/refund-policy) explains what to do, and [contact us](/contact) with any question.`,
    },
  ],
  faq: [
    {
      q: `Can I use acrylic yarn for crochet dishcloths?`,
      a: `You can, but it is a poor choice. Acrylic does not absorb water, so it pushes liquid around instead of soaking it up, and it can melt if it touches something hot. Use 100 percent cotton for anything that meets water, grease or heat.`,
    },
    {
      q: `What is the best yarn for dishcloths?`,
      a: `Worsted-weight 100 percent cotton, usually worked with a 4.0 to 5.0 mm hook. Plain cotton scrubs and absorbs well, and mercerized cotton looks smoother.`,
    },
    {
      q: `How do I stop my crochet coaster from curling?`,
      a: `Curling or cupping means too few stitches for the width. Check that every round has the right count: 6, 12, 18, 24 and so on in single crochet. If the count is right and it still cups, go up half a millimeter in hook size.`,
    },
    {
      q: `Are crochet pot holders safe to use?`,
      a: `They are when they are made of 100 percent cotton, at least two layers or a quarter inch thick, and dry. Do not use them near open flame, and replace one that scorches or goes thin. Never use a damp pot holder on a hot pan.`,
    },
    {
      q: `How do I wash crochet dishcloths without shrinking them?`,
      a: `Cotton may shrink a little in the first wash, so wash a new cloth before using it and expect a small change in size. After that it stays close to the same size. Follow the label, use a hot cycle if it allows, and dry fully. Skip fabric softener, which coats the fibers and cuts absorbency.`,
    },
    {
      q: `What yarn makes a crochet basket hold its shape?`,
      a: `Cotton cord, cotton rope, T-shirt yarn or jute twine. All are thick and firm. Use a hook 1 to 2 mm smaller than the label suggests so the fabric has no gaps, and keep the walls in single crochet.`,
    },
  ],
}
