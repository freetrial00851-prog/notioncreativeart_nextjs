import type { CategoryContent } from '@/lib/categoryContent'

export const accessoriesContent: CategoryContent = {
  slug: 'accessories',
  body: [
    { type: 'h2', text: `Crochet accessories patterns: small makes that look polished` },
    {
      type: 'p',
      text: `Crochet accessories patterns turn leftover yarn into keychains, bag charms, scrunchies, bookmarks and hair clips that take one evening instead of one month. The speed is easy. The polish comes from tight stitches, a loop that cannot pull out and edges that lie flat, and this page shows exactly how to get each one right, with real stitch counts, hook sizes and fixes.`,
    },
    { type: 'h2', text: `Which crochet accessory should you make first?` },
    {
      type: 'p',
      text: `Pick by time and by how much yarn you have. These figures are approximate and shift with tension and size.`,
    },
    {
      type: 'table',
      caption: `Accessory ideas at a glance (all numbers approximate)`,
      head: [`Accessory`, `Time`, `Yarn`, `Hook`, `Skill`],
      rows: [
        [`Bookmark`, `30 to 60 minutes`, `10 to 15 m of fingering or sport weight`, `2.0 to 2.5 mm`, `Beginner`],
        [`Hair scrunchie`, `45 to 90 minutes`, `25 to 40 m of worsted weight`, `4.0 to 5.0 mm`, `Beginner`],
        [`Hair clip bow`, `30 to 60 minutes`, `8 to 12 m of DK weight`, `3.0 to 3.5 mm`, `Beginner`],
        [`Keychain or bag charm`, `1 to 2 hours`, `15 to 25 m of cotton, sport or DK`, `2.0 to 2.5 mm`, `Beginner to intermediate`],
        [`Headband`, `1.5 to 2.5 hours`, `60 to 90 m of worsted weight`, `4.0 to 5.0 mm`, `Beginner`],
        [`Zip coin pouch`, `2 to 3 hours`, `40 to 60 m of cotton`, `2.5 to 3.0 mm`, `Intermediate`],
      ],
    },
    {
      type: 'p',
      text: `Never finished a project? Start with the bookmark. Want a gift this weekend? Make the scrunchie.`,
    },
    { type: 'h2', text: `How to crochet a scrunchie over a hair elastic` },
    {
      type: 'p',
      text: `Crocheting directly over the elastic is the simplest method, because there is no sewing and the elastic is locked in. You need a standard hair elastic, about 30 to 40 m of worsted weight yarn and a 4.5 mm hook. Stitch counts below depend on your elastic, so treat them as a guide and adjust.`,
    },
    {
      type: 'ol',
      items: [
        `Make a slip knot, hold the elastic like a ring, and work single crochet around it, covering the elastic completely. Space the stitches snugly. Most standard elastics take 36 to 44. Join with a slip stitch to the first stitch.`,
        `Round 2: chain 2 and work 2 half double crochet into every stitch. You now have roughly 72 to 88 stitches. This doubling is what creates the gathered, ruffled look. Join.`,
        `Round 3: chain 2 and work 1 half double crochet in every stitch. Join.`,
        `Repeat round 3 once or twice more. Three or four rounds in total gives a full scrunchie; each extra round makes it wider and floppier.`,
        `Fasten off, leaving a 15 cm tail, and weave it in through the stitches in two directions. Then give the elastic a gentle stretch to settle the ruffles.`,
      ],
    },
    {
      type: 'p',
      text: `If your scrunchie cups into a bowl instead of lying in a frill, you have too few stitches in round 2. If it ripples wildly and will not gather, you have too many. Rip back to round 2 and adjust by about ten stitches.`,
    },
    { type: 'h2', text: `How to make a crochet keychain with a loop that will not pull out` },
    {
      type: 'p',
      text: `A keychain or bag charm is usually a tiny toy, a flower or a fruit, around 5 to 8 cm tall. Use cotton or a smooth acrylic in sport or DK weight and a hook one or two sizes smaller than the label suggests, for example 2.0 mm. Dense fabric keeps stuffing hidden and survives a bag or pocket.`,
    },
    {
      type: 'ol',
      items: [
        `Make the body from the pattern and stuff it firmly before closing, pushing the fiberfill into every corner with a pencil or the blunt end of your hook.`,
        `For a built-in loop, close the top round, then chain 10 and slip stitch back into the same stitch you started from.`,
        `Work 12 to 14 single crochet around the chain, going into the chain space, not just the back bumps. This thickens the loop into a small solid ring that will not stretch or fray.`,
        `Slip stitch into the body to anchor it, fasten off and weave the tail through the body, not just the loop.`,
        `Open a split ring or a lobster clasp and pass it through the loop. Close it, and tug firmly to test before you give it away.`,
      ],
    },
    {
      type: 'p',
      text: `Chain-only loops are the number one reason charms fail. A single strand of chain stretches and thins with every tug of a bag zipper. If a pattern ends in a plain chain, double it by crocheting around it as above, or sew a metal ring directly into the body with four or five passes of yarn.`,
    },
    {
      type: 'note',
      text: `Charms for babies and small children carry real risks from small parts and loops. Avoid beads or safety eyes on anything a young child might handle, and check the toy safety rules that apply in your country before you gift or sell one.`,
    },
    { type: 'h2', text: `How to crochet a bookmark that stays flat` },
    {
      type: 'p',
      text: `A bookmark is the best place to practice edges. Use fingering or sport yarn, or size 10 crochet cotton, with a 2.0 to 2.5 mm hook.`,
    },
    {
      type: 'ol',
      items: [
        `Chain 9. Single crochet in the second chain from the hook and across, giving 8 stitches.`,
        `Chain 1, turn, and single crochet in each stitch. Repeat until the strip is about 14 to 16 cm. With fingering yarn that is usually 45 to 55 rows.`,
        `To make a point, decrease one stitch at each end of the next three rows (8, 6, 4, 2 stitches), then fasten off.`,
        `Work a round of single crochet around the whole edge, with 3 stitches in each corner. This border hides uneven sides.`,
        `Attach a tassel of 6 to 8 strands, each about 12 cm, at the base.`,
      ],
    },
    {
      type: 'p',
      text: `Flat strips curl because single crochet leans a little to one side. A border helps, and so does blocking: pin the strip, mist it with water, let it dry, and it will relax.`,
    },
    { type: 'h2', text: `What hardware do crochet keychains and bag charms need?` },
    {
      type: 'p',
      text: `The fastener is the part that gets pulled hardest, so choose it as carefully as the yarn.`,
    },
    {
      type: 'ul',
      items: [
        `Split key ring (20 to 25 mm): the sturdy choice for keys. Thread the crochet loop on with a twist, as you would add a key.`,
        `Lobster clasp: easy to clip on and off a bag.`,
        `Jump ring: a joiner between the loop and a clasp. Close it flat with pliers so there is no gap.`,
        `Hair clip bases: sew through the holes with a doubled thread, then add a dab of fabric glue under the stitching for extra hold.`,
      ],
    },
    { type: 'h2', text: `Which yarn lasts best for crochet accessories?` },
    {
      type: 'p',
      text: `Accessories take rubbing from bags, hair and hands, so yarn choice matters more here than in a decorative toy.`,
    },
    {
      type: 'ul',
      items: [
        `Mercerized or smooth cotton: strong, with very little pilling. It holds its shape for charms and bookmarks, but it does not stretch, so it is less comfortable in a tight scrunchie.`,
        `Smooth acrylic or acrylic blends: soft, washable and cheap, but fuzzy or loosely twisted types pill quickly where they rub. Choose a tightly twisted one.`,
        `Wool and soft wool blends: warm for headbands, but they pill the most. Avoid them for anything that rubs against a bag.`,
      ],
    },
    { type: 'h2', text: `How do you use scrap yarn for quick crochet projects?` },
    {
      type: 'p',
      text: `Crochet projects with scrap yarn work best when you plan them, rather than mixing everything in a bag. A simple system:`,
    },
    {
      type: 'ul',
      items: [
        `Sort leftovers by weight and fiber. A cotton charm and a wool scrunchie behave differently in the wash.`,
        `Weigh a ball on a kitchen scale. Roughly, 10 g of worsted yarn is 15 to 20 m, enough for a bow or bookmark; a scrunchie needs 20 to 30 g.`,
        `Match the project to the amount: bookmarks and bows for the smallest scraps, charms for the middle, scrunchies and headbands for the biggest.`,
        `For stripes, change colors at the end of a round so the join stays tidy, and weave the tails in as you go.`,
      ],
    },
    { type: 'h2', text: `Common mistakes with small crochet projects and how to fix them` },
    {
      type: 'table',
      caption: `Fix it before you gift it`,
      head: [`Problem`, `Likely cause`, `Fix`],
      rows: [
        [`Stuffing shows through the stitches`, `Hook too big or tension loose`, `Drop one or two hook sizes, or double up thinner yarn`],
        [`Loop pulls out of a charm`, `Anchored in a single stitch`, `Crochet around the loop and weave the tail through the body`],
        [`Scrunchie too tight`, `Elastic stretched while crocheting`, `Keep the elastic relaxed and rip back to round 1`],
        [`Scrunchie flat, no frill`, `Not enough increases in round 2`, `Work two stitches in every stitch of that round`],
        [`Bookmark curls up`, `Edge unbalanced, no border`, `Add a border and block it`],
      ],
    },
    { type: 'h2', text: `How do you present crochet accessories as quick gifts?` },
    {
      type: 'p',
      text: `Quick crochet gifts feel special when they are finished well. Weave in every tail and trim it close. Press or block anything flat. Pair small things: a scrunchie with a matching charm, or a bookmark tucked inside a paperback.`,
    },
    { type: 'h2', text: `Can you sell handmade crochet accessories?` },
    {
      type: 'p',
      text: `Many makers sell scrunchies, bows and charms at markets and online. Before you do, read the terms that come with each pattern, since some allow selling finished items and some do not. Also check the product safety, labeling and tax rules for your country, especially for anything intended for children.`,
    },
    { type: 'h2', text: `Where to find crochet accessories patterns on this site` },
    {
      type: 'p',
      text: `To be straightforward: this Accessories section does not have any patterns in it yet, and it is being added to over time. Keychain and charm sized toys already exist elsewhere in the shop. [Amigurumi](/shop/amigurumi) has about 150 patterns, and [No-Sew Amigurumi](/shop/no-sew-amigurumi) has 7, which suits charms because there is less assembly on tiny parts. [Wearables](/shop/wearables) has 1 free pattern. You can also try the [free crochet patterns](/free-crochet-patterns) page before you buy anything.`,
    },
    {
      type: 'p',
      text: `If a pattern uses unfamiliar shorthand, the guide to [US vs UK crochet abbreviations](/guides/crochet-abbreviations-us-vs-uk) will save you from making a very different stitch than intended. For general layout and notation, see [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern).`,
    },
    { type: 'h2', text: `How buying a crochet pattern works` },
    {
      type: 'p',
      text: `Our patterns are PDF files. The download is available right after payment, and a link is also emailed to you. You do not need an account to buy, and payment is handled by Paddle. If something is not right, the [refund policy](/refund-policy) explains your options, and the [FAQ](/faq) answers the usual questions.`,
    },
  ],
  faq: [
    {
      q: `How much yarn does a crochet scrunchie need?`,
      a: `A standard scrunchie uses about 25 to 40 m of worsted weight yarn, which is roughly 20 to 30 g. Wider, floppier versions with extra rounds can reach 50 m.`,
    },
    {
      q: `How do I attach a keyring to a crochet charm?`,
      a: `Build a loop into the top of the charm by chaining 10, slip stitching back into the body and working 12 to 14 single crochet around the chain. Open a split ring or lobster clasp, thread it through that loop, and close it. A loop crocheted around is much stronger than a plain chain.`,
    },
    {
      q: `What hook size should I use for a crochet keychain?`,
      a: `Use a hook one or two sizes smaller than the yarn label suggests. For sport or DK weight cotton, that is usually 2.0 to 2.5 mm.`,
    },
    {
      q: `Are crochet accessories good for beginners?`,
      a: `Yes. Bookmarks, bows and scrunchies use basic stitches, need very little yarn and finish quickly, so mistakes are cheap and fast to fix. Start with a bookmark to practice even edges, then move to a scrunchie, and try a charm when you are comfortable with small rounds.`,
    },
    {
      q: `Which yarn is best for a crochet bag charm?`,
      a: `Smooth cotton or a tightly twisted acrylic is a good choice, because both resist pilling and rubbing. Fuzzy and loosely spun wool yarns tend to pill fast where they touch fabric or other keys.`,
    },
    {
      q: `How do I stop crochet edges from curling?`,
      a: `Add a round of single crochet around the border, then wet block the piece by pinning it flat, misting it and letting it dry completely. Curling is common in single crochet strips such as bookmarks and headbands.`,
    },
  ],
}
