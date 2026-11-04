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
