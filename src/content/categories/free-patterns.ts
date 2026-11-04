import type { CategoryContent } from '@/lib/categoryContent'

/** Text under the pattern grid on /free-crochet-patterns. Same block format as the category essays. */
export const freePatternsContent: CategoryContent = {
  slug: 'free-patterns',
  body: [
    { type: 'h2', text: `Free crochet patterns: how to choose and download one` },
    {
      type: 'p',
      text: `Free crochet patterns are a good way to try a designer's style before you buy anything. Every pattern on this page is a free PDF that you can download right away, with no account and no sign-up, and most are amigurumi animals and small keychains.`,
    },
    { type: 'h2', text: `How to choose a free pattern` },
    {
      type: 'ul',
      items: [
        `Check the skill level. Each pattern shows it, and you can filter this page by beginner, intermediate or advanced.`,
        `Read the materials list. It names the yarn and hook size the pattern was written for, so you know what to buy before you start.`,
        `Pick a small project first. A keychain or a mini toy works up quickly and shows you how the pattern is written.`,
        `Look at the finished size. It depends on your yarn and hook, so a thicker yarn makes a bigger toy.`,
      ],
    },
    {
      type: 'p',
      text: `New to crochet? Start with the [crochet patterns for beginners](/crochet-patterns-for-beginners) and read [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern) before your first free download.`,
    },
    { type: 'h2', text: `How to download a free pattern` },
    {
      type: 'ol',
      items: [
        `Open the pattern you like.`,
        `Press the free download button. You do not need to sign in.`,
        `Save the PDF. You can print it or follow it on a phone or tablet while you crochet.`,
      ],
    },
    { type: 'h2', text: `A first free pattern: a simple plan` },
    {
      type: 'p',
      text: `Read the whole pattern once before you pick up the hook. Gather the yarn, a hook, stuffing, safety eyes or embroidery thread and a yarn needle. Learn the [magic ring](/guides/how-to-make-a-magic-ring-crochet) if the pattern starts with one, and count your stitches at the end of each round. When the toy is done, sew on the parts and [weave in the ends](/guides/how-to-fasten-off-and-weave-in-ends).`,
    },
    { type: 'h2', text: `Free and paid patterns` },
    {
      type: 'p',
      text: `The free patterns are complete PDFs, so you can make a toy without paying. If you like the style, the [full shop](/shop) has many more patterns, including [amigurumi patterns](/shop/amigurumi) and [no-sew amigurumi](/shop/no-sew-amigurumi). Each listing shows what is included, so read the description to pick the pattern you want.`,
    },
    { type: 'h2', text: `Safety note for toys made for children` },
    {
      type: 'p',
      text: `If you give a crocheted toy to a baby or toddler, embroider the face instead of using safety eyes and check the toy safety rules that apply where you live. See our guides to [safety eyes](/guides/safety-eyes-for-amigurumi) and [embroidering faces](/guides/how-to-embroider-faces-on-amigurumi).`,
    },
  ],
  faq: [
    {
      q: `Do I need an account to download a free crochet pattern?`,
      a: `No. Free patterns download without an account or sign-up. A free account is optional and keeps your downloads together.`,
    },
    {
      q: `Can I print a free pattern?`,
      a: `Yes. The pattern is a PDF, so you can print it or follow it on a phone or tablet.`,
    },
    {
      q: `Which free pattern should I start with?`,
      a: `Choose a beginner-level pattern with a small size, such as a keychain. Check its materials list and read it through before you begin.`,
    },
    {
      q: `What yarn do I need for a free pattern?`,
      a: `Each pattern lists the yarn and hook size it was written for. Our guides on yarn for amigurumi and hook sizes help if you want to substitute.`,
    },
  ],
}
