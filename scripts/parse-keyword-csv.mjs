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

const table = parseCsv(
  fs.readFileSync('C:/Users/Muhammad Sufyan/Desktop/keyword-product-mapping-final.csv', 'utf8'),
)
const h = table[0].map((x) => x.trim())
const idx = Object.fromEntries(h.map((k, i) => [k, i]))
const rows = table.slice(1).map((r) => ({
  slug: r[idx.slug],
  title: String(r[idx.current_title] || '').trim(),
  no_sew: String(r[idx.no_sew_candidate] || '').trim().toUpperCase(),
  target_keyword: String(r[idx.target_keyword] || '').trim(),
  volume: String(r[idx.keyword_volume] || '').trim(),
  difficulty: String(r[idx.keyword_difficulty] || '').trim(),
}))

const noSew = rows.filter((r) => r.no_sew === 'YES')
const withKw = rows.filter((r) => r.target_keyword)
console.log(
  JSON.stringify(
    {
      total: rows.length,
      noSewCount: noSew.length,
      noSewSlugs: noSew.map((r) => r.slug),
      withKeywordCount: withKw.length,
      withKeyword: withKw.map((r) => ({
        slug: r.slug,
        title: r.title,
        target_keyword: r.target_keyword,
        volume: r.volume,
        difficulty: r.difficulty,
      })),
      emptyKeywordCount: rows.length - withKw.length,
      emptyKeywordSlugs: rows.filter((r) => !r.target_keyword).map((r) => r.slug),
    },
    null,
    2,
  ),
)
fs.writeFileSync(
  'exports/keyword-slugs-with-target.json',
  JSON.stringify(withKw, null, 2),
)
