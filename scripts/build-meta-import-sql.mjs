import fs from 'fs'

function parseCsv(text) {
  const rows = []
  let row = []
  let cur = ''
  let q = false
  const s = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    const n = s[i + 1]
    if (q) {
      if (c === '"' && n === '"') {
        cur += '"'
        i++
      } else if (c === '"') q = false
      else cur += c
    } else if (c === '"') q = true
    else if (c === ',') {
      row.push(cur)
      cur = ''
    } else if (c === '\n' || (c === '\r' && n === '\n')) {
      if (c === '\r') i++
      row.push(cur)
      rows.push(row)
      row = []
      cur = ''
    } else if (c === '\r') {
      row.push(cur)
      rows.push(row)
      row = []
      cur = ''
    } else cur += c
  }
  if (cur.length || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => String(cell).trim() !== ''))
}

function sqlStr(s) {
  return `'${String(s).replace(/'/g, "''")}'`
}

const csvPath = process.argv[2] || 'C:/Users/Muhammad Sufyan/Desktop/meta-descriptions.csv'
const table = parseCsv(fs.readFileSync(csvPath, 'utf8'))
const header = table[0].map((h) => h.trim().toLowerCase())
const slugIdx = header.indexOf('slug')
const descIdx = header.indexOf('meta_description')
const entries = table.slice(1).map((r) => ({
  slug: String(r[slugIdx] ?? '').trim(),
  meta_description: String(r[descIdx] ?? '').trim(),
}))

const values = entries
  .map((e) => `  (${sqlStr(e.slug)}, ${sqlStr(e.meta_description)})`)
  .join(',\n')

const sql = `-- Import meta_description by slug (meta_description only)
WITH incoming(slug, meta_description) AS (
  VALUES
${values}
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
`

fs.mkdirSync('exports', { recursive: true })
fs.writeFileSync('exports/import-meta-descriptions.sql', sql, 'utf8')
fs.writeFileSync('exports/meta-descriptions-parsed.json', JSON.stringify(entries, null, 2), 'utf8')
console.log(JSON.stringify({ csvRows: entries.length, sqlFile: 'exports/import-meta-descriptions.sql' }))
