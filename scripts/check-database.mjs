/**
 * Checks whether the new Supabase database has been initialized.
 * Reads credentials from .env.local — never prints secrets.
 * Run: node scripts/check-database.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

function loadEnv() {
  const path = join(import.meta.dirname, '..', '.env.local')
  if (!existsSync(path)) throw new Error('Missing .env.local')
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, '')
  }
  return env
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const projectRef = new URL(url).hostname.split('.')[0]
console.log(`Checking Supabase project: ${projectRef}`)

const headers = { apikey: key, Authorization: `Bearer ${key}` }

async function check(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, { headers })
  if (res.status === 404 || res.status === 400) {
    const body = await res.text()
    if (body.includes('does not exist') || body.includes('relation')) return { ok: false, reason: 'table missing' }
  }
  if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` }
  const data = await res.json()
  return { ok: true, count: data.length }
}

const tables = ['categories', 'products', 'site_settings', 'profiles']
let ready = true

for (const t of tables) {
  const result = await check(t)
  if (result.ok) {
    console.log(`  ✓ ${t} — accessible`)
  } else {
    console.log(`  ✗ ${t} — ${result.reason}`)
    ready = false
  }
}

if (!ready) {
  console.log('\nDatabase not initialized. Run supabase/full-setup.sql in Supabase SQL Editor:')
  console.log(`  https://supabase.com/dashboard/project/${projectRef}/sql/new`)
  console.log('\nSteps:')
  console.log('  1. node scripts/build-setup-sql.mjs')
  console.log('  2. Paste supabase/full-setup.sql into SQL Editor → Run')
  process.exit(1)
}

console.log('\nDatabase is ready.')
process.exit(0)
