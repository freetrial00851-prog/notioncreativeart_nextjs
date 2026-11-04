import type { CategoryContent } from '@/lib/categoryContent'

/** Text under the pattern grid on /shop (all patterns). Same block format as the category essays. */
export const allPatternsContent: CategoryContent = {
  slug: 'all-patterns',
  body: [
    { type: 'h2', text: `Crochet patterns in PDF: what you can find in the shop` },
    {
      type: 'p',
      text: `The shop sells crochet patterns as instant PDF downloads, and most of them are amigurumi, the Japanese art of crocheting small stuffed toys. Use the filters to narrow the list by category, skill level or price, or read on for the quickest ways to find the right pattern.`,
    },
    { type: 'h2', text: `Shop by skill level` },
    {
      type: 'p',
      text: `Every pattern shows its skill level, and you can filter the shop by it: [beginner patterns](/shop?level=beginner), [intermediate patterns](/shop?level=intermediate) or [advanced patterns](/shop?level=advanced). If you are not sure where you fit, read how [crochet skill levels are explained](/guides/crochet-skill-levels-explained), or start with the [crochet patterns for beginners](/crochet-patterns-for-beginners).`,
    },
    { type: 'h2', text: `Shop by type and size` },
    {
      type: 'ul',
      items: [
        `Keychains and bag charms: the smallest and quickest makes. Browse the [keychain patterns](/search?q=keychain).`,
        `Mini toys: small amigurumi that work up in an evening. See the [mini patterns](/search?q=mini).`,
        `Plush toys: larger, softer toys in plush or velvet yarn. See the [plush patterns](/search?q=plush).`,
        `Sets: matching pairs and trios in one pattern. See the [pattern sets](/search?q=set).`,
        `No-sew patterns: worked in one piece or with very little sewing. See the [no-sew amigurumi patterns](/shop/no-sew-amigurumi).`,
      ],
    },
    { type: 'h2', text: `What is in a pattern PDF` },
    {
      type: 'p',
      text: `Each pattern is a PDF with written instructions and a materials list, and the listing shows its page count and skill level. You can print the PDF or follow it on a phone or tablet. The PDF is available to download right after payment, and a link is also emailed to you. Free patterns download without an account.`,
    },
    { type: 'h2', text: `Yarn and hook for these patterns` },
    {
      type: 'p',
      text: `Each listing names the yarn and hook size the pattern was written for. Toys are usually crocheted with a smaller hook than the yarn label suggests, so the stuffing does not show through the stitches. For help choosing, see the [best yarn for amigurumi](/guides/best-yarn-for-amigurumi), the [hook sizes chart](/guides/crochet-hook-sizes-chart) and the [yarn weight chart](/guides/yarn-weight-chart).`,
    },
    { type: 'h2', text: `Free crochet patterns` },
    {
      type: 'p',
      text: `Want to try the style first? The [free crochet patterns](/free-crochet-patterns) are complete PDFs that download without an account, and many are beginner friendly.`,
    },
  ],
  faq: [
    {
      q: `How tall are the finished toys?`,
      a: `It depends on the pattern, the yarn and the hook. Listings range from tiny charms to plush toys, and a listing gives the finished size when its pattern states one.`,
    },
    {
      q: `Can I change the yarn?`,
      a: `Yes. A thicker yarn and a bigger hook make a bigger toy, and a thinner yarn makes a smaller one. Keep the fabric tight so the stuffing does not show. See how to make amigurumi bigger or smaller.`,
    },
    {
      q: `Do the patterns use US or UK terms?`,
      a: `The Details tab on each listing states the terms used. Our chart of US and UK crochet abbreviations shows how the stitch names differ.`,
    },
    {
      q: `Which patterns suit a first project?`,
      a: `Start with a beginner-level pattern. Keychains and small toys are quick, and a free pattern lets you try the style at no cost.`,
    },
  ],
}
