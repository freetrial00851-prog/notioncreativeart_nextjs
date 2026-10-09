/**
 * Full apply script for No-Sew category + keyword meta rewrites.
 * Not auto-run — apply via Supabase after user approval.
 */
import fs from 'fs'

const metas = JSON.parse(fs.readFileSync('exports/keyword-meta-rewrites.json', 'utf8'))

function esc(s) {
  return String(s).replace(/'/g, "''")
}

const nosewSlugs = [
  'chubby-kitten-amigurumi-crochet-pattern',
  'fox-amigurumi-crochet-pattern',
  'mini-mouse-amigurumi-crochet-pattern',
  'mini-crab-amigurumi-pattern-cute-beach-crochet-sea-animal-toy-easy-beginner-plush-crab-softie-nursery-decor-pdf-pattern-instant-download',
  'amigurumi-gecko-lizard-crochet-pattern',
  'corgi-amigurumi-crochet-pattern',
  'mini-pug-amigurumi-crochet-pattern',
]

const values = metas
  .map((m) => {
    const titleSql = m.meta_title ? `'${esc(m.meta_title)}'` : 'NULL'
    return `  ('${esc(m.slug)}', '${esc(m.meta_description)}', ${titleSql}::text)`
  })
  .join(',\n')

const sql = `-- No-Sew subcategory + assign 7 products + 36 meta_description rewrites
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
  ${nosewSlugs.map((s) => `'${s}'`).join(',\n  ')}
);

WITH v(slug, meta_description, meta_title) AS (
  VALUES
${values}
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
`

fs.writeFileSync('exports/apply-nosew-and-keyword-meta.sql', sql)
console.log('Wrote exports/apply-nosew-and-keyword-meta.sql')
console.log('metas', metas.length, 'nosew', nosewSlugs.length)
