import type { CategoryContent } from '@/lib/categoryContent'

export const holidayContent: CategoryContent = {
  slug: 'holiday',
  body: [
    { type: 'h2', text: `How to plan holiday crochet patterns so they are finished on time` },
    {
      type: 'p',
      text: `Holiday crochet patterns are small, quick makes for Christmas, Halloween, Easter, Valentine's Day and the harvest season, and they go smoothly when you plan them like a seasoned maker. Start weeks before the date, match the yarn to the job, and finish ornaments properly so they hold their shape. Here is the calendar, the countdown math and the finishing tricks.`,
    },
    { type: 'h2', text: `A maker's calendar: when to start each holiday` },
    {
      type: 'p',
      text: `The question "when should I start holiday crochet?" has a boring but reliable answer: earlier than you think. Small items feel instant, yet weaving in ends, stiffening, drying and wrapping all take real time. Use the table as a starting point and adjust for your own pace.`,
    },
    {
      type: 'table',
      caption: `Holiday crochet calendar (times are for one small item at a relaxed pace)`,
      head: [`Holiday`, `Typical projects`, `Start`, `Time per item`, `Palette`],
      rows: [
        [`Valentine's Day`, `Hearts, bookmarks, small gift toys`, `4 to 5 weeks before`, `1 to 2 hours`, `Red, pink, cream, a touch of gold`],
        [`Easter`, `Eggs, chicks, bunnies, basket fillers`, `5 to 6 weeks before`, `1.5 to 3 hours`, `Pastels, butter yellow, soft green`],
        [`Halloween`, `Pumpkins, ghosts, bats, garlands`, `6 to 8 weeks before`, `1 to 3 hours`, `Orange, black, purple, cream`],
        [`Thanksgiving and harvest`, `Acorns, leaves, pumpkins, table coasters`, `4 to 5 weeks before`, `45 minutes to 2 hours`, `Rust, mustard, brown, olive`],
        [`Christmas`, `Ornaments, stars, stockings, gift toppers`, `10 to 12 weeks before`, `1 to 3 hours`, `Red, green, white, gold, silver`],
        [`Winter and New Year`, `Snowflakes, mittens, coasters`, `4 to 6 weeks before`, `1 to 2 hours`, `White, ice blue, silver, navy`],
      ],
    },
    { type: 'h2', text: `How to plan backward: ten ornaments in a worked example` },
    {
      type: 'p',
      text: `Say you want ten crochet ornaments finished by December 15 so they can be mailed or hung. Each flat ornament takes about 1.5 hours to crochet, and the finishing takes extra. Here is the honest math.`,
    },
    {
      type: 'ul',
      items: [
        `Crocheting: 10 ornaments at 1.5 hours is 15 hours.`,
        `Weaving in ends and shaping: about 10 minutes each, or 1.5 to 2 hours total.`,
        `Stiffening and drying: roughly 20 minutes of hands-on work, plus 24 hours of drying time per batch.`,
        `Loops, ribbon and wrapping: another hour.`,
        `Total hands-on time: about 19 to 20 hours.`,
      ],
    },
    {
      type: 'p',
      text: `At five hours of crochet a week, that is four weeks of making. Add a buffer week for a lost skein, a pattern you have to redo, or a sick family member, and you should begin about five to six weeks before December 15, which is early November. Six handmade gifts such as small toys work out similarly: at 4 hours each, plan 24 hours of crochet plus finishing.`,
    },
    {
      type: 'ol',
      items: [
        `Count the items and write who each one is for.`,
        `Time the first one properly, including finishing, and multiply.`,
        `Divide by the hours you really have per week, not the hours you hope to have.`,
        `Add one spare week, then count backward from the date.`,
      ],
    },
    {
      type: 'note',
      text: `Make the batch in one dye lot if you can. Red and green yarn from two different shops often looks like two different shades side by side, and ornaments hang close together on a tree.`,
    },
    { type: 'h2', text: `Which yarn and hook for crochet Christmas patterns and other ornaments` },
    {
      type: 'p',
      text: `Cotton is the favorite for ornaments because it is firm, takes stiffener well and shows stitches crisply. Use worsted or DK cotton with a 2.5 to 3.0 mm hook for flat ornaments, going a size or two below what the label suggests. A tight fabric keeps the shape and hides stuffing or stiffener residue.`,
    },
    {
      type: 'ul',
      items: [
        `Cotton or cotton blend: crisp, easy to stiffen, best for snowflakes, stars and wreaths.`,
        `Acrylic: soft and colorful, fine for stuffed shapes, but it can stretch and does not respond well to starch.`,
      ],
    },
    { type: 'h2', text: `How to stiffen crochet ornaments` },
    {
      type: 'p',
      text: `Flat crochet ornaments like snowflakes and stars need stiffening, or they curl and sag. Cotton thread or cotton yarn works best. Test any product on a swatch first.`,
    },
    {
      type: 'ol',
      items: [
        `Mix your stiffener. Liquid fabric stiffener is used straight from the bottle; liquid laundry starch is usually diluted with some water. Follow the label, and use a bowl you do not mind keeping for crafts.`,
        `Soak the ornament until it is saturated, then press it gently between your fingers. Do not wring it hard, because that distorts the stitches.`,
        `Pin it out on a covered foam board or a sheet of wax paper, shaping each point with pins. A snowflake should be pinned like blocking, with every arm straight.`,
        `Let it dry completely. Expect about 24 hours, longer in humid weather. Do not hang it until it feels fully hard.`,
        `Peel it away from the paper gently, and trim any dried drips with small scissors.`,
      ],
    },
    {
      type: 'note',
      text: `Honest caveats: a stiffened ornament is crisp, not waterproof, and humidity can soften it over time. Dark colors can look faded. Stiffener can also yellow white thread a little in some cases, so keep a swatch aside to compare. Wear gloves if your skin is sensitive, and work with good ventilation.`,
    },
    {
      type: 'p',
      text: `For stuffed shapes such as small pumpkins or tree balls, skip stiffener. Instead, stuff firmly with fiberfill, crochet tightly, and finish with a snug closing round.`,
    },
    { type: 'h2', text: `Hanging loops that do not pull out` },
    {
      type: 'p',
      text: `A loop that pops out is the most common ornament failure. Build the loop into the design instead of adding it as an afterthought.`,
    },
    {
      type: 'ul',
      items: [
        `Chain 15 to 20, join to the top point with a slip stitch, and then work 2 or 3 extra slip stitches into the stitches beside it so the join is anchored.`,
        `Pass the yarn tail through the ornament and back out again, then knot it around the base of the loop before weaving it in.`,
        `For heavy ornaments, use a separate length of ribbon or cord threaded through the top points, not through a single stitch.`,
      ],
    },
    { type: 'h2', text: `Crochet Halloween patterns and Easter patterns: recolor a plain toy` },
    {
      type: 'p',
      text: `You do not need a separate pattern for every holiday. A plain round toy with arms and ears can become a pumpkin in orange, a ghost in white, a bunny in pastel or a heart-holding bear in red. Change the colors, add a small accessory, and the same pattern covers four holidays.`,
    },
    {
      type: 'ul',
      items: [
        `Halloween: swap to orange or white, add felt or embroidered faces, and a small stem in green.`,
        `Easter: use pastel yarn, add long ears, and make a tiny pom-pom tail.`,
        `Valentine's Day: red, pink and cream, with a small crocheted heart in the toy's hands.`,
        `Christmas: add a tiny scarf or a red hat and use cotton in white and red.`,
      ],
    },
    {
      type: 'p',
      text: `To be upfront, our [Amigurumi](/shop/amigurumi) category has about 150 patterns, [No-Sew Amigurumi](/shop/no-sew-amigurumi) has 7 and [Wearables](/shop/wearables) has 1 free pattern. This Holiday category does not have patterns yet and is being added to over time, so the small toys in Amigurumi are the place to start if you want to recolor something for a season.`,
    },
    { type: 'h2', text: `Crochet gift toppers, tags and Valentine gifts` },
    {
      type: 'p',
      text: `A crocheted gift topper turns plain wrapping into part of the present. Tiny hearts, mini stars, flat mittens or a small pumpkin tied with ribbon take 20 to 45 minutes each, use under 5 grams of yarn, and travel well in the mail.`,
    },
    {
      type: 'ul',
      items: [
        `Tie toppers with thin ribbon or baker's twine, not glue, so the recipient can reuse them as tree decorations.`,
        `A flat heart or circle with a tag stitched on works as a bookmark, a card decoration or a gift label at the same time.`,
        `For crochet Valentine gifts, a small heart keychain, a heart-shaped coaster set or a little toy in a gift box is quick and personal.`,
      ],
    },
    { type: 'h2', text: `Safety around candles, heat, children and pets` },
    {
      type: 'p',
      text: `Yarn is flammable, so keep crochet decorations away from candles, fireplaces, heaters and fairy lights that get warm. Use LED lights near the tree and flameless candles beside any wreath or garland. These are general good practices; check the rules in your country before giving items to children.`,
    },
    {
      type: 'ul',
      items: [
        `Small parts: for babies and toddlers, avoid buttons, beads and glued-on eyes, and embroider the face instead.`,
        `Pets: cats and dogs love dangling yarn, so hang ornaments out of reach and skip long tassels or strings.`,
        `Stuffing: close seams securely so fiberfill cannot escape.`,
      ],
    },
    { type: 'h2', text: `Making holiday crochet with kids and scrap yarn` },
    {
      type: 'p',
      text: `Holiday crochet is a good way to use scraps. A 15-gram leftover ball is enough for a small ornament, a gift topper or a pumpkin top. Sort scraps by color family in clear bags so you can grab red, green and gold quickly.`,
    },
    {
      type: 'ul',
      items: [
        `Let children pick colors, stuff shapes, add pom-poms or choose ribbons while you do the stitching.`,
        `A scrap garland made of small mixed-color circles is forgiving, because every circle can be slightly different.`,
      ],
    },
    { type: 'h2', text: `How to store crochet decorations` },
    {
      type: 'p',
      text: `Good storage keeps your work looking fresh from year to year. Make sure everything is completely dry first, because dampness leads to musty smells and mildew. Wrap stiffened ornaments in acid-free tissue and store them upright in a rigid box, with one layer per tray so points do not bend.`,
    },
    {
      type: 'ul',
      items: [
        `Use a breathable container or a cardboard box rather than a sealed bag, and keep it away from damp basements and hot attics.`,
        `Label each box by holiday and put a note inside about the yarn and care.`,
      ],
    },
    { type: 'h2', text: `Reading patterns and how buying works` },
    {
      type: 'p',
      text: `If a pattern uses stitches or terms you do not know, our guide to [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern) explains the shorthand, and the page on [US versus UK crochet abbreviations](/guides/crochet-abbreviations-us-vs-uk) avoids the mistake of mixing up single and double crochet. More tutorials are in the [guides](/guides), and you can try our [free crochet patterns](/free-crochet-patterns) before you buy anything.`,
    },
    {
      type: 'p',
      text: `Our patterns are PDF files. You do not need an account to buy; the download is available right after payment and a link is also emailed. Payment is handled by Paddle. If something is not right, the [refund policy](/refund-policy) explains what to do, and the [FAQ](/faq) or the [contact page](/contact) can help with anything else.`,
    },
  ],
  faq: [
    {
      q: `When should I start crocheting Christmas ornaments?`,
      a: `Ten to twelve weeks before Christmas is comfortable for a full set of gifts and ornaments, and about five to six weeks is the minimum for ten ornaments. Time the first piece including finishing, and count backward from your date. Leave one spare week for mistakes and drying time.`,
    },
    {
      q: `How do I stiffen crochet ornaments at home?`,
      a: `Soak a cotton ornament in liquid fabric stiffener or diluted liquid starch, press out the extra, pin it into shape on wax paper or foam board, and let it dry for about 24 hours. Test on a swatch first, as stiffener can slightly change the color of some threads. Stiffened pieces can soften in humid rooms.`,
    },
    {
      q: `What yarn is best for crochet Halloween and Christmas decorations?`,
      a: `Cotton is the best all-round choice because it is firm and holds its shape, especially with a hook one or two sizes smaller than the label suggests. Acrylic is fine for stuffed toys and garlands. Choose colorfast yarn for anything that will be washed.`,
    },
    {
      q: `Are crochet decorations safe near candles and lights?`,
      a: `Yarn can burn, so keep decorations well away from open flames, heaters and warm bulbs. Flameless candles and LED lights are the safer choice around crochet. This is general advice, so check the guidance for your country.`,
    },
    {
      q: `Can I make a toy for several holidays with one pattern?`,
      a: `Yes. Change the color palette and add a simple accessory, such as a scarf for Christmas, long ears for Easter or an orange body for Halloween. Start with the small toys in [Amigurumi](/shop/amigurumi) if you want to recolor one for the season.`,
    },
    {
      q: `How do I make crochet ornament loops stronger?`,
      a: `Chain 15 to 20 stitches, join the loop to the ornament with slip stitches in several adjacent stitches, and weave the tail in for at least 2 inches in a zigzag. For heavy ornaments, thread ribbon through two or three points instead of relying on one stitch.`,
    },
  ],
}
