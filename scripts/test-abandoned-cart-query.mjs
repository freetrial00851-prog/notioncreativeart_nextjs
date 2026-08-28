/**
 * Verify abandoned-cart candidate query logic against the live database.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   node scripts/test-abandoned-cart-query.mjs
 *   node scripts/test-abandoned-cart-query.mjs --user-id <uuid>
 *
 * With --user-id, temporarily sets that user's cart updated_at to 25h ago,
 * runs the RPC, then restores updated_at.
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  try {
    const raw = readFileSync(join(import.meta.dirname, '..', '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '')
    }
  } catch {
    /* optional */
  }
}

loadEnv()

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)
const userIdArg = process.argv.includes('--user-id')
  ? process.argv[process.argv.indexOf('--user-id') + 1]
  : null

async function runRpc(label) {
  const { data, error } = await supabase.rpc('get_abandoned_cart_candidates')
  if (error) {
    console.error(`[${label}] RPC error:`, error.message)
    return null
  }
  console.log(`[${label}] candidates (${data?.length ?? 0}):`)
  console.log(JSON.stringify(data, null, 2))
  return data
}

async function main() {
  if (!userIdArg) {
    await runRpc('baseline')
    console.log('\nTip: pass --user-id <uuid> to simulate a 25h-old cart for a test account.')
    return
  }

  const userId = userIdArg
  const { data: beforeRows, error: beforeErr } = await supabase
    .from('cart_items')
    .select('product_id, updated_at')
    .eq('user_id', userId)

  if (beforeErr) {
    console.error('cart_items lookup failed:', beforeErr.message)
    process.exit(1)
  }
  if (!beforeRows?.length) {
    console.error('No cart_items for user — add items to cart first.')
    process.exit(1)
  }

  console.log(`Simulating abandonment for user ${userId} (${beforeRows.length} item(s))…`)

  const staleAt = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
  const { error: staleErr } = await supabase
    .from('cart_items')
    .update({ updated_at: staleAt })
    .eq('user_id', userId)

  if (staleErr) {
    console.error('Failed to set stale updated_at:', staleErr.message)
    process.exit(1)
  }

  const candidates = await runRpc('stale-25h')
  const found = (candidates ?? []).some((c) => c.user_id === userId)
  console.log(found ? '✓ Test user IS a candidate (expected)' : '✗ Test user NOT found (unexpected)')

  const freshAt = new Date().toISOString()
  await supabase.from('cart_items').update({ updated_at: freshAt }).eq('user_id', userId)
  const freshCandidates = await runRpc('fresh-2h-equivalent')
  const stillFound = (freshCandidates ?? []).some((c) => c.user_id === userId)
  console.log(stillFound ? '✗ Still a candidate after refresh (unexpected)' : '✓ Excluded after fresh updated_at (expected)')

  await supabase.from('cart_items').update({ updated_at: staleAt }).eq('user_id', userId)
  await supabase.from('cart_abandoned_reminders').insert({ user_id: userId, item_count: beforeRows.length })
  const remindedCandidates = await runRpc('reminded-within-7d')
  const foundAfterReminder = (remindedCandidates ?? []).some((c) => c.user_id === userId)
  console.log(
    foundAfterReminder
      ? '✗ Still a candidate after reminder log (unexpected)'
      : '✓ Excluded after 7-day reminder log (expected)',
  )

  // Restore original timestamps
  for (const row of beforeRows) {
    await supabase
      .from('cart_items')
      .update({ updated_at: row.updated_at })
      .eq('user_id', userId)
      .eq('product_id', row.product_id)
  }
  console.log('\nRestored original cart_items.updated_at values.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
