/**
 * Smoke test: multi-line quoted description must not shift price/folder_name columns.
 * Run: npx tsx scripts/test-bulk-csv.mjs
 */
import Papa from 'papaparse'

const HEADERS =
  'title,subtitle,description,price,sale_price,skill_level,category,tags,ls_checkout_id,ls_variant_id,folder_name'

const sampleCsv = `${HEADERS}
"Cute Bear","Soft amigurumi","Line one, with a comma
Line two continues here
And a ""quoted"" word inside",4.99,3.99,beginner,amigurumi,teddy,chk_123,var_456,20
Simple Row,,Plain one-line description,2.50,,intermediate,accessories,,,,21`

function parseLikeBulkUpload(text) {
  const parsed = Papa.parse(text, { header: false, skipEmptyLines: 'greedy' })
  if (parsed.errors.length) throw new Error(parsed.errors.map((e) => e.message).join('; '))
  const rawRows = parsed.data.filter((row) => row.some((cell) => String(cell ?? '').trim()))
  const headers = rawRows[0].map((h) => String(h).trim().toLowerCase())
  const rows = rawRows.slice(1).map((cells) => {
    const row = {}
    for (const h of headers) {
      row[h] = String(cells[headers.indexOf(h)] ?? '')
    }
    return row
  })
  return rows
}

const rows = parseLikeBulkUpload(sampleCsv)
const multi = rows[0]
const simple = rows[1]

const checks = [
  [multi.price === '4.99', `price = ${multi.price}`],
  [multi.sale_price === '3.99', `sale_price = ${multi.sale_price}`],
  [multi.skill_level === 'beginner', `skill_level = ${multi.skill_level}`],
  [multi.category === 'amigurumi', `category = ${multi.category}`],
  [multi.folder_name === '20', `folder_name = ${multi.folder_name}`],
  [multi.description.includes('Line one, with a comma'), 'description keeps comma'],
  [multi.description.includes('\n'), 'description keeps newline'],
  [multi.description.includes('"quoted"'), `description unescapes quotes: ${multi.description}`],
  [simple.folder_name === '21', `row2 folder_name = ${simple.folder_name}`],
]

let failed = 0
for (const [ok, label] of checks) {
  console.log(ok ? 'PASS' : 'FAIL', label)
  if (!ok) failed++
}

if (failed) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll CSV parser checks passed.')
