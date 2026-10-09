import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv(path) {
  const env = {}
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    let v = line.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    env[line.slice(0, i).trim()] = v
  }
  return env
}

/** Minimal CSV parser for slug,meta_description (handles quoted fields). */
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

const env = loadEnv('.env.local')
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Missing Supabase credentials')

const csvPath = process.argv[2] || 'C:/Users/Muhammad Sufyan/Desktop/meta-descriptions.csv'
const table = parseCsv(fs.readFileSync(csvPath, 'utf8'))
const header = table[0].map((h) => h.trim().toLowerCase())
const slugIdx = header.indexOf('slug')
const descIdx = header.indexOf('meta_description')
if (slugIdx < 0 || descIdx < 0) throw new Error('CSV must have slug and meta_description columns')

const entries = table.slice(1).map((r) => ({
  slug: String(r[slugIdx] ?? '').trim(),
  meta_description: String(r[descIdx] ?? '').trim(),
}))

const sb = createClient(url, key)

const updated = []
const unmatched = []
const failed = []

for (const row of entries) {
  if (!row.slug || !row.meta_description) {
    failed.push({ slug: row.slug || '(empty)', reason: 'missing slug or meta_description' })
    continue
  }
  const { data, error } = await sb
    .from('products')
    .update({ meta_description: row.meta_description })
    .eq('slug', row.slug)
    .eq('active', true)
    .select('id, slug, meta_description')

  if (error) {
    failed.push({ slug: row.slug, reason: error.message })
    continue
  }
  if (!data || data.length === 0) {
    unmatched.push(row.slug)
    continue
  }
  updated.push({
    slug: data[0].slug,
    id: data[0].id,
    meta_description: data[0].meta_description,
    len: (data[0].meta_description || '').length,
  })
}

console.log(
  JSON.stringify(
    {
      csvRows: entries.length,
      updated: updated.length,
      unmatched,
      failed,
      sampleUpdated: updated.slice(0, 5).map((u) => ({ slug: u.slug, len: u.len })),
      spotCheckSlugs: updated
        .map((u) => u.slug)
        .sort(() => Math.random() - 0.5)
        .slice(0, 4),
    },
    null,
    2,
  ),
)
