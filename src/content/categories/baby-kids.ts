import type { CategoryContent } from '@/lib/categoryContent'

export const babyKidsContent: CategoryContent = {
  slug: 'baby-kids',
  body: [
    { type: 'h2', text: `Baby crochet patterns: what to make, with what, and how to keep it safe` },
    {
      type: 'p',
      text: `Baby crochet patterns work best when the yarn, the stitches and the finishing are chosen for a very small person who will chew, drool, drag and wash everything. This guide covers what to make at each age, which yarn to buy, how big a hat or blanket should be, and the safety habits that keep handmade gifts worry-free.`,
    },
    { type: 'h2', text: `What to crochet at each age (and why)` },
    {
      type: 'p',
      text: `The best crochet patterns for kids match what the child is actually doing. A newborn sleeps and gets carried. A nine-month-old grabs and mouths everything. A five-year-old wants a character. Choosing by stage saves you from making something lovely that never gets used.`,
    },
    {
      type: 'ul',
      items: [
        `Newborn (0-3 months): hats, soft booties that sit above the ankle so they stay on, and a small blanket for the pram or car seat.`,
        `3-12 months: a flat lovey or comforter, a crocheted cover for an untreated wooden baby ring, soft stacking cups, and a play-mat blanket. Everything will go in the mouth, so think plain shapes, tight stitches and no add-ons.`,
        `Toddler (1-3 years): simple, sturdy animals, a hat with ear flaps, play food and a small drawstring-free bag.`,
        `School age (4-10 years): character toys, scarves, headbands and pouches.`,
      ],
    },
    { type: 'h2', text: `What is the best yarn for baby crochet?` },
    {
      type: 'p',
      text: `The best yarn for baby crochet is soft against the cheek, strong enough to survive repeated washing, and labeled for machine washing. Weight matters too. DK (light worsted) gives a lighter, drapier fabric for blankets and hats, while worsted works up faster and is easier for beginners.`,
    },
    {
      type: 'table',
      caption: `Common yarns for baby projects compared (general guide; always read the label)`,
      head: [`Yarn`, `Softness`, `Washability`, `Warmth`],
      rows: [
        [`Combed or mercerized cotton`, `Medium; softens with washing`, `Very good; usually machine washable`, `Low; good for warm weather and toys`],
        [`Cotton and acrylic blend`, `Medium to high`, `Very good`, `Low to medium`],
        [`Baby-labeled acrylic`, `High`, `Very good; check the label for temperature`, `Medium`],
        [`Superwash merino`, `High`, `Good; machine washable only if labeled superwash`, `High`],
        [`Bamboo or viscose blend`, `High, with a silky drape`, `Gentle wash; can stretch when wet`, `Low to medium`],
      ],
    },
    {
      type: 'p',
      text: `Skip fuzzy yarns such as mohair and eyelash near a baby's face, because loose fibers shed. If a family has wool sensitivity, choose cotton or acrylic and put the fiber content on a care card (more on that below).`,
    },
    { type: 'h2', text: `Crochet baby hat sizes and blanket sizes` },
    {
      type: 'p',
      text: `Sizes vary between designers, so treat these as approximate starting points and check them against the finished measurements in your pattern. A hat is usually made about an inch smaller than the head circumference so it stays on, and crochet stretches a little.`,
    },
    {
      type: 'table',
      caption: `Approximate head circumference and hat depth by age`,
      head: [`Age`, `Head circumference`, `Hat depth`],
      rows: [
        [`Newborn`, `13-14 in (33-36 cm)`, `4.5-5 in (11-13 cm)`],
        [`0-3 months`, `14-15 in (36-38 cm)`, `5-5.5 in (13-14 cm)`],
        [`3-6 months`, `15-16 in (38-41 cm)`, `5.5-6 in (14-15 cm)`],
        [`6-12 months`, `16-18 in (41-46 cm)`, `6-6.5 in (15-17 cm)`],
        [`1-3 years`, `18-19 in (46-48 cm)`, `6.5-7 in (17-18 cm)`],
        [`4-10 years`, `19.5-21 in (50-53 cm)`, `7-8 in (18-20 cm)`],
      ],
    },
    {
      type: 'table',
      caption: `Approximate blanket sizes by use`,
      head: [`Type`, `Size`, `Best for`],
      rows: [
        [`Lovey or security blanket`, `12-14 in square (30-36 cm)`, `Small hands, quick project`],
        [`Stroller or car seat blanket`, `30 x 36 in (76 x 91 cm)`, `Outings, tummy time`],
        [`Crib-size blanket`, `36 x 45 in (91 x 114 cm)`, `Sofa, floor play, display on the crib rail`],
        [`Toddler or child throw`, `40 x 50 in (102 x 127 cm)`, `Bed, sofa, reading corner`],
      ],
    },
    {
      type: 'p',
      text: `For a gift, go one size up. If the pattern uses abbreviations you do not know, the guide on [US vs UK crochet abbreviations](/guides/crochet-abbreviations-us-vs-uk) helps you avoid the classic mix-up where the same stitch name means two different stitches.`,
    },
    { type: 'h2', text: `How to plan a crochet baby blanket` },
    {
      type: 'p',
      text: `A crochet baby blanket is the most loved gift and the easiest one to get wrong, mostly because of yarn quantity and tension.`,
    },
    {
      type: 'ul',
      items: [
        `Stitch: half double crochet, single crochet, moss stitch and granny squares all make dense, warm fabric. Very lacy stitches leave holes where small fingers and toes can catch, so save those for decorations.`,
        `Tension: if you can easily see light through the fabric, or the stitches gape when you pull gently, go down a hook size.`,
        `Edging: a border of one or two rounds of single crochet stops curling and gives a clean finish. Work three stitches into each corner so the corners lie flat.`,
      ],
    },
    {
      type: 'p',
      text: `Here is a worked example, using rough numbers that your own swatch will correct. Say you want a 30 x 36 inch stroller blanket in worsted-weight yarn, using a 5 mm hook and half double crochet. Make a 4 inch swatch and count: suppose you get about 14 stitches and 10 rows. Then 30 inches is about 105 stitches, plus 2 chains for the turning, and 36 inches is about 90 rows.`,
    },
    {
      type: 'p',
      text: `For yardage, weigh the swatch and divide the ball's weight by it. If a 4 inch swatch uses roughly 10 yards, the blanket is about 67 times the swatch area, so around 675 yards, plus about 10 percent for a border and the odd mistake. That gives roughly 750 yards. Buy all the skeins together, as dye lots can differ.`,
    },
    { type: 'h2', text: `Are crochet baby toys safe? A general checklist` },
    {
      type: 'p',
      text: `This is general good practice, not legal or medical advice. Rules about toys and children's products differ between countries, so check the requirements where you live, and especially if you plan to sell what you make.`,
    },
    {
      type: 'ul',
      items: [
        `Choose embroidered features over plastic eyes, buttons or beads for babies and toddlers.`,
        `Use a hook one or two sizes smaller than the label suggests, so stuffing cannot poke through. If stuffing shows when you pinch the fabric, the stitches are too loose.`,
        `Stuff with clean polyester fiberfill, firmly but without overstretching the stitches.`,
        `Tug every attached part firmly, in different directions, before you give the toy away. `,
        `Keep ties, ribbons, cords and long tails off toys and clothing, especially anything near a neck.`,
        `Weave in ends in at least two directions and trim neatly. Hidden ends that work loose are a common problem.`,
        `For sleep, follow the safe sleep advice from your local health service. In many places it recommends keeping the sleep space clear, which means a crocheted blanket or toy is better as a gift for the pram, floor or sofa.`,
      ],
    },
    { type: 'h2', text: `How to make embroidered eyes for amigurumi` },
    {
      type: 'p',
      text: `Embroidered eyes for amigurumi are the standard choice for baby toys, and they look charming. Use black or dark brown embroidery floss, two to three strands, or a thin yarn that matches your project. Thread a needle and decide where the eyes go before you stitch, pinning them in place with a stitch marker.`,
    },
    {
      type: 'ol',
      items: [
        `Mark the spots. On a round head, eyes usually sit about one third of the way up from the neck, with around 5 to 6 stitches between them.`,
        `Insert the needle at the back of the head and bring it up at the first eye position, so the knot is hidden in the stuffing.`,
        `Make 3 to 4 short vertical stitches side by side, covering the same spot, to form a small oval. This satin stitch is flat and secure.`,
        `Repeat on the second eye, then tie off at the back and pull the tail through the toy before trimming.`,
      ],
    },
    { type: 'h2', text: `Washing and caring for crochet baby items` },
    {
      type: 'p',
      text: `Baby items get washed constantly, so planning for it is part of the design. Wash anything new before it meets the baby, then follow the yarn label.`,
    },
    {
      type: 'ul',
      items: [
        `Blankets and hats: a gentle machine cycle in a mesh bag, or hand wash in cool water. Dry flat so the shape holds.`,
        `Toys: a mesh bag and a gentle cycle for cotton or washable acrylic, then reshape while damp. Stuffed toys can take a day or two to dry fully, so dry them somewhere airy and do not give them back damp.`,
      ],
    },
    { type: 'h2', text: `Crochet gifts for newborns, and how to present them` },
    {
      type: 'p',
      text: `A set often beats a single piece. A hat, a pair of booties and a small lovey in the same yarn look planned and cost only a few evenings.`,
    },
    {
      type: 'p',
      text: `Add a small care card. Keep it short: the yarn name and fiber, the washing instructions, and your name. Wrap the gift in a muslin cloth or a box instead of tying a ribbon around the item.`,
    },
    { type: 'h2', text: `Quick makes or heirloom projects?` },
    {
      type: 'p',
      text: `Some gifts need to be done before the baby arrives, and some can take months. Choose by deadline, not ambition.`,
    },
    {
      type: 'ul',
      items: [
        `Quick makes: a beanie in chunky yarn, a pair of booties or a small lovey can often be finished in an evening or two, depending on your speed.`,
        `Heirloom projects: a granny square blanket, a textured cot blanket or a christening shawl. These take weeks, so choose a pattern you will enjoy repeating, and keep a note of the yarn so you can replace a lost skein.`,
      ],
    },
    {
      type: 'p',
      text: `The guide on [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern) is a good place to start before you buy your first pattern, and our other [crochet guides](/guides) cover techniques step by step.`,
    },
    { type: 'h2', text: `What is in this category right now` },
    {
      type: 'p',
      text: `Honest answer: this category has no patterns yet and is being added to over time. In the meantime, many small animals in our [amigurumi patterns](/shop/amigurumi), which has about 150 designs, make good toys when you embroider the face and use a tight stitch. The [no-sew amigurumi](/shop/no-sew-amigurumi) range works parts in one piece, so there are fewer attached pieces to check. You can also try a design first from the [free crochet patterns](/free-crochet-patterns) page.`,
    },
    { type: 'h2', text: `How buying works` },
    {
      type: 'p',
      text: `Our patterns are PDF files. The download is available right after payment, and a link is also emailed to you. You do not need an account to buy, and payment is handled by Paddle. If something is not right, the [refund policy](/refund-policy) explains your options, and you can [contact us](/contact) with any question.`,
    },
  ],
  faq: [
    {
      q: `What is the best yarn for baby crochet?`,
      a: `Soft cotton, a cotton and acrylic blend, or a machine-washable acrylic labeled for babies are the most practical choices. Superwash merino is warmer and soft, but check for wool sensitivity in the family.`,
    },
    {
      q: `How big should a crochet baby blanket be?`,
      a: `It depends on the use. A lovey is around 12 to 14 inches square, a stroller blanket is about 30 by 36 inches, and a crib-size blanket is closer to 36 by 45 inches. These are approximate, so check your pattern.`,
    },
    {
      q: `Can I use safety eyes on a crochet baby toy?`,
      a: `For babies and toddlers, embroidered eyes are the generally recommended choice, since hard parts can be a risk if they come loose. Safety eyes are better kept for older children. Rules differ by country, so check where you live.`,
    },
    {
      q: `What size hat should I crochet for a newborn?`,
      a: `A newborn head is about 13 to 14 inches around, and a hat is usually made about an inch smaller so it stays on. Always compare your pattern's finished measurements with the age you need.`,
    },
    {
      q: `Is it safe to put a crochet blanket in a crib?`,
      a: `Safe sleep advice from many health services recommends keeping the sleep space clear of loose blankets and soft toys for young babies. Please follow the guidance from your local health service. A crochet blanket is a lovely gift for the pram, the floor, the sofa or for an older child's bed.`,
    },
    {
      q: `How do I wash a crochet baby blanket?`,
      a: `Follow the yarn label first. For cotton or washable acrylic, a gentle machine cycle in a mesh bag or a cool hand wash is usually fine, and drying flat keeps the shape.`,
    },
  ],
}
