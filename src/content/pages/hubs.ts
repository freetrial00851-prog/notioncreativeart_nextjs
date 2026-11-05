import type { GuideBlock } from '@/lib/guides'

export type HubGroup = {
  id: string
  title: string
  /** One line under the section heading. */
  intro: string
  /** Words matched against pattern titles. */
  terms: string[]
  /** Link to a full search for the same idea. */
  searchQ: string
}

export type Hub = {
  path: string
  title: string
  h1: string
  description: string
  lead: string
  groups: HubGroup[]
  body: GuideBlock[]
  faq: { q: string; a: string }[]
}

export const ANIMALS_HUB: Hub = {
  path: '/amigurumi-animals',
  title: 'Amigurumi Animals Crochet Patterns: Bunny, Bear, Cat, Fox and More',
  h1: 'Amigurumi animals: crochet patterns from A to Z',
  description:
    'Browse amigurumi animal crochet patterns by animal: bunnies, bears, cats, dogs, foxes, frogs, sea creatures and more. PDF patterns with instant download.',
  lead: 'Looking for a particular toy? Pick an animal family below. Every pattern is a PDF you can download right after payment, with a materials list and a skill level, and the free ones download without an account.',
  groups: [
    { id: 'bunnies', title: 'Bunnies and rabbits', intro: 'The largest group, from tiny bunny charms to plush rabbits in dresses.', terms: ['bunny', 'rabbit'], searchQ: 'bunny' },
    { id: 'bears', title: 'Teddy bears, pandas and koalas', intro: 'Classic teddy bears, bears in outfits and other round, cuddly bears.', terms: ['teddy', 'bear', 'panda', 'koala'], searchQ: 'teddy' },
    { id: 'cats', title: 'Cats and kittens', intro: 'Kittens, cats in costumes and keychain cats.', terms: ['cat', 'kitten', 'kitty'], searchQ: 'cat' },
    { id: 'dogs-and-farm', title: 'Dogs, horses and farm animals', intro: 'Puppies, corgis, horses, goats, lambs and more.', terms: ['puppy', 'dachshund', 'corgi', 'pug', 'horse', 'pony', 'goat', 'lamb', 'sheep', 'rooster'], searchQ: 'puppy' },
    { id: 'woodland', title: 'Woodland animals', intro: 'Foxes, hedgehogs, squirrels, beavers and mice.', terms: ['fox', 'hedgehog', 'squirrel', 'beaver', 'mouse', 'hamster'], searchQ: 'fox' },
    { id: 'wild', title: 'Safari and wild animals', intro: 'Giraffes, zebras, lions, elephants, capybaras and more.', terms: ['giraffe', 'zebra', 'lion', 'elephant', 'hippo', 'capybara', 'lemur'], searchQ: 'giraffe' },
    { id: 'sea', title: 'Sea and water animals', intro: 'Jellyfish, turtles, dolphins, penguins, crabs and seagulls.', terms: ['jellyfish', 'turtle', 'dolphin', 'penguin', 'crab', 'seagull', 'fish', 'sea star'], searchQ: 'turtle' },
    { id: 'frogs-and-snakes', title: 'Frogs, snakes and small creatures', intro: 'Frogs, snakes, a gecko, a spider and a bee.', terms: ['frog', 'snake', 'gecko', 'spider', 'bee'], searchQ: 'frog' },
    { id: 'fantasy', title: 'Dinosaurs, ghosts and fantasy characters', intro: 'Dinosaurs, ghosts, monsters, an alien and Nessie.', terms: ['dinosaur', 'ghost', 'monster', 'alien', 'nessie'], searchQ: 'monster' },
  ],
  body: [
    { type: 'h2', text: `How to choose an amigurumi animal pattern` },
    {
      type: 'p',
      text: `Start with the animal you like, then check the skill level and the materials list. A small round animal with few parts, such as a bunny or a frog, is a good first make. Animals with outfits, ears and tails take more sewing, so they suit crocheters who are comfortable with the basics. If you are new, browse the [crochet patterns for beginners](/crochet-patterns-for-beginners) or try a [free crochet pattern](/free-crochet-patterns) first.`,
    },
    { type: 'h2', text: `Sizes, yarn and extras` },
    {
      type: 'p',
      text: `Finished size depends on the pattern, the yarn and the hook. The patterns here range from tiny charms of about 1.5 inches to plush toys of more than 10 inches, and a listing gives the size when its pattern states one. See [amigurumi sizes](/guides/amigurumi-sizes-mini-small-plush) and [how much yarn an amigurumi needs](/guides/how-much-yarn-for-amigurumi) before you buy yarn. Many animals also use safety eyes or embroidered eyes: read about [safety eyes](/guides/safety-eyes-for-amigurumi) and [face placement](/guides/amigurumi-face-placement-and-expression).`,
    },
    { type: 'h2', text: `More ways to browse` },
    {
      type: 'p',
      text: `See all [amigurumi crochet patterns](/shop/amigurumi), the [no-sew amigurumi patterns](/shop/no-sew-amigurumi), and the small [keychains and mini toys](/mini-amigurumi-and-keychains). New to the craft? [What is amigurumi?](/guides/what-is-amigurumi) explains it.`,
    },
  ],
  faq: [
    { q: 'Which amigurumi animal is easiest to crochet?', a: 'Small, round animals with few parts, such as a bunny, a frog or a mini keychain animal, are the easiest to start with. Check the skill level on each listing.' },
    { q: 'Do the patterns include ears, tails and outfits?', a: 'It depends on the pattern. Each listing names what the toy has, such as a dress, a scarf or a hat, so read the description before you buy.' },
    { q: 'Are these patterns free?', a: 'Some are. The free crochet patterns download without an account, and the rest are paid PDFs with an instant download.' },
  ],
}

export const MINI_HUB: Hub = {
  path: '/mini-amigurumi-and-keychains',
  title: 'Mini Amigurumi and Crochet Keychain Patterns (PDF)',
  h1: 'Mini amigurumi and crochet keychain patterns',
  description:
    'Small crochet patterns: amigurumi keychains, bag charms, mini toys and cases. Quick PDF patterns with instant download, many for beginners.',
  lead: 'Small makes are the quickest way to finish a project. These patterns are keychains, bag charms, mini toys and small cases. Each is a PDF you can download right after payment, and the free ones download without an account.',
  groups: [
    { id: 'keychains', title: 'Keychains and bag charms', intro: 'Small amigurumi you can attach to a key ring, a bag or a zipper.', terms: ['keychain', 'charm'], searchQ: 'keychain' },
    { id: 'mini-toys', title: 'Mini and tiny toys', intro: 'Palm-sized amigurumi that work up in an evening.', terms: ['mini', 'tiny', 'little'], searchQ: 'mini' },
    { id: 'cases', title: 'Cases and pouches', intro: 'Amigurumi pencil cases and glasses cases.', terms: ['case', 'pouch'], searchQ: 'case' },
    { id: 'ornaments', title: 'Ornaments and decorations', intro: 'Hanging ornaments and small decor toys.', terms: ['ornament', 'basket', 'cactus'], searchQ: 'ornament' },
  ],
  body: [
    { type: 'h2', text: `Why start with a keychain or a mini toy?` },
    {
      type: 'p',
      text: `A small project uses little yarn and teaches the same skills as a large toy: the [magic ring](/guides/how-to-make-a-magic-ring-crochet), increases, decreases, stuffing and sewing. You see the result quickly, so you learn from it and move on to a bigger pattern. Use a firm stitch and a hook smaller than the yarn label suggests, so the stuffing does not show.`,
    },
    { type: 'h2', text: `Finishing a keychain` },
    {
      type: 'p',
      text: `Attach a keychain ring or a clasp, then weave in the ends so nothing pulls loose. Our guides on [fastening off and weaving in ends](/guides/how-to-fasten-off-and-weave-in-ends) and [how to join limbs and sew on parts](/guides/how-to-join-limbs-and-sew-on-parts-amigurumi) cover the steps. If the charm is for a child, embroider the face and check the toy safety rules that apply where you live.`,
    },
    { type: 'h2', text: `More ways to browse` },
    {
      type: 'p',
      text: `Browse all [amigurumi crochet patterns](/shop/amigurumi), choose by animal in [amigurumi animals](/amigurumi-animals), or see the [crochet patterns for beginners](/crochet-patterns-for-beginners).`,
    },
  ],
  faq: [
    { q: 'How long does a crochet keychain take?', a: 'It depends on your speed and the pattern. Small keychains are among the quickest amigurumi, and a listing shows the skill level so you can pick a simple one.' },
    { q: 'What do I need to finish a keychain?', a: 'The yarn and hook in the materials list, stuffing, eyes or embroidery thread, a yarn needle and a keychain ring or clasp.' },
    { q: 'Are mini patterns good for beginners?', a: 'Many are, because they are small and use basic stitches. Check the skill level on each listing.' },
  ],
}

export const DRESSED_HUB: Hub = {
  path: '/amigurumi-in-clothes-and-hats',
  title: 'Amigurumi in Clothes: Dress, Sweater and Hat Crochet Patterns (PDF)',
  h1: 'Dressed amigurumi: crochet patterns with dresses, sweaters and hats',
  description:
    'Crochet patterns for amigurumi animals and dolls wearing dresses, sweaters, overalls, hats and scarves. PDF patterns with instant download.',
  lead: 'These toys come with a wardrobe: a bunny in a dress, a puppy in a sweater, a turtle in a sun hat. Each pattern is a PDF you can download right after payment, with a materials list and a skill level, and the free ones download without an account.',
  groups: [
    { id: 'dresses', title: 'Dresses and skirts', intro: 'Bunnies, bears, cats and ducks in dresses, with bows and ruffles.', terms: ['dress', 'sundress', 'skirt'], searchQ: 'dress' },
    { id: 'sweaters-and-outfits', title: 'Sweaters, overalls and outfits', intro: 'Toys dressed in knitted-look sweaters, overalls and small costumes.', terms: ['sweater', 'overalls', 'outfit', 'costume'], searchQ: 'sweater' },
    { id: 'hats-and-scarves', title: 'Hats, scarves and bonnets', intro: 'Sun hats, sailor hats, bonnets and winter scarves for small toys.', terms: ['scarf', 'bonnet', 'sun hat', 'sailor hat', 'orange hat', 'beanie', 'sporty cap'], searchQ: 'scarf' },
    { id: 'wearables-for-people', title: 'Crochet clothes for people', intro: 'Cardigans and other wearable patterns for you rather than a toy.', terms: ['cardigan', 'shawl'], searchQ: 'cardigan' },
  ],
  body: [
    { type: 'h2', text: `How do you crochet clothes for amigurumi?` },
    {
      type: 'p',
      text: `Most toy clothes are small flat or tubular pieces worked with the same hook as the toy. A dress is usually a tube of single crochet that grows with increases, a sweater is a tube with two small sleeves, and a hat is a half sphere. Making the clothes as separate pieces lets you take them off, which many people like for gifts.`,
    },
    { type: 'h2', text: `Yarn and hook for toy clothes` },
    {
      type: 'p',
      text: `Use a yarn that is thinner or the same weight as the toy so the clothes do not look bulky. Cotton and acrylic both work. Check your [gauge](/guides/crochet-gauge-swatch) on a small swatch, because clothes that are even a little too tight are hard to pull over the head. Our [yarn weight chart](/guides/yarn-weight-chart) and [hook size chart](/guides/crochet-hook-sizes-chart) show the matching hook for each yarn.`,
    },
    { type: 'h2', text: `Safety for toys with small parts` },
    {
      type: 'p',
      text: `Buttons, bows and loose accessories can come off. If the toy is for a baby or a young child, sew every piece on firmly or crochet it into the garment, and use [embroidered faces](/guides/how-to-embroider-faces-on-amigurumi) instead of hard eyes. Rules differ by country, so check the ones that apply where you live.`,
    },
    { type: 'h2', text: `More ways to browse` },
    {
      type: 'p',
      text: `Choose by animal in [amigurumi animals](/amigurumi-animals), see small makes in [mini amigurumi and keychains](/mini-amigurumi-and-keychains), or browse the [wearables category](/shop/wearables) and [crochet patterns for beginners](/crochet-patterns-for-beginners).`,
    },
  ],
  faq: [
    { q: 'Can I take the clothes off the toy?', a: 'It depends on the pattern. Many patterns make the clothes as separate pieces, and the listing and the pattern notes say how each one is built.' },
    { q: 'Are patterns with clothes harder than plain toys?', a: 'They add a few small pieces, so they are usually a step up from a basic toy. Each listing shows its skill level, and the beginner patterns page is a good place to start.' },
    { q: 'What yarn is best for crochet doll clothes?', a: 'A smooth cotton or acrylic yarn in the same weight as the toy or one size thinner. Follow the materials list in the pattern for the exact yarn and hook.' },
  ],
}
