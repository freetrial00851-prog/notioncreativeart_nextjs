-- No-Sew subcategory + assign 7 products + 36 meta_description rewrites
-- Parent Amigurumi listing STILL includes these (Shop.tsx: parent IN [self, ...subs])

BEGIN;

INSERT INTO categories (name, slug, parent_id, sort_order, image)
SELECT 'No-Sew Amigurumi Patterns', 'no-sew-amigurumi', id,
       COALESCE((SELECT MAX(sort_order) FROM categories), 0) + 1, NULL
FROM categories
WHERE slug = 'amigurumi'
  AND NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'no-sew-amigurumi');

UPDATE products
SET category_id = (SELECT id FROM categories WHERE slug = 'no-sew-amigurumi')
WHERE slug IN (
  'chubby-kitten-amigurumi-crochet-pattern',
  'fox-amigurumi-crochet-pattern',
  'mini-mouse-amigurumi-crochet-pattern',
  'mini-crab-amigurumi-pattern-cute-beach-crochet-sea-animal-toy-easy-beginner-plush-crab-softie-nursery-decor-pdf-pattern-instant-download',
  'amigurumi-gecko-lizard-crochet-pattern',
  'corgi-amigurumi-crochet-pattern',
  'mini-pug-amigurumi-crochet-pattern'
);

WITH v(slug, meta_description, meta_title) AS (
  VALUES
  ('chubby-kitten-amigurumi-crochet-pattern', 'Crochet a chubby one-piece kitten with this amigurumi cat pattern—bobble paws, quick PDF, ideal for a keychain or bag charm.', 'Amigurumi Cat Pattern — Chubby Kitten'::text),
  ('cat-mushroom-amigurumi-crochet-pattern-easy-toadstool-cat-plushie-champignon-cat-keychain-toy-pdf-pattern-instant-download-beginner', 'Make a toadstool-costume kitty with this amigurumi cat pattern, including two cap styles. Easy beginner PDF for a toy or keychain.', 'Amigurumi Cat Pattern — Mushroom Kitty'::text),
  ('cat-with-headphones-crochet-pdf-pattern', 'Stitch a gamer kitty in oversized headphones with this amigurumi cat pattern. Instant PDF—a playful desk buddy or handmade gift.', NULL::text),
  ('colorful-kitten-amigurumi-crochet-pattern', 'Mix yarn colors for a whole kitten family using this amigurumi cat pattern—head, body, tail, and limbs. Beginner-friendly PDF.', 'Amigurumi Cat — Colorful Kitten'::text),
  ('rosita-the-cat-amigurumi-crochet-pattern', 'Dress Rosita with this amigurumi cat pattern: removable sundress, handbag, and flower headband. Intermediate PDF, about 19cm tall.', NULL::text),
  ('smiling-kitten-amigurumi-crochet-pattern-pdf-easy-beginner-cat-stuffed-animal-jointed-amigurumi-kitten-sewing-pattern-instant-download', 'Pose a jointed smiling kitten with this amigurumi cat pattern—wired arms and legs that sit and turn. Easy beginner PDF download.', 'Amigurumi Cat Pattern — Smiling Kitten'::text),
  ('fox-amigurumi-crochet-pattern', 'Crochet a plush amigurumi fox in one continuous piece of soft yarn—no separate parts to sew. Quick PDF for confident beginners.', NULL::text),
  ('woodland-fox-amigurumi-crochet-pattern', 'Craft an 8.3in stuffed woodland amigurumi fox with a two-tone face and tail in basic single crochet. Easy beginner PDF pattern.', NULL::text),
  ('frog-with-heart-amigurumi-crochet-pattern', 'Download this amigurumi frog crochet pattern for a plush frog with a heart on its chest. Intermediate PDF—a cozy handmade gift.', NULL::text),
  ('frog-with-sunflower-amigurumi-crochet-pattern', 'Whip up a squishy frog holding a sunflower with this amigurumi frog crochet pattern (~14cm). Cheerful, easy beginner PDF.', NULL::text),
  ('sitting-frog-amigurumi-crochet-pattern', 'Make a wire-posed sitting frog that stays upright with this amigurumi frog crochet pattern. Easy beginner PDF—a quick, fun make.', NULL::text),
  ('mini-crab-amigurumi-pattern-cute-beach-crochet-sea-animal-toy-easy-beginner-plush-crab-softie-nursery-decor-pdf-pattern-instant-download', 'Work a mini plush crab in velvet yarn with this crochet amigurumi crab pattern—one piece, easy beginner PDF, beachy nursery gift.', 'Crochet Amigurumi Crab Pattern — Mini'::text),
  ('mini-mouse-amigurumi-crochet-pattern', 'Follow this amigurumi crochet mouse pattern for a one-piece mini mouse nose-to-tail—round ears, curled tip. Easy PDF, no spare pieces.', NULL::text),
  ('bunny-in-a-swimsuit-amigurumi-crochet-pattern', 'Crochet a long-eared spring rabbit in a matching swimsuit with this amigurumi bunny pattern. Intermediate PDF—sweet Easter gift, 28cm.', NULL::text),
  ('bunny-rattle-amigurumi-crochet-pattern', 'Make a soft bunny-head rattle on a wooden teether with this amigurumi bunny pattern. Easy, quick PDF—perfect for a new-baby gift.', NULL::text),
  ('bunny-with-flower-amigurumi-crochet-pattern', 'Stitch a plush bunny holding a tiny rose with this amigurumi bunny pattern—flower worked into the body. Satisfying PDF for beginners.', NULL::text),
  ('rooster-on-a-stick-crochet-pattern-amigurumi-lollipop-rooster-pdf-easy-farmhouse-chicken-cake-topper-digital-download-crochet-tutorial-for-beginners', 'Create a farmhouse rooster-on-a-stick with this amigurumi chicken crochet pattern—comb, wattle, and tail. Easy beginner PDF topper.', 'Amigurumi Chicken Crochet Pattern'::text),
  ('amigurumi-bear-trio-crochet-pattern', 'One easy crochet amigurumi bear pattern makes a matching panda, brown, and white trio—ideal keychains or bag charms. Instant PDF.', NULL::text),
  ('mini-teddy-bear-crochet-pattern-pdf-easy-amigurumi-bear-pattern-beginner-friendly-plush-bear-toy-nursery-decor-instant-download', 'Hug a 4.5–5in mini teddy from this crochet amigurumi bear pattern in soft plush yarn with embroidered details. Easy beginner PDF.', 'Crochet Amigurumi Bear — Mini Teddy'::text),
  ('teddy-bear-amigurumi-crochet-pattern-hand-crocheted-plush-bear-cub-nursery-baby-shower-gift-intermediate-pdf-pattern-instant-download', 'Craft a chenille-yarn cub with this crochet amigurumi bear pattern—no sewing needed. Intermediate PDF, lovely baby-shower gift.', 'Crochet Amigurumi Bear — Plush Cub'::text),
  ('teddy-bear-in-a-dress-amigurumi-crochet-pattern', 'Dress a 9.5in plush teddy with removable clothes using this crochet amigurumi bear pattern. Intermediate PDF—a keepsake toy make.', NULL::text),
  ('teddy-bear-keychain-amigurumi-crochet-pattern', 'Whip up a 3in two-tone teddy charm with a tiny scarf from this crochet amigurumi bear pattern. Easy PDF keychain or bag charm.', NULL::text),
  ('baby-horse-lovey-amigurumi-crochet-pattern', 'Crochet a horse-head security blanket in button-strap overalls with this amigurumi horse crochet pattern. Intermediate PDF keepsake.', NULL::text),
  ('hobby-horse-amigurumi-crochet-pattern', 'Build a fluffy-mane stick horse on a wooden handle with this amigurumi horse crochet pattern. Intermediate PDF—a playful keepsake.', NULL::text),
  ('long-haired-horse-amigurumi-crochet-pattern', 'Make a palm-sized boho pony with a fringed mane and tail using this amigurumi horse crochet pattern. Intermediate PDF, whimsical finish.', NULL::text),
  ('baby-dolphin-amigurumi-crochet-pattern', 'Crochet a cuddly velvet baby dolphin with this amigurumi dolphin crochet pattern—rounded or knotted tail. Intermediate PDF nursery gift.', NULL::text),
  ('cuddly-lamb-amigurumi-crochet-pattern', 'Start with this amigurumi lamb crochet pattern in simple single crochet rounds and felt-backed eyes. Beginner-friendly PDF for new makers.', NULL::text),
  ('plush-hippo-amigurumi-crochet-pattern', 'Follow this crochet hippo amigurumi pattern in chenille yarn with full stitch counts each round. Easy beginner PDF for nursery shelves.', NULL::text),
  ('plush-squirrel-amigurumi-crochet-pattern', 'Work a woodland squirrel to ~20–21cm in soft plush yarn with this amigurumi squirrel crochet pattern. Intermediate PDF cuddle friend.', NULL::text),
  ('amigurumi-santa-claus-crochet-pattern', 'Crochet festive cheer with amigurumi crochet santa claus patterns—fuzzy beard, trimmed coat, and belt. Advanced PDF holiday décor.', NULL::text),
  ('capybara-in-a-bathtub-amigurumi-crochet-pattern', 'Relax with a bathtub scene: this capybara amigurumi crochet pattern includes a tiny tub, towel, and apple. Easy beginner PDF make.', NULL::text),
  ('capybara-in-a-skirt-amigurumi-crochet-pattern', 'Dress your rodent in a ruffled ballerina skirt with this capybara amigurumi crochet pattern. Easy PDF—sweet shower or birthday gift.', NULL::text),
  ('capybara-in-an-orange-hat-amigurumi-crochet-pattern', 'Crochet a fruit-hooded cutie with this capybara amigurumi crochet pattern—orange-peel hat, 2.5–3in. Easy PDF keychain or bag charm.', NULL::text),
  ('little-jellyfish-crochet-pattern-amigurumi-jellyfish-keychain-charm-cute-sea-animal-nursery-decor-toy-pdf-pattern-instant-download', 'Make a tiny flower-topped jelly with dangly tentacles using this amigurumi jellyfish crochet pattern. Instant PDF keychain or décor.', 'Amigurumi Jellyfish Crochet Pattern'::text),
  ('plush-koala-amigurumi-crochet-pattern', 'Hug a fuzzy-eared koala from this amigurumi koala crochet pattern, written row-by-row in US terms. Intermediate PDF handmade gift.', NULL::text),
  ('plush-panda-amigurumi-crochet-pattern', 'Crochet a 4–4.5in velvet panda with bobble limbs using this amigurumi panda bear crochet pattern. Quick beginner PDF—instant download.', NULL::text)
)
UPDATE products p
SET
  meta_description = v.meta_description,
  meta_title = CASE WHEN v.meta_title IS NOT NULL THEN v.meta_title ELSE p.meta_title END
FROM v
WHERE p.slug = v.slug;

COMMIT;

-- Verify
SELECT c.name, c.slug, c.parent_id, p.slug AS product_slug
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
WHERE c.slug = 'no-sew-amigurumi'
ORDER BY p.slug;
