-- Import meta_description by slug (meta_description only)
WITH incoming(slug, meta_description) AS (
  VALUES
  ('amigurumi-bear-trio-crochet-pattern', 'Crochet a matching trio of panda, brown, and white amigurumi bears from one easy base pattern. Instant PDF — perfect keychains or bag charms.'),
  ('amigurumi-gecko-lizard-crochet-pattern', 'Crochet an adorable one-piece gecko lizard in simple single crochet. Easy PDF pattern with full stitch counts — a fun weekend project.'),
  ('amigurumi-santa-claus-crochet-pattern', 'Crochet an advanced Amigurumi Santa Claus doll with fuzzy beard, trimmed coat, and belt. Instant PDF download — a festive holiday decoration.'),
  ('baby-dolphin-amigurumi-crochet-pattern', 'Crochet a cuddly baby dolphin in soft velvet yarn, with rounded or knotted tail options. Intermediate PDF pattern — a sweet nursery gift.'),
  ('baby-elephant-boy-girl-set-amigurumi-crochet-pattern', 'Crochet a jointed baby elephant duo with poseable arms and legs. Easy beginner PDF pattern for a boy-and-girl nursery gift set.'),
  ('baby-goat-boy-girl-set-amigurumi-crochet-pattern', 'Crochet a matching baby goat pair with removable outfits, tiny horns, and floppy ears. Intermediate PDF pattern for a charming farm-animal set.'),
  ('baby-hedgehog-amigurumi-crochet-pattern', 'Crochet a two-tone baby hedgehog with a textured fuzzy-spine back. Advanced PDF pattern — a detailed, heartwarming handmade gift.'),
  ('baby-horse-lovey-amigurumi-crochet-pattern', 'Crochet a plush horse-head security blanket in removable button-strap overalls. Intermediate PDF pattern — a treasured baby keepsake.'),
  ('baby-kid-goat-amigurumi-crochet-pattern', 'Crochet an easy baby goat (kid) amigurumi with two-tone limbs and a clear color guide. Beginner-friendly instant PDF download.'),
  ('beaver-on-a-swing-car-charm-amigurumi-crochet-pattern', 'Crochet a tiny beaver in an ushanka hat on a swing charm. Instant PDF pattern — a fun hanging accessory for mirrors, bags, or keys.'),
  ('beaver-with-branch-amigurumi-crochet-pattern', 'Crochet an easy beaver holding a tiny branch, with full instructions for teeth, tail, and ears. Instant PDF — keychain-ready design.'),
  ('bunny-in-a-swimsuit-amigurumi-crochet-pattern', 'Crochet a long-eared spring bunny in a matching swimsuit and bow headband. Intermediate PDF pattern — a sweet Easter gift, 28cm tall.'),
  ('bunny-rattle-amigurumi-crochet-pattern', 'Crochet a soft bunny head rattle on a wooden teether ring. Easy, quick PDF pattern — a perfect handmade gift for a new baby.'),
  ('bunny-with-flower-amigurumi-crochet-pattern', 'Crochet a plush bunny holding a tiny rose worked right into the body. Instant PDF pattern — a satisfying make for confident beginners.'),
  ('capybara-in-a-bathtub-amigurumi-crochet-pattern', 'Crochet an adorable capybara relaxing in its own tiny bathtub with a towel and apple. Easy beginner PDF pattern for a fun scene make.'),
  ('capybara-in-a-skirt-amigurumi-crochet-pattern', 'Crochet a capybara dressed in a ruffled ballerina-style skirt. Easy beginner PDF pattern — a sweet gift for baby showers or birthdays.'),
  ('capybara-in-an-orange-hat-amigurumi-crochet-pattern', 'Crochet a tiny capybara wearing a fruit-inspired orange-peel hood. Easy PDF pattern for a 2.5-3in keychain or bag charm.'),
  ('cat-mushroom-amigurumi-crochet-pattern-easy-toadstool-cat-plushie-champignon-cat-keychain-toy-pdf-pattern-instant-download-beginner', 'Crochet a cat-in-a-mushroom-costume amigurumi with two cap style options. Easy beginner PDF pattern — a soft toy or keychain charm.'),
  ('cat-with-headphones-crochet-pdf-pattern', 'Crochet a gamer-themed amigurumi cat wearing oversized headphones and a badge charm. Instant PDF pattern — a fun desk buddy or gift.'),
  ('chubby-kitten-amigurumi-crochet-pattern', 'Crochet a chubby one-piece kitten head with bobble-stitch paws. Easy, quick PDF pattern — perfect for a keychain or bag charm.'),
  ('colorful-kitten-amigurumi-crochet-pattern', 'Crochet an easy amigurumi kitten covering head, ears, body, tail, arms and legs. Beginner-friendly PDF — mix colors for a kitten family.'),
  ('corgi-amigurumi-crochet-pattern', 'Crochet a keychain-sized corgi worked in one continuous piece, no sewing required. Easy PDF pattern — a charming gift for dog lovers.'),
  ('cuddly-lamb-amigurumi-crochet-pattern', 'Crochet a soft lamb in simple single crochet rounds with felt-backed safety eyes. Beginner-friendly PDF pattern — great for first-timers.'),
  ('flower-bee-amigurumi-crochet-pattern', 'Crochet a tiny plush bee-flower keychain charm in just a few rounds of plush yarn. Easy beginner PDF pattern — a quick, sweet make.'),
  ('fox-amigurumi-crochet-pattern', 'Crochet a one-piece plush fox in soft plush yarn with no separate parts to sew. Quick PDF pattern for confident beginners.'),
  ('frog-with-heart-amigurumi-crochet-pattern', 'Crochet a seamless plush frog finished with a sweet heart detail on its chest. Intermediate PDF pattern — a cozy handmade gift.'),
  ('frog-with-sunflower-amigurumi-crochet-pattern', 'Crochet a squishy plush frog holding its own crochet sunflower, about 14cm tall. An easy, cheerful beginner amigurumi PDF pattern.'),
  ('heart-cactus-crochet-pattern', 'Crochet a heart-shaped cactus with a little flower in its own crocheted pot. Easy beginner PDF pattern — a sweet Valentine decor piece.'),
  ('hobby-horse-amigurumi-crochet-pattern', 'Crochet a horse-on-a-stick toy with a fluffy mane and stitched bridle on a wooden handle. Intermediate PDF pattern — a keepsake make.'),
  ('little-jellyfish-crochet-pattern-amigurumi-jellyfish-keychain-charm-cute-sea-animal-nursery-decor-toy-pdf-pattern-instant-download', 'Crochet a tiny jellyfish with a flower top and dangly tentacles. Instant PDF pattern — perfect keychain, bag charm, or nursery decor.'),
  ('long-ear-puppy-amigurumi-crochet-pattern', 'Crochet a soft, long-eared puppy softie in plush yarn, about 5 inches tall. Intermediate PDF pattern — a handmade gift for dog lovers.'),
  ('long-haired-horse-amigurumi-crochet-pattern', 'Crochet a palm-sized boho pony with a flowing fringed mane and tail. Intermediate PDF pattern with a whimsical, playful finish.'),
  ('mini-crab-amigurumi-pattern-cute-beach-crochet-sea-animal-toy-easy-beginner-plush-crab-softie-nursery-decor-pdf-pattern-instant-download', 'Crochet a mini plush crab in soft velvet-style yarn, worked in one piece. Easy beginner PDF pattern — a sweet beach-themed nursery gift.'),
  ('mini-mouse-amigurumi-crochet-pattern', 'Crochet a one-piece mini mouse from nose to tail with round ears and a curled tail. Easy PDF pattern — no separate pieces to sew.'),
  ('mini-pony-amigurumi-crochet-pattern', 'Crochet a tiny mini pony amigurumi with a fluffy yarn mane and tail, smaller than your palm. Quick beginner-to-intermediate PDF pattern.'),
  ('mini-pug-amigurumi-crochet-pattern', 'Crochet a one-piece mini pug with bobble-stitch paws and cheeks. Easy beginner PDF pattern — a charming keychain or bag charm.'),
  ('mini-teddy-bear-crochet-pattern-pdf-easy-amigurumi-bear-pattern-beginner-friendly-plush-bear-toy-nursery-decor-instant-download', 'Crochet a huggable 4.5-5in mini teddy bear in soft plush yarn with hand-embroidered details. Easy beginner PDF — instant download.'),
  ('nessie-amigurumi-crochet-pattern', 'Crochet a huggable Loch Ness Monster amigurumi with back bumps and a two-tone tail shell. Intermediate PDF pattern — a fun, cuddly make.'),
  ('paw-print-keychain-amigurumi-crochet-pattern', 'Crochet a quick plush paw-print charm in soft plush yarn. Easy beginner PDF pattern — perfect for bags, backpacks, or keys.'),
  ('plush-hippo-amigurumi-crochet-pattern', 'Crochet a cuddly chenille-yarn hippo with full stitch counts for every round. Easy beginner PDF pattern for a nursery-shelf keepsake.'),
  ('plush-koala-amigurumi-crochet-pattern', 'Crochet a huggable koala with fuzzy little ears, written row-by-row in US terms. Intermediate PDF pattern — a soft handmade gift.'),
  ('plush-panda-amigurumi-crochet-pattern', 'Crochet a cuddly 4-4.5in panda in soft velvet yarn with simple bobble-stitch limbs. Quick beginner PDF pattern — instant download.'),
  ('plush-squirrel-amigurumi-crochet-pattern', 'Crochet a woodland squirrel worked to about 20-21cm tall in soft plush yarn. Intermediate PDF pattern for a cuddly handmade friend.'),
  ('rooster-on-a-stick-crochet-pattern-amigurumi-lollipop-rooster-pdf-easy-farmhouse-chicken-cake-topper-digital-download-crochet-tutorial-for-beginners', 'Crochet a charming rooster-on-a-stick with comb, wattle, and tail details. Easy beginner PDF pattern — a fun farmhouse cake topper.'),
  ('rosita-the-cat-amigurumi-crochet-pattern', 'Crochet Rosita, a dressed-up amigurumi cat with a removable sundress, handbag, and flower headband. Intermediate PDF pattern, 19cm tall.'),
  ('sitting-frog-amigurumi-crochet-pattern', 'Crochet a wire-posed sitting frog with googly eyes that sits upright on its own. Easy beginner PDF pattern — a quick, fun make.'),
  ('smiling-kitten-amigurumi-crochet-pattern-pdf-easy-beginner-cat-stuffed-animal-jointed-amigurumi-kitten-sewing-pattern-instant-download', 'Crochet a jointed smiling kitten that turns and sits, with wired arms and legs for posing. Easy beginner PDF — instant download.'),
  ('teddy-bear-amigurumi-crochet-pattern-hand-crocheted-plush-bear-cub-nursery-baby-shower-gift-intermediate-pdf-pattern-instant-download', 'Crochet a soft plush teddy bear cub in cozy chenille-style yarn with no sewing needed. Intermediate PDF pattern — a baby shower gift.'),
  ('teddy-bear-in-a-dress-amigurumi-crochet-pattern', 'Crochet a 9.5in plush teddy bear with a fully removable dress, shorts, bow, and headband. Intermediate PDF pattern — a keepsake toy.'),
  ('teddy-bear-keychain-amigurumi-crochet-pattern', 'Crochet a 3in teddy bear charm with a two-tone body and a tiny knitted-look scarf. Easy PDF pattern — a sweet bag charm or keychain.'),
  ('woodland-fox-amigurumi-crochet-pattern', 'Crochet an 8.3in stuffed fox with a two-tone face and tail in basic single crochet. Easy beginner PDF pattern — a lovely nursery gift.'),
  ('zebra-rattle-amigurumi-crochet-pattern', 'Crochet a zebra rattle with a soft crocheted head on a wooden ring base and yarn mane. Easy PDF pattern — a sweet first baby gift.')
),
updated AS (
  UPDATE products p
  SET meta_description = i.meta_description
  FROM incoming i
  WHERE p.slug = i.slug
  RETURNING p.slug
)
SELECT
  (SELECT count(*) FROM incoming) AS csv_rows,
  (SELECT count(*) FROM updated) AS updated_rows,
  coalesce(
    (SELECT json_agg(i.slug ORDER BY i.slug)
     FROM incoming i
     WHERE NOT EXISTS (SELECT 1 FROM updated u WHERE u.slug = i.slug)),
    '[]'::json
  ) AS unmatched_slugs;
