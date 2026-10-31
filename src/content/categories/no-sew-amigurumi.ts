import type { CategoryContent } from '@/lib/categoryContent'

export const noSewAmigurumiContent: CategoryContent = {
  slug: 'no-sew-amigurumi',
  body: [
    { type: 'h2', text: `What are no-sew amigurumi patterns?` },
    {
      type: 'p',
      text: `No-sew amigurumi patterns let you build a stuffed crochet toy without stitching on a single arm, leg or ear. The limbs are crocheted straight out of the body, or the whole toy is worked as one continuous piece, so every join is made of real stitches instead of a yarn seam. This page explains exactly how that works, when to stuff, how it compares with sewn toys, and how to fix the usual problems.`,
    },
    { type: 'h2', text: `How do you crochet limbs onto the body without sewing?` },
    {
      type: 'p',
      text: `A crocheted fabric is a field of loops, and you can start a new row of stitches in almost any of them. No-sew designs use that. When the body reaches the right height, the pattern tells you to join yarn at a marked spot, or to work a chosen number of stitches and leave the rest, and then to crochet around only those stitches. Worked in a spiral, they become a small tube that grows out of the body, which is your leg, arm or ear.`,
    },
    {
      type: 'p',
      text: `There are three common ways to set this up. The pattern will tell you which one it uses.`,
    },
    {
      type: 'ul',
      items: [
        `Leftover loops: one round of the body is worked in the front loops only. The back loops stay behind as a tidy ledge, and you later pick them up to build a leg or tail from them.`,
        `Marked stitches: you place markers on stitches where a limb will start, then join new yarn into them. Four to eight stitches is typical for an arm on a toy about 4 inches (10 cm) tall.`,
        `Skip and chain: at the base of the body you work part of the round, chain a few stitches to bridge a gap, and continue. The gap becomes the space between the legs.`,
      ],
    },
    {
      type: 'p',
      text: `In every version the limb is a short tube, usually 5 to 12 rounds, closed with a few decreases. Because the first round of the limb sits in the body itself, there is no seam to come undone.`,
    },
    { type: 'h2', text: `What is one piece amigurumi?` },
    {
      type: 'p',
      text: `One piece amigurumi goes a step further. The toy is a single spiral from start to finish: you might begin at the feet, work up the legs, join them into the body, shape the neck, and finish at the top of the head. Ears and arms are then added by working into the finished fabric. Nothing is made separately, so there are far fewer tails to weave in and no assembly stage at all.`,
    },
    {
      type: 'p',
      text: `This only works because of the order of work. A closed shape can be stuffed only through an opening, and the opening gets smaller as you go. That is why these patterns say when to stuff, and why you should follow that instruction even when the piece looks too small to need it.`,
    },
    { type: 'h2', text: `No-sew vs traditional amigurumi: which is better?` },
    {
      type: 'p',
      text: `Neither wins every time. The table shows where each method is stronger, so you can pick the right one for the toy you have in mind.`,
    },
    {
      type: 'table',
      caption: `No-sew and sewn construction compared`,
      head: [`Factor`, `No-sew`, `Traditional (sewn)`],
      rows: [
        [`Speed`, `No assembly, so small toys finish sooner`, `Slower, since sewing takes real time`],
        [`Strength`, `Limbs are part of the fabric and rarely pull off`, `Depends on how well you sew; weak joins can loosen`],
        [`Neatness`, `Few seams and few tails`, `Seams can show, especially on dark yarn`],
        [`Flexibility`, `Limb position is fixed by the pattern`, `You can move a limb or ear until it looks right`],
        [`Skill needed`, `Careful counting and marking`, `Neat sewing and a good eye for placement`],
        [`Best for`, `Keychains, charms, small animals, quick gifts`, `Large toys, odd poses, heavy limbs`],
      ],
    },
    { type: 'h2', text: `How do you make a no-sew toy from start to finish?` },
    {
      type: 'p',
      text: `Here is a typical order for a small standing animal, so you can see how the steps connect. Your pattern will have its own stitch counts, but the logic is the same.`,
    },
    {
      type: 'ol',
      items: [
        `Start the head with a magic ring and increase until it is as wide as the pattern says, often 24 to 30 stitches.`,
        `Work 6 to 8 even rounds, then decrease for the neck. Add the face now if the pattern asks for it, because the head is easier to hold before the rest exists.`,
        `Stuff the head firmly, then continue with the body, increasing again and working even rounds.`,
        `At the bottom of the body, mark the stitches for each leg. Work the leg stitches only, in a spiral, for the number of rounds given.`,
        `Add a little stuffing, decrease to close the foot, and fasten off. Rejoin at the next marked stitches for the second leg.`,
        `Stuff the body to a firm, springy feel before the last opening gets too small.`,
        `Join yarn at the marked stitches on each side and crochet the arms. Then work the ears or tail onto the head.`,
        `Weave in the tails, then add safety eyes or embroider the face.`,
      ],
    },
    { type: 'h2', text: `What should you plan before you start?` },
    {
      type: 'p',
      text: `Five minutes of preparation prevents most no-sew mistakes. Read the whole pattern once and answer these questions before your first stitch.`,
    },
    {
      type: 'ul',
      items: [
        `Where does each limb start? Put a marker in a stitch of a different color for each one, and write down which marker is which.`,
        `When must you stuff? Note every point where the opening will close or narrow, and stuff before it does.`,
        `How much tail do you need? Leave about 6 inches (15 cm) at each fasten-off, so you can close small gaps and hide the end inside the toy.`,
        `Where does the round begin? Mark the first stitch of every round with a locking marker, because limb counts rely on it.`,
        `Is the yarn right? Smooth, light-colored yarn shows the stitches you must pick up. Black is the hardest to see.`,
      ],
    },
    { type: 'h2', text: `How do I fix a twisted limb, a gap or uneven legs?` },
    {
      type: 'p',
      text: `Most problems come from a handful of causes. Here are the ones makers run into most, with the fix for each.`,
    },
    {
      type: 'table',
      caption: `Troubleshooting no-sew limbs`,
      head: [`Problem`, `Likely cause`, `Fix`],
      rows: [
        [`Twisted limb`, `You turned the work, or joined the round with a twist`, `Keep the right side facing you and always work in the same direction; rip back to the first round of the limb`],
        [`Gap at the join`, `Slack where the new yarn was attached`, `Pull the starting tail tight, then use it to stitch the hole closed from inside; next time work the first round snugly`],
        [`Uneven limbs`, `Different stitch counts or rounds, or looser tension on the second limb`, `Count each round, and use a row counter; work both limbs back to back so your tension stays the same`],
        [`Can't stuff the last part`, `The opening closed before the filling went in`, `Use a hook or chopstick to push in small pieces of fiberfill; next time stuff one round earlier than you think you need to`],
        [`Floppy limb`, `Too little filling, or hook too large`, `Add a pinch more through the top, or go down a hook size`],
      ],
    },
    {
      type: 'note',
      text: `Check the stitch count at the end of every limb round. A single missed increase near the join shows up as a crooked limb several rounds later, and it is much easier to fix on the same round.`,
    },
    { type: 'h2', text: `Which toys suit no-sew construction, and which do not?` },
    {
      type: 'p',
      text: `The method suits compact, symmetrical toys. Think of small bears, cats, bunnies, birds, frogs and mushrooms, where the limbs are short and close to the body. It works well for sets, too: once you know the order of work for one, the second is quick.`,
    },
    {
      type: 'p',
      text: `It is less suited to toys with long, floppy limbs, such as a giraffe or a doll with dangling legs, because those limbs are heavy and need to move. It is also tricky for characters with many separate, differently placed pieces, such as wings, horns and spikes. For those designs a sewn pattern from the [amigurumi collection](/shop/amigurumi) may give you more control.`,
    },
    { type: 'h2', text: `How do you make a no-sew keychain amigurumi?` },
    {
      type: 'p',
      text: `Small toys are where this method shines, because tiny limbs are hard to sew. A few habits help.`,
    },
    {
      type: 'ul',
      items: [
        `Use fingering or sport weight yarn with a 1.5 to 2.0 mm hook. The fabric should be dense enough that stuffing never shows.`,
        `Expect limbs of only 3 to 5 rounds and 4 to 6 stitches. Stuff them with tiny bits of fiberfill, using the tip of a hook or a toothpick.`,
        `Count more often than you would on a big toy. With so few stitches, one mistake is a third of the round.`,
        `Add the hardware last. Attach the ring or loop through two layers of stitches, and give it a firm pull before you hand it over.`,
      ],
    },
    {
      type: 'p',
      text: `Eyes and other small parts need extra care. Safety eyes are not suitable for babies or toddlers, so embroider the face on anything for a young child, and check the safety rules for toys in your country before you give one away.`,
    },
    { type: 'h2', text: `Is no-sew amigurumi good for beginners?` },
    {
      type: 'p',
      text: `Yes, as long as you already know the magic ring, single crochet, increases and decreases. If those feel solid, a simple no-sew pattern can be easier than a sewn one, because the part many beginners dread, placing and attaching limbs, is built into the instructions. If any abbreviation looks unfamiliar, the guide on [how to read a crochet pattern](/guides/how-to-read-a-crochet-pattern) will help, and our page on [US vs UK crochet abbreviations](/guides/crochet-abbreviations-us-vs-uk) will help you avoid reading a UK pattern with US stitches.`,
    },
    { type: 'h2', text: `How buying a pattern here works` },
    {
      type: 'p',
      text: `Every pattern is a PDF. You can download it right after payment, and a link is also emailed to you, so you do not need an account to buy. Payment is handled by Paddle. If something is not right, the [refund policy](/refund-policy) explains what to do. The no-sew section is small right now and most of its patterns are free, and you will find more free designs on our [free crochet patterns](/free-crochet-patterns) page.`,
    },
  ],
  faq: [
    {
      q: `Is no-sew amigurumi really made without any sewing?`,
      a: `The limbs, ears and tail are crocheted onto the body or worked as part of the same piece, so no sewing is needed to join them. You may still use a yarn needle to close a small opening, weave in tails, or embroider a face.`,
    },
    {
      q: `Are no-sew amigurumi toys as strong as sewn ones?`,
      a: `Usually, yes. A limb worked from the body is part of the same fabric, so it cannot pull away at a seam. Strength still depends on tight stitches and firm stuffing, and you should check every part before you give a toy away.`,
    },
    {
      q: `How do I join legs without sewing?`,
      a: `Mark the stitches where each leg starts, join yarn into them, and work them in a spiral as a tube. Close the foot with decreases, fasten off, then repeat for the second leg. Count each leg's rounds so the pair match.`,
    },
    {
      q: `When should I stuff a one piece amigurumi?`,
      a: `Stuff as soon as the opening begins to narrow, and again before any step that closes it. Add stuffing in small amounts and push it into the corners with a hook. If you wait until the end, the last part may be impossible to fill.`,
    },
    {
      q: `What yarn and hook work best for no-sew toys?`,
      a: `Follow the pattern, but smooth yarn in a light color shows the stitches you need to pick up. Use a hook one or two sizes smaller than the yarn label suggests so the filling stays hidden. Cotton and acrylic both work well.`,
    },
    {
      q: `Can I make any pattern no-sew by myself?`,
      a: `Sometimes, with practice. If a limb is round and sits flat on the body, you can try working it from marked stitches instead of sewing. It takes careful planning, and a pattern written for the method already gives you tested stitch counts.`,
    },
  ],
}
