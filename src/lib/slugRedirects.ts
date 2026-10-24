/**
 * Patterns whose long, keyword-stuffed web addresses were shortened (2026-10-25).
 * Used for permanent (308) redirects in next.config.ts so old links, pins and search results keep working.
 * Keep these entries for at least a year. Future renames are redirected automatically from the
 * `product_slug_history` table (filled by a database trigger).
 */
export const RENAMED_PATTERN_SLUGS: [oldSlug: string, newSlug: string][] = [
  ['rooster-on-a-stick-crochet-pattern-amigurumi-lollipop-rooster-pdf-easy-farmhouse-chicken-cake-topper-digital-download-crochet-tutorial-for-beginners', 'rooster-on-a-stick-crochet-pattern'],
  ['mini-crab-amigurumi-pattern-cute-beach-crochet-sea-animal-toy-easy-beginner-plush-crab-softie-nursery-decor-pdf-pattern-instant-download', 'mini-crab-amigurumi-crochet-pattern'],
  ['mini-teddy-bear-in-overalls-crochet-pattern-easy-amigurumi-plush-bear-beginner-stuffed-animal-nursery-decor-instant-download-pdf-pattern', 'mini-teddy-bear-in-overalls-crochet-pattern'],
  ['smiling-kitten-amigurumi-crochet-pattern-pdf-easy-beginner-cat-stuffed-animal-jointed-amigurumi-kitten-sewing-pattern-instant-download', 'smiling-kitten-amigurumi-crochet-pattern'],
  ['giraffe-amigurumi-crochet-pattern-with-scarf-cute-safari-animal-plush-toy-nursery-decor-baby-shower-gift-pdf-pattern-instant-download', 'giraffe-with-scarf-amigurumi-crochet-pattern'],
  ['teddy-bear-amigurumi-crochet-pattern-hand-crocheted-plush-bear-cub-nursery-baby-shower-gift-intermediate-pdf-pattern-instant-download', 'teddy-bear-cub-amigurumi-crochet-pattern'],
  ['cute-alien-creature-amigurumi-crochet-pattern-two-tone-monster-toy-easy-beginner-amigurumi-kawaii-nursery-decor-pdf-instant-download', 'alien-creature-amigurumi-crochet-pattern'],
  ['seagull-amigurumi-crochet-pattern-easy-beginner-bird-toy-cute-nautical-nursery-decor-and-baby-shower-gift-idea-pdf-instant-download', 'seagull-amigurumi-crochet-pattern-nautical'],
  ['cat-mushroom-amigurumi-crochet-pattern-easy-toadstool-cat-plushie-champignon-cat-keychain-toy-pdf-pattern-instant-download-beginner', 'cat-mushroom-amigurumi-crochet-pattern'],
  ['horse-keychain-crochet-pattern-amigurumi-horse-pdf-pattern-easy-beginner-bag-charm-keyring-cute-animal-lover-gift-instant-download', 'horse-keychain-crochet-pattern'],
  ['little-jellyfish-crochet-pattern-amigurumi-jellyfish-keychain-charm-cute-sea-animal-nursery-decor-toy-pdf-pattern-instant-download', 'little-jellyfish-keychain-crochet-pattern'],
  ['monster-amigurumi-crochet-pattern-big-and-little-round-toy-family-set-cute-plush-nursery-decor-baby-kids-gift-pdf-instant-download', 'monster-family-amigurumi-crochet-pattern'],
  ['little-spider-crochet-pattern-amigurumi-spider-pdf-cute-halloween-plush-toy-easy-nursery-decor-gift-idea-instant-download-pattern', 'little-spider-crochet-pattern'],
  ['teddy-bear-with-umbrella-amigurumi-crochet-pattern-easy-rainy-day-plush-toy-nursery-decor-gift-idea-pdf-pattern-instant-download', 'teddy-bear-with-umbrella-crochet-pattern'],
  ['baby-goat-amigurumi-crochet-pattern-pdf-farm-animal-nursery-stuffed-toy-intermediate-level-kids-room-decor-gift-instant-download', 'baby-goat-amigurumi-crochet-pattern'],
  ['amigurumi-cat-crochet-pattern-pdf-plush-kitten-toy-tutorial-intermediate-level-nursery-decor-gift-idea-instant-download-us-terms', 'amigurumi-cat-crochet-pattern'],
  ['mini-teddy-bear-crochet-pattern-pdf-easy-amigurumi-bear-pattern-beginner-friendly-plush-bear-toy-nursery-decor-instant-download', 'mini-teddy-bear-crochet-pattern'],
  ['capybara-amigurumi-crochet-pattern-pdf-cute-animal-with-tangerine-and-turtle-backpack-nursery-decor', 'capybara-with-turtle-backpack-crochet-pattern'],
  ['cat-in-love-amigurumi-crochet-pattern-pdf-valentine-kitten-hugging-a-heart-cute-gift-for-crocheters', 'cat-in-love-valentine-crochet-pattern'],
  ['amigurumi-bunny-keychain-crochet-pattern-pdf-easy-baby-rabbit-with-bow-beginner-bag-charm-tutorial', 'bunny-keychain-crochet-pattern'],
]
