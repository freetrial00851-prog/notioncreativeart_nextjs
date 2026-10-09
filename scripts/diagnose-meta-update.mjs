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
console.log({
  hasUrl: !!env.NEXT_PUBLIC_SUPABASE_URL,
  hasAnon: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  hasService: !!env.SUPABASE_SERVICE_ROLE_KEY,
})
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, key)
const { data, error } = await sb
  .from('products')
  .select('id, slug, meta_description, active')
  .eq('slug', 'corgi-amigurumi-crochet-pattern')
  .maybeSingle()
console.log({ data, error })

const upd = await sb
  .from('products')
  .update({ meta_description: 'TEST DESCRIPTION PLEASE IGNORE' })
  .eq('slug', 'corgi-amigurumi-crochet-pattern')
  .select('id, slug, meta_description')
console.log({ updData: upd.data, updError: upd.error, updCount: upd.data?.length })

// revert immediately if test wrote
if (upd.data?.length) {
  await sb
    .from('products')
    .update({ meta_description: null })
    .eq('slug', 'corgi-amigurumi-crochet-pattern')
  console.log('reverted test')
}
