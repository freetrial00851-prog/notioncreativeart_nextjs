import type { CategoryContent } from '@/lib/categoryContent'

export const toolsGuidesContent: CategoryContent = {
  slug: 'tools-guides',
  body: [
    { type: 'h2', text: `Crochet tools and supplies for beginners: what to buy and what to skip` },
    {
      type: 'p',
      text: `Crochet tools and supplies for beginners come down to five things: one hook, one smooth yarn, a pair of small scissors, a blunt needle and something to mark your rounds. Everything else is optional. This page explains how to pick each item, how to read hook sizes and yarn labels, how to hold your hook, and how to fix the mistakes every new crocheter makes.`,
    },
    { type: 'h2', text: `What goes in a crochet starter kit?` },
    {
      type: 'p',
      text: `A ready-made crochet starter kit is convenient, but you can build your own in one trip. Use this table as a checklist.`,
    },
    {
      type: 'table',
      caption: `A beginner crochet starter kit, item by item`,
      head: [`Tool`, `What it does`, `What to look for`, `You can skip`],
      rows: [
        [`Hook, 4.0 mm to 5.0 mm`, `Forms every stitch`, `A smooth head with a clear throat, and a handle that fits your hand`, `Sets of 14 sizes, until you know which ones you reach for`],
        [`Smooth yarn, medium weight`, `Practice and first projects`, `Light color, round plied strands, a plain finish`, `Fuzzy, dark or speckled yarn`],
        [`Stitch markers`, `Flag the first stitch of a round, or a spot to return to`, `Open or locking style that will not slip out`, `Fancy ones; a scrap of contrasting yarn works`],
        [`Tapestry needle`, `Weaves in ends and joins pieces`, `A large eye and a blunt tip that will not split stitches`, `Needle sets with sharp tips`],
        [`Small sharp scissors`, `Cuts ends cleanly`, `Short blades that cut yarn without chewing it`, `Anything with a built-in case or gimmick`],
        [`Tape measure`, `Checks gauge and finished size`, `Soft, flexible, marked in inches and centimeters`, `Rigid rulers`],
        [`Fiberfill and safety eyes`, `Only for toys`, `Buy them when you choose a toy pattern`, `Everything, if you start with a flat item`],
      ],
    },
    {
      type: 'p',
      text: `If you plan to make toys, our [amigurumi patterns](/shop/amigurumi) list the exact materials on the first page, so you can buy only what that project needs.`,
    },
    { type: 'h2', text: `How do I choose a crochet hook?` },
    {
      type: 'p',
      text: `Choose the hook by size first, then by material, then by handle. Size matters most because it sets how big your stitches are. Material and handle decide whether the hook feels good for an hour at a time.`,
    },
    {
      type: 'ul',
      items: [
        `Aluminum is slick and fast. It suits cotton and other grabby yarns, but fuzzy yarn can slide off the tip.`,
        `Bamboo and wood have a little grip, which many beginners find calmer. They can flex or snap on thin sizes.`,
        `Soft-grip or thick ergonomic handles spread pressure across your palm. They are a good upgrade once you crochet for more than 30 minutes at a time.`,
      ],
    },
    { type: 'h2', text: `Crochet hook sizes: a metric and US chart` },
    {
      type: 'p',
      text: `The millimeter number is the real size. US letters and numbers are printed on many hooks, but they are not perfectly consistent between makers, so trust the millimeters when they disagree.`,
    },
    {
      type: 'table',
      caption: `Common crochet hook sizes and the yarn they pair with`,
      head: [`Metric`, `US size often printed`, `Pairs with`],
      rows: [
        [`2.25 mm`, `B-1`, `Fingering and sport weight, fine lace work`],
        [`2.75 mm`, `C-2`, `Fingering and sport weight, small toys`],
        [`3.5 mm`, `E-4`, `Sport and DK weight`],
        [`4.0 mm`, `G-6`, `DK and light worsted`],
        [`5.0 mm`, `H-8`, `Worsted weight`],
        [`5.5 mm`, `I-9`, `Worsted and aran`],
        [`6.5 mm`, `K-10.5`, `Chunky weight`],
        [`8.0 mm`, `L-11`, `Chunky and super chunky`],
        [`9.0 mm`, `M-13`, `Super chunky and jumbo`],
      ],
    },
    {
      type: 'p',
      text: `A 5.0 mm hook with worsted yarn is the classic place to start. If you make toys, drop to a hook one or two sizes below the yarn label's suggestion.`,
    },
    { type: 'h2', text: `Yarn weight chart: from lace to jumbo` },
    {
      type: 'p',
      text: `Yarn weight describes thickness, not how heavy the ball is. The Craft Yarn Council numbers run from 0 (lace) to 7 (jumbo). Hook ranges are a starting point, not a rule.`,
    },
    {
      type: 'table',
      caption: `Yarn weights, typical hooks and best uses`,
      head: [`Weight`, `Typical hook`, `Best for`],
      rows: [
        [`0 Lace`, `1.5 to 2.25 mm`, `Doilies, delicate shawls`],
        [`1 Super fine (fingering)`, `2.25 to 3.5 mm`, `Socks, lightweight shawls, tiny toys`],
        [`2 Fine (sport)`, `3.5 to 4.5 mm`, `Baby items, light garments`],
        [`3 Light (DK)`, `4.0 to 5.0 mm`, `Garments, small amigurumi`],
        [`4 Medium (worsted)`, `4.5 to 5.5 mm`, `Blankets, hats, most amigurumi`],
        [`5 Bulky (chunky)`, `5.5 to 8.0 mm`, `Quick scarves, warm hats`],
        [`6 Super bulky`, `8.0 to 12.75 mm`, `Fast blankets, big cozy items`],
        [`7 Jumbo`, `12.75 mm and up`, `Chunky throws, floor baskets`],
      ],
    },
    { type: 'h2', text: `How do I read a yarn label?` },
    {
      type: 'p',
      text: `The label holds everything you need to buy the right amount and avoid color surprises. Look for these parts.`,
    },
    {
      type: 'ul',
      items: [
        `Weight number and symbol: the 0 to 7 category from the chart above.`,
        `Fiber content: cotton, wool, acrylic or a blend. This decides stretch, warmth and washing.`,
        `Yardage and ball weight: how much yarn you get, and the number to compare between brands.`,
        `Gauge and hook suggestion: the maker's guess for typical tension.`,
        `Dye lot number: a batch code for the color.`,
      ],
    },
    {
      type: 'p',
      text: `The dye lot matters because the same color name can look slightly different between batches. Buy all the yarn for a project at once, and check that the lot numbers match. If you must add a ball from a different lot later, alternate it with the old one every two rows so the change reads as a subtle stripe instead of a visible seam.`,
    },
    { type: 'h2', text: `How much yarn will I need?` },
    {
      type: 'p',
      text: `A pattern normally lists the yardage. If it names a different yarn from yours, convert by yardage, not by ball count. Example: the pattern asks for 400 yards, and your skein holds 170 yards. Divide 400 by 170 to get 2.35, so buy three skeins. Always round up.`,
    },
    { type: 'h2', text: `How do I hold a crochet hook?` },
    {
      type: 'p',
      text: `There are two common grips, and neither is wrong. Choose the one that feels relaxed.`,
    },
    {
      type: 'ul',
      items: [
        `Pencil grip: hold the hook like a pencil, thumb and index finger on the flat part. It gives fine control and suits small stitches.`,
        `Knife grip: hold it like a table knife, with your palm over the handle. Many people find it steadier for long sessions and for bulky yarn.`,
      ],
    },
    {
      type: 'p',
      text: `Your other hand controls the yarn and holds the work. Keep it near the stitch you are working in, because holding the fabric further away is a common cause of uneven tension.`,
    },
    { type: 'h2', text: `Crochet tension: how to fix stitches that are too tight or too loose` },
    {
      type: 'p',
      text: `Tension is how firmly you pull the yarn. Most beginners start tight, because they grip the yarn as hard as they grip the hook.`,
    },
    {
      type: 'ul',
      items: [
        `Too tight: you can barely get the hook into the next stitch. Relax your fingers, let the yarn slide freely, and go up one hook size. Do not pull each loop snug against the hook.`,
        `Too loose: the stitches look gappy and the fabric flops. Drop down one hook size and guide the yarn with a gentle drag around one finger.`,
      ],
    },
    {
      type: 'p',
      text: `If a pattern lists a gauge, work a swatch about 5 inches square, measure the stitches across 4 inches, and change hook size until it matches.`,
    },
    { type: 'h2', text: `Crochet ergonomics: comfort and break habits` },
    {
      type: 'p',
      text: `Comfortable crocheting is about small habits. Keep your shoulders low, rest your forearms on cushions, and sit with the work close to your body. Stop every 20 to 30 minutes to open and close your hands and roll your wrists. If you feel ongoing pain, tingling or numbness, stop and see a health professional.`,
    },
    { type: 'h2', text: `How to fix crochet mistakes` },
    {
      type: 'p',
      text: `Every crocheter rips back. It is normal, and it is quick once you know how.`,
    },
    {
      type: 'ol',
      items: [
        `Remove the hook so the working loop is free. Gently pull the yarn tail, and the stitches unravel one at a time.`,
        `Stop at the row or round where the error began, put the hook back into the last good loop, and check that it sits at the correct stitch.`,
        `For a lifeline, thread a strand of thin contrasting yarn through the top of a finished row with a needle. If you rip back later, the stitches stop at the lifeline and you will not unravel too far.`,
      ],
    },
    {
      type: 'p',
      text: `A split stitch happens when the hook goes through the strands of the yarn instead of under them. Spot it by a bump or a thin spot in the stitch. Pull the loop out, keep the hook tip angled up, and look where the hook enters before you push. A hook with a slightly blunt tip helps. Counting stitches at the end of every row catches a missed stitch while the fix is still only one row away.`,
    },
    { type: 'h2', text: `How do I use a PDF crochet pattern?` },
    {
      type: 'p',
      text: `A PDF pattern works well on paper or on a tablet. Print it if you like to write notes, or use a tablet with a reader app that lets you highlight and mark off rounds as you go. On a phone, zoom in so you see the whole round at once.`,
    },
    {
      type: 'ul',
      items: [
        `Keep the stitch abbreviations nearby. Our guide to [reading a crochet pattern](/guides/how-to-read-a-crochet-pattern) explains the notation, and the [US vs UK terms chart](/guides/crochet-abbreviations-us-vs-uk) helps if a pattern uses different names for the same stitch.`,
      ],
    },
    { type: 'h2', text: `Crochet starter kit: what to buy first and what to buy later` },
    {
      type: 'ol',
      items: [
        `First: one 5.0 mm hook, two balls of smooth worsted yarn, a tapestry needle and small scissors.`,
        `Second: a few stitch markers and a tape measure, once you start working in rounds.`,
        `Third: a second hook size and a different fiber, when you want to compare how they feel.`,
        `Later: a hook set, a row counter, blocking mats and pins. Toy makers add fiberfill and safety eyes.`,
      ],
    },
    {
      type: 'p',
      text: `Start with something simple from our [free crochet patterns](/free-crochet-patterns) before you buy anything extra.`,
    },
    { type: 'h2', text: `What is available on this site right now?` },
    {
      type: 'p',
      text: `The shop is growing in stages. At the moment there are about 150 amigurumi patterns, seven no-sew amigurumi patterns and one free wearable. Other categories, including this one, have no patterns yet and are being added to over time. You can browse everything in the [shop](/shop), and more free guides will join the [guides](/guides) section.`,
    },
    { type: 'h2', text: `How buying a PDF pattern works` },
    {
      type: 'p',
      text: `Patterns are PDF files. You do not need an account to buy one. Payment is handled by Paddle, and the download is available right after payment, with a link also sent to your email. If something is not right, the [refund policy](/refund-policy) explains your options, and the [FAQ](/faq) or the [contact page](/contact) can help with anything else.`,
    },
  ],
  faq: [
    {
      q: `What do I need to start crocheting?`,
      a: `You need a hook, yarn, scissors and a tapestry needle. A 5.0 mm hook and a smooth worsted weight yarn in a light color is the easiest pairing to learn on. Add a stitch marker when you begin working in rounds.`,
    },
    {
      q: `What size crochet hook should a beginner use?`,
      a: `Most beginners do well with a 4.5 mm to 5.5 mm hook and worsted weight yarn. If stitches feel tight, go up half a millimeter; if loose, go down.`,
    },
    {
      q: `Why is my crochet so tight?`,
      a: `Most new crocheters grip both the hook and the yarn too firmly. Relax your hands, let the yarn run freely through your fingers, and try a hook one size larger.`,
    },
    {
      q: `What is the difference between yarn weight and ball weight?`,
      a: `Yarn weight describes the thickness of the strand, from lace to jumbo. Ball weight is how much the skein weighs on a scale. Two balls of the same weight can hold different yardage, so check the length on the label when you compare.`,
    },
    {
      q: `What is a dye lot, and does it matter?`,
      a: `A dye lot is a batch of yarn colored at the same time. Colors can vary slightly between lots even when the name is the same. Buy all the yarn for a project together and match the lot numbers, particularly for blankets and garments.`,
    },
    {
      q: `How do I fix a mistake several rows back?`,
      a: `Pull out the hook and gently unravel the yarn until you reach the row with the error. Put the hook back into the last good loop and continue.`,
    },
  ],
}
