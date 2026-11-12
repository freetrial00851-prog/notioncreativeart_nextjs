import type { Hub } from './hubs'

/**
 * One landing page per animal, under /amigurumi-animals/[animal].
 * Each is a Hub rendered by ProductHub: the matching patterns come from the catalogue by title terms,
 * and the text below is written for that animal, so the pages are not interchangeable.
 */

const PARENT = { name: 'Amigurumi animals', path: '/amigurumi-animals' }

export const ANIMAL_HUBS: Hub[] = [
  {
    path: '/amigurumi-animals/bunny',
    parent: PARENT,
    title: 'Bunny Amigurumi Crochet Patterns (PDF Download)',
    h1: 'Bunny amigurumi: crochet rabbit patterns',
    description:
      'Crochet bunny and rabbit patterns: floppy-ear plush bunnies, tiny charms and bunnies in dresses. PDF patterns with instant download.',
    lead: 'Bunnies are the most popular amigurumi animal, and the range is wide: palm-sized charms, chenille plush rabbits with floppy ears and bunnies in dresses. Every pattern is a PDF you can download right after payment.',
    groups: [
      { id: 'bunny-patterns', title: 'Bunny and rabbit crochet patterns', intro: 'Choose by size, ears and outfit. Each listing shows its skill level and materials.', terms: ['bunny', 'bunnies', 'rabbit'], searchQ: 'bunny' },
    ],
    body: [
      { type: 'h2', text: `Floppy ears or upright ears?` },
      {
        type: 'p',
        text: `The ears decide how a bunny looks and how it is made. Long floppy ears are worked as flat or lightly stuffed tubes and sewn to the side of the head, which makes a soft, cuddly rabbit. Upright ears are usually stuffed lightly or left flat and sewn on top. Many patterns join the ears as you crochet the head, which saves sewing. Check the photos and the description to see which style a pattern uses.`,
      },
      { type: 'h2', text: `Yarn and size` },
      {
        type: 'p',
        text: `A chenille or velvet yarn gives a soft, plush rabbit and works up quickly on a larger hook. A smooth cotton gives a neater, smaller bunny with clear stitches. If you want to change the size, the [guide to making amigurumi bigger or smaller](/guides/how-to-make-amigurumi-bigger-or-smaller) explains how yarn and hook change the result.`,
      },
      { type: 'h2', text: `Making a bunny for a baby` },
      {
        type: 'p',
        text: `For a baby or a young child, use [embroidered eyes](/guides/how-to-embroider-faces-on-amigurumi) instead of hard eyes, and sew every part on firmly. The guide to [safety eyes](/guides/safety-eyes-for-amigurumi) covers the options. For help with assembly, read [how to join limbs and sew on parts](/guides/how-to-join-limbs-and-sew-on-parts-amigurumi).`,
      },
      { type: 'h2', text: `More ways to browse` },
      {
        type: 'p',
        text: `See all [amigurumi animals](/amigurumi-animals), the [dressed amigurumi patterns](/amigurumi-in-clothes-and-hats), or the [crochet patterns for beginners](/crochet-patterns-for-beginners).`,
      },
    ],
    faq: [
      { q: 'Which bunny pattern is best for a beginner?', a: 'A small, round bunny with few parts is the easiest. Look for a beginner skill level on the listing and for ears that are crocheted as part of the head.' },
      { q: 'How big is a crocheted bunny?', a: 'It depends on the pattern, the yarn and the hook. The listings range from small charms to large plush rabbits, and a description gives the finished size when the pattern states it.' },
      { q: 'Can I sell bunnies I make from these patterns?', a: 'Each pattern is for personal use, and you may sell the finished items you make. Please do not copy, share or resell the pattern file itself.' },
    ],
  },
  {
    path: '/amigurumi-animals/bear',
    parent: PARENT,
    title: 'Teddy Bear Amigurumi Crochet Patterns (PDF)',
    h1: 'Teddy bear amigurumi: crochet bear patterns',
    description:
      'Crochet teddy bear, panda and koala patterns: classic plush bears, bears in outfits and small bear charms. PDF patterns, instant download.',
    lead: 'From a classic teddy to a panda or a koala, bears are a gentle first toy to crochet and a favourite gift. Every pattern is a PDF you can download right after payment, with a materials list and a skill level.',
    groups: [
      { id: 'bear-patterns', title: 'Teddy bear, panda and koala crochet patterns', intro: 'Bears in plain yarn, bears in outfits and bear charms.', terms: ['teddy', 'bear', 'panda', 'koala'], searchQ: 'teddy' },
    ],
    body: [
      { type: 'h2', text: `What makes a good bear pattern?` },
      {
        type: 'p',
        text: `A bear is built from a few simple shapes: a round head, a rounded body, short limbs and small ears. The muzzle gives the face its character, so look for a pattern that explains how to shape and place it. A pattern with clear stitch counts and photos for the face makes the result look right.`,
      },
      { type: 'h2', text: `Sewn limbs or jointed limbs` },
      {
        type: 'p',
        text: `Some bears have limbs sewn flat to the body, and some are jointed so the arms and legs turn. Jointed bears need discs or similar hardware and are a step up in skill. Sewn limbs are easier and safer for small children. The guide to [joining limbs and sewing on parts](/guides/how-to-join-limbs-and-sew-on-parts-amigurumi) shows how to attach them neatly.`,
      },
      { type: 'h2', text: `Stuffing and shape` },
      {
        type: 'p',
        text: `Firm, even stuffing keeps a bear's round shape. Add stuffing in small pieces and press it into the corners before you close the piece. Our guide to [stuffing and assembling amigurumi](/guides/how-to-stuff-and-assemble-amigurumi) covers it, and the [face placement guide](/guides/amigurumi-face-placement-and-expression) helps the bear look friendly.`,
      },
      { type: 'h2', text: `More ways to browse` },
      {
        type: 'p',
        text: `See all [amigurumi animals](/amigurumi-animals), choose by [bunny](/amigurumi-animals/bunny) or [cat](/amigurumi-animals/cat), or browse the [dressed amigurumi patterns](/amigurumi-in-clothes-and-hats).`,
      },
    ],
    faq: [
      { q: 'Is a teddy bear a good first amigurumi?', a: 'Yes, if it is a simple one. A round bear with sewn limbs and an embroidered face uses basic stitches. Check the skill level on each listing.' },
      { q: 'Can I crochet a bear without sewing?', a: 'Some patterns join the limbs and ears as you crochet, which cuts the sewing down. The description says how the toy is built.' },
      { q: 'Are the bear patterns safe for babies?', a: 'Use embroidered eyes and secure every part firmly. If a pattern uses small parts, the listing or the PDF says so.' },
    ],
  },
  {
    path: '/amigurumi-animals/cat',
    parent: PARENT,
    title: 'Cat Amigurumi Crochet Patterns (PDF Download)',
    h1: 'Cat amigurumi: crochet cat and kitten patterns',
    description:
      'Crochet cat and kitten patterns: sitting cats, mermaid cats, fruit cats and tiny cat charms. PDF patterns with instant download.',
    lead: 'Cats and kittens come in every style here, from a classic sitting cat to a mermaid cat or an avocado cat. Every pattern is a PDF you can download right after payment, with a skill level and a materials list.',
    groups: [
      { id: 'cat-patterns', title: 'Cat and kitten crochet patterns', intro: 'Sitting cats, cats in costumes and cats as fun characters.', terms: ['cat', 'kitten', 'kitty'], searchQ: 'cat' },
    ],
    body: [
      { type: 'h2', text: `What to look for in a cat pattern` },
      {
        type: 'p',
        text: `A cat is recognised by its ears, its tail and its face. Pointed ears are usually small triangles or flat pieces sewn on, and a tail can be a simple stuffed tube. Whiskers are normally embroidered with a few straight stitches. The [face placement guide](/guides/amigurumi-face-placement-and-expression) shows how the position of the eyes and nose changes the expression.`,
      },
      { type: 'h2', text: `Sitting, standing or lying` },
      {
        type: 'p',
        text: `A sitting cat is the easiest to make and to display, because the body is one rounded shape. A standing or posed cat needs longer limbs and sometimes wire or weight. If you want to pose a toy, read how to [make amigurumi sit, stand or pose](/guides/make-amigurumi-sit-stand-or-pose).`,
      },
      { type: 'h2', text: `Colours and patterns` },
      {
        type: 'p',
        text: `Two-tone cats, tabby stripes and patches use colour changes. A clean change is easier with the [colour change guide](/guides/how-to-change-colors-in-crochet). Single-colour cats are a good start if you are new to the craft.`,
      },
      { type: 'h2', text: `More ways to browse` },
      {
        type: 'p',
        text: `See all [amigurumi animals](/amigurumi-animals), the [bear patterns](/amigurumi-animals/bear), the [mini amigurumi and keychains](/mini-amigurumi-and-keychains), or the [crochet patterns for beginners](/crochet-patterns-for-beginners).`,
      },
    ],
    faq: [
      { q: 'Which cat pattern is easiest?', a: 'A simple sitting cat in one colour, with a beginner skill level on the listing, is the easiest to start with.' },
      { q: 'Do the cat patterns use US or UK terms?', a: 'Each listing says which terms it uses. If you work in UK terms, our guide to US and UK crochet terms explains the differences.' },
      { q: 'Can I make a cat as a keychain?', a: 'Yes. Several patterns are small enough for a bag charm, and the mini amigurumi and keychains page collects them.' },
    ],
  },
  {
    path: '/amigurumi-animals/dog',
    parent: PARENT,
    title: 'Dog Amigurumi Crochet Patterns: Puppy, Dachshund',
    h1: 'Dog amigurumi: crochet puppy and dog patterns',
    description:
      'Crochet dog and puppy patterns: dachshunds, poodles, floppy-ear puppies and dressed dogs. PDF patterns with instant download.',
    lead: 'Puppies, dachshunds, poodles and more. Dogs are easy to recognise and fun to dress, and every pattern here is a PDF you can download right after payment, with a skill level and a materials list.',
    groups: [
      { id: 'dog-patterns', title: 'Dog and puppy crochet patterns', intro: 'Floppy-ear puppies, breed dogs and dogs in sweaters.', terms: ['puppy', 'puppies', 'dog', 'dachshund', 'corgi', 'pug', 'poodle', 'beagle'], searchQ: 'dog' },
    ],
    body: [
      { type: 'h2', text: `Ears, snout and breed` },
      {
        type: 'p',
        text: `A dog is defined by its ears and its muzzle. A puppy has long floppy ears and a short rounded snout. A dachshund has a long body, and a poodle is shown with fluffy pompoms on the head, ears, feet and tail. The muzzle is often made as a separate piece and sewn on, which lets you shape the nose and mouth.`,
      },
      { type: 'h2', text: `Fluffy and textured finishes` },
      {
        type: 'p',
        text: `Some dog patterns use a fluffy chenille yarn or a loop stitch to give a curly coat. Working with two yarns, a smooth one for the body and a fluffy one for the details, is common for poodles. Take your time with the yarn changes and read the pattern notes first, and see the guide on [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern) if a term is new.`,
      },
      { type: 'h2', text: `Dogs in clothes` },
      {
        type: 'p',
        text: `Many dog patterns come with a sweater, dungarees or a scarf. Clothes add small pieces, so they are a step up from a plain dog. See the [dressed amigurumi patterns](/amigurumi-in-clothes-and-hats) for more, and check the yarn weight against the toy so the clothes fit.`,
      },
      { type: 'h2', text: `More ways to browse` },
      {
        type: 'p',
        text: `See all [amigurumi animals](/amigurumi-animals), the [cat patterns](/amigurumi-animals/cat), the [horse patterns](/amigurumi-animals/horse), or the [mini amigurumi and keychains](/mini-amigurumi-and-keychains).`,
      },
    ],
    faq: [
      { q: 'Which dog pattern is best for a beginner?', a: 'A simple puppy with a short snout and floppy ears is the easiest. A dachshund or a poodle usually needs more shaping or two yarns.' },
      { q: 'Does the pattern include the clothes?', a: 'When a dog wears a sweater or dungarees, the listing says so and the PDF includes the clothes pattern.' },
      { q: 'Can I make a dog in a different colour?', a: 'Yes. Any pattern can be made in other colours. Choose yarn of the same weight as the pattern asks for.' },
    ],
  },
  {
    path: '/amigurumi-animals/horse',
    parent: PARENT,
    title: 'Horse and Pony Amigurumi Crochet Patterns (PDF)',
    h1: 'Horse and pony amigurumi: crochet patterns',
    description:
      'Crochet horse and pony patterns with curly manes, bridles, overalls and outfits. PDF patterns with instant download.',
    lead: 'Horses and ponies with curly manes, hooves and tiny outfits. Every pattern here is a PDF you can download right after payment, with a materials list and a skill level.',
    groups: [
      { id: 'horse-patterns', title: 'Horse and pony crochet patterns', intro: 'Ponies with manes, bridles and removable clothes.', terms: ['horse', 'pony', 'unicorn'], searchQ: 'horse' },
    ],
    body: [
      { type: 'h2', text: `How is a crochet mane made?` },
      {
        type: 'p',
        text: `The mane and tail give a horse its character. Common methods are twisted chain loops for a curly mane, loops of yarn pulled through the stitches and cut into fringe, and a few long strands for a tail. Each method gives a different look, so read the pattern notes before you start.`,
      },
      { type: 'h2', text: `Legs and hooves` },
      {
        type: 'p',
        text: `A horse has long legs for its size. Many patterns work the legs and body as one piece, and some add a darker colour for the hooves with a colour change. Joining the limbs as you go saves sewing. The guide on [joining limbs and sewing on parts](/guides/how-to-join-limbs-and-sew-on-parts-amigurumi) explains the options.`,
      },
      { type: 'h2', text: `Bridles, saddles and clothes` },
      {
        type: 'p',
        text: `Some ponies come with a bridle, a saddle or overalls. These are small pieces, so they add time but not much difficulty. If the toy is for a child, sew accessories on firmly. See the [dressed amigurumi patterns](/amigurumi-in-clothes-and-hats) for ponies in outfits.`,
      },
      { type: 'h2', text: `More ways to browse` },
      {
        type: 'p',
        text: `See all [amigurumi animals](/amigurumi-animals), the [dog patterns](/amigurumi-animals/dog), the [teddy bear patterns](/amigurumi-animals/bear), or the [crochet patterns for beginners](/crochet-patterns-for-beginners).`,
      },
    ],
    faq: [
      { q: 'Are horse patterns hard?', a: 'They have more parts than a round animal, so they are usually intermediate. Check the skill level and the description on each listing.' },
      { q: 'Can the clothes come off?', a: 'Some patterns make the overalls or outfit as separate pieces so you can take them off. The description says which ones do.' },
      { q: 'What yarn gives a good mane?', a: 'The pattern names the yarn. A slightly fluffy or curly-looking yarn gives a fuller mane, and a smooth yarn gives clear loops.' },
    ],
  },
  {
    path: '/amigurumi-animals/frog',
    parent: PARENT,
    title: 'Frog Amigurumi Crochet Patterns (PDF Download)',
    h1: 'Frog amigurumi: crochet frog patterns',
    description:
      'Crochet frog patterns: easy green frogs with big eyes, dangly legs and tiny frog charms. Beginner-friendly PDF patterns, instant download.',
    lead: 'A frog is one of the friendliest first toys to crochet: a round green body, two big eyes and a wide smile. Every pattern here is a PDF you can download right after payment.',
    groups: [
      { id: 'frog-patterns', title: 'Frog crochet patterns', intro: 'Easy frogs, dangly-leg frogs and small frog toys.', terms: ['frog'], searchQ: 'frog' },
    ],
    body: [
      { type: 'h2', text: `Why a frog is a good first amigurumi` },
      {
        type: 'p',
        text: `The body is a simple rounded shape, the face needs only a wide smile and two eyes, and the legs are small, so a frog uses basic stitches and a [magic ring](/guides/how-to-make-a-magic-ring-crochet). It is a good project to learn increases and decreases, and it finishes quickly.`,
      },
      { type: 'h2', text: `The eyes make the frog` },
      {
        type: 'p',
        text: `Frog eyes sit on top of the head. Some patterns crochet the eye bumps and add felt or safety eyes, and some use a single piece for each eye. The position changes the whole face, so use the [face placement guide](/guides/amigurumi-face-placement-and-expression) and pin the eyes before you attach them.`,
      },
      { type: 'h2', text: `Dangly legs and sitting poses` },
      {
        type: 'p',
        text: `Long dangly legs let a frog sit on a shelf edge or a planter. A frog with short folded legs sits flat on a table. See how to [make amigurumi sit, stand or pose](/guides/make-amigurumi-sit-stand-or-pose) for ideas.`,
      },
      { type: 'h2', text: `More ways to browse` },
      {
        type: 'p',
        text: `See all [amigurumi animals](/amigurumi-animals), the [mini amigurumi and keychains](/mini-amigurumi-and-keychains), or the [crochet patterns for beginners](/crochet-patterns-for-beginners).`,
      },
    ],
    faq: [
      { q: 'Is a frog a good pattern for beginners?', a: 'Yes. A simple frog with a one-piece body uses basic stitches and is a common first amigurumi.' },
      { q: 'What yarn colours work for a frog?', a: 'Green is classic, but any colour works. Add a lighter colour for the belly or speckles if the pattern includes them.' },
      { q: 'Can I make a frog without safety eyes?', a: 'Yes. Most patterns allow embroidered or felt eyes, which is the safer choice for babies.' },
    ],
  },
  {
    path: '/amigurumi-animals/fox',
    parent: PARENT,
    title: 'Fox Amigurumi Crochet Patterns (PDF Download)',
    h1: 'Fox amigurumi: crochet fox patterns',
    description:
      'Crochet fox patterns: woodland foxes with bushy tails, pointed ears and white chests. PDF patterns with instant download.',
    lead: 'Foxes are a favourite woodland animal: pointed ears, a white muzzle and a big bushy tail. Every pattern here is a PDF you can download right after payment, with a skill level and a materials list.',
    groups: [
      { id: 'fox-patterns', title: 'Fox crochet patterns', intro: 'Woodland foxes and foxes in outfits.', terms: ['fox'], searchQ: 'fox' },
    ],
    body: [
      { type: 'h2', text: `What makes a fox look like a fox` },
      {
        type: 'p',
        text: `Three things: pointed ears, a pale muzzle and chest, and a large tail with a light tip. The tail is usually worked in two colours, so a fox is a good place to practise a clean colour change with the [colour change guide](/guides/how-to-change-colors-in-crochet).`,
      },
      { type: 'h2', text: `Shaping the ears and tail` },
      {
        type: 'p',
        text: `Fox ears are small triangles, often made flat and sewn on top of the head. The tail is stuffed lightly so it keeps a soft, curved shape. Read the pattern notes for the stuffing amount, and see how to [stuff and assemble amigurumi](/guides/how-to-stuff-and-assemble-amigurumi).`,
      },
      { type: 'h2', text: `Colour choices` },
      {
        type: 'p',
        text: `Orange, cream and dark brown are the classic colours, but you can make a grey or white fox too. Keep the yarn weight the same as the pattern. The [yarn weight chart](/guides/yarn-weight-chart) explains the terms.`,
      },
      { type: 'h2', text: `More ways to browse` },
      {
        type: 'p',
        text: `See all [amigurumi animals](/amigurumi-animals), the [bear patterns](/amigurumi-animals/bear), the [bunny patterns](/amigurumi-animals/bunny), or the [crochet patterns for beginners](/crochet-patterns-for-beginners).`,
      },
    ],
    faq: [
      { q: 'Is a fox pattern easy?', a: 'It depends on the pattern. A simple fox with sewn ears and a basic tail suits an advanced beginner. Check the skill level on the listing.' },
      { q: 'How do I make a two-colour tail?', a: 'Change colour at the stitch where the pattern says. The colour change guide shows how to keep the join neat.' },
      { q: 'Can I make a fox in other colours?', a: 'Yes. Pick yarn of the same weight and keep the light and dark parts in contrast.' },
    ],
  },
  {
    path: '/amigurumi-animals/ducks-and-birds',
    parent: PARENT,
    title: 'Duck, Goose and Bird Amigurumi Crochet Patterns',
    h1: 'Duck, goose and bird amigurumi: crochet patterns',
    description:
      'Crochet duck, goose, chicken, owl and bird patterns: plush ducks, lovey geese, hens and owls. PDF patterns with instant download.',
    lead: 'Ducks, geese, chicks, hens and owls. Birds are rounded and quick to shape, and many make good baby gifts. Every pattern here is a PDF you can download right after payment.',
    groups: [
      { id: 'bird-patterns', title: 'Duck, goose, hen and owl crochet patterns', intro: 'Plush birds, comforters and farm birds.', terms: ['duck', 'duckling', 'goose', 'gosling', 'chick', 'hen', 'chicken', 'owl', 'bird', 'penguin'], searchQ: 'duck' },
    ],
    body: [
      { type: 'h2', text: `Beaks, wings and feet` },
      {
        type: 'p',
        text: `A bird is a round body with a small beak, two wings and feet. Beaks are often made in a contrasting yarn on a smaller hook, and wings can be flat pieces sewn on or joined as you crochet. The feet decide whether the bird stands or sits, so check the photos.`,
      },
      { type: 'h2', text: `Comforters and plush birds` },
      {
        type: 'p',
        text: `Some birds are made as soft comforters with a flat body and a plush head, and some are rounded toys. A lovey is made to be held, so use a soft yarn and embroidered eyes. See the guide on [safety eyes](/guides/safety-eyes-for-amigurumi) for baby-safe options.`,
      },
      { type: 'h2', text: `Hens, owls and farm birds` },
      {
        type: 'p',
        text: `Hens have a comb and wattles, and owls have ear tufts and large eyes. These small details are usually separate pieces. Take your time with the [face placement guide](/guides/amigurumi-face-placement-and-expression), because eye position changes the look a lot.`,
      },
      { type: 'h2', text: `More ways to browse` },
      {
        type: 'p',
        text: `See all [amigurumi animals](/amigurumi-animals), the [frog patterns](/amigurumi-animals/frog), the [mini amigurumi and keychains](/mini-amigurumi-and-keychains), or the [crochet patterns for beginners](/crochet-patterns-for-beginners).`,
      },
    ],
    faq: [
      { q: 'Which bird pattern is easiest?', a: 'A small round bird or chick in one yarn with a simple beak is the easiest. Check the skill level on each listing.' },
      { q: 'Are bird patterns good for babies?', a: 'Comforter and lovey patterns are made for babies. Use embroidered eyes and secure every part, as the listing and PDF advise.' },
      { q: 'Can I change the bird colour?', a: 'Yes. Any pattern can be made in another colour. Keep the yarn weight the same.' },
    ],
  },
]

export function getAnimalHub(slug: string): Hub | undefined {
  return ANIMAL_HUBS.find((h) => h.path === `/amigurumi-animals/${slug}`)
}

export const ANIMAL_SLUGS = ANIMAL_HUBS.map((h) => h.path.split('/').pop() as string)
