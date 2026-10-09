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

const env = loadEnv('.env.local')
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Missing Supabase URL or key in .env.local')

const sb = createClient(url, key)
const { data, error } = await sb
  .from('products')
  .select('id,slug,title,subtitle,description,meta_title,meta_description')
  .eq('active', true)
  .order('title')

if (error) throw error

function esc(v) {
  if (v === null || v === undefined || v === '') return ''
  const s = String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const rows = data.map((r) => {
  const metaTitle = r.meta_title?.trim() || null
  const metaDescription = r.meta_description?.trim() || null
  return {
    ...r,
    meta_title: metaTitle,
    meta_description: metaDescription,
    missing: !metaDescription,
  }
})

const headers = [
  'id',
  'slug',
  'title',
  'subtitle',
  'description',
  'meta_title',
  'meta_description',
  'missing_meta_description',
]
const lines = [headers.join(',')]
for (const r of rows) {
  lines.push(
    [
      esc(r.id),
      esc(r.slug),
      esc(r.title),
      esc(r.subtitle),
      esc(r.description),
      esc(r.meta_title),
      esc(r.meta_description),
      r.missing ? 'YES' : 'NO',
    ].join(','),
  )
}

fs.mkdirSync('exports', { recursive: true })
fs.writeFileSync('exports/active-products-meta-export.csv', `\uFEFF${lines.join('\n')}`, 'utf8')

const miss = rows.filter((r) => r.missing)
const mLines = [
  'id,slug,title,subtitle,description,meta_title,missing_meta_description',
]
for (const r of miss) {
  mLines.push(
    [
      esc(r.id),
      esc(r.slug),
      esc(r.title),
      esc(r.subtitle),
      esc(r.description),
      esc(r.meta_title),
      'YES',
    ].join(','),
  )
}
fs.writeFileSync(
  'exports/active-products-missing-meta-description.csv',
  `\uFEFF${mLines.join('\n')}`,
  'utf8',
)

console.log(
  JSON.stringify(
    {
      total: rows.length,
      missing_meta_description: miss.length,
      has_meta_description: rows.length - miss.length,
      fullCsv: 'exports/active-products-meta-export.csv',
      missingOnlyCsv: 'exports/active-products-missing-meta-description.csv',
    },
    null,
    2,
  ),
)
