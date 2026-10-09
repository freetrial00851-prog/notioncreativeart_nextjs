import fs from 'fs'

function parse(csv) {
  const rows = []
  let row = []
  let cur = ''
  let q = false
  const s = csv.replace(/^\uFEFF/, '')
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
  return rows.filter((r) => r.some((cell) => cell !== ''))
}

const full = parse(fs.readFileSync('exports/active-products-meta-export.csv', 'utf8'))
const miss = parse(fs.readFileSync('exports/active-products-missing-meta-description.csv', 'utf8'))
console.log(
  JSON.stringify(
    {
      fullDataRows: full.length - 1,
      missingDataRows: miss.length - 1,
      fullCols: full[0].length,
      yesCount: full.slice(1).filter((r) => r[7] === 'YES').length,
      noCount: full.slice(1).filter((r) => r[7] === 'NO').length,
    },
    null,
    2,
  ),
)
