import type { Guide } from '@/lib/guides'

export const readingPatternGuide: Guide = {
  slug: 'how-to-read-a-crochet-pattern',
  title: 'How to Read a Crochet Pattern: A Beginner Guide',
  description:
    'Learn how to read a crochet pattern step by step: the materials list, abbreviations, round counts, brackets and asterisks, explained for beginners.',
  datePublished: '2026-10-25',
  dateModified: '2026-10-25',
  author: 'Notion Creative Art',
  related: ['crochet-abbreviations-us-vs-uk'],
  body: [
    {
      type: 'p',
      text: 'A crochet pattern looks like code the first time you see it. It is really a recipe, written in a short, repeating style. Once you know the parts, you can read almost any pattern. This guide goes through a typical pattern from top to bottom.',
    },
    { type: 'h2', text: '1. Start with the information at the top' },
    {
      type: 'p',
      text: 'Before any stitches, a good pattern tells you the skill level, the finished size, the yarn and hook it uses, and whether it is written in US or UK terms. Read this first. If the yarn or hook is different from what you have, your finished piece will come out a different size.',
    },
    {
      type: 'ul',
      items: [
        'Skill level: beginner patterns use basic stitches; intermediate and advanced ones add shaping, colorwork or assembly.',
        'Materials: yarn weight, hook size, stuffing, safety eyes or other notions.',
        'Gauge or tension: how many stitches fit in a set width. It matters most for wearables. For toys, a tighter hook size simply keeps the stuffing hidden.',
        'Terms: check whether the pattern is US or UK. See our [US vs UK crochet terms chart](/guides/crochet-abbreviations-us-vs-uk).',
      ],
    },
    { type: 'h2', text: '2. Learn the abbreviations' },
    {
      type: 'p',
      text: 'Patterns shorten everything: "sc" for single crochet, "inc" for increase, "dec" for decrease. A list of abbreviations is usually at the start of the pattern. Keep it open while you work until the common ones feel natural.',
    },
    { type: 'h2', text: '3. Read each line as a round or a row' },
    {
      type: 'p',
      text: 'Each line is one round (worked in a circle) or one row (worked back and forth). Toys are mostly worked in rounds. A line looks like this:',
    },
    { type: 'note', text: 'Rnd 3: (sc 1, inc) x 6 (18)' },
    {
      type: 'ol',
      items: [
        '"Rnd 3" means the third round.',
        '"(sc 1, inc) x 6" means: work one single crochet, then one increase, and repeat that group six times.',
        '"(18)" is the total number of stitches you should have at the end of the round. Count them every time.',
      ],
    },
    { type: 'h2', text: '4. Brackets, asterisks and repeats' },
    {
      type: 'ul',
      items: [
        'Round brackets ( ) group stitches. A number after them tells you how many times to repeat the group.',
        'Asterisks * * mark a section to repeat. "Repeat from * to end" means go back to the first asterisk and work that part again until the round is finished.',
        'A range like "Rnds 5-9" means work the same instructions for each of those rounds.',
      ],
    },
    { type: 'h2', text: '5. Follow the shaping and assembly notes' },
    {
      type: 'p',
      text: 'Toy patterns list the body parts one at a time (head, ears, arms, legs) and then say how to join them. Work the pieces in order, leave a long tail of yarn where the pattern says "leave a long tail", and stuff each piece before closing it. Small details like eyes and noses are usually added last.',
    },
    { type: 'h2', text: 'Tips that save time' },
    {
      type: 'ul',
      items: [
        'Use a stitch marker in the first stitch of each round so you do not lose your place.',
        'Count the stitches at the end of every round, not only when something looks wrong.',
        'Tick off each round as you finish it, or highlight your place if you use a PDF on a tablet.',
        'If a stitch count does not match, rip back to the last round that was correct.',
      ],
    },
    {
      type: 'p',
      text: 'Ready to practice? Try a beginner pattern from our [free crochet patterns](/free-crochet-patterns) or browse [amigurumi patterns](/shop/amigurumi). Each pattern page lists its skill level and materials before you download.',
    },
  ],
  faq: [
    {
      q: 'What does the number in brackets at the end of a round mean?',
      a: 'It is the total number of stitches you should have after finishing that round. Counting it each round is the easiest way to catch a mistake early.',
    },
    {
      q: 'Do I need to know every abbreviation before I start?',
      a: 'No. Most patterns list the abbreviations they use at the top. Keep that list beside you and the common ones will stick quickly.',
    },
  ],
}
