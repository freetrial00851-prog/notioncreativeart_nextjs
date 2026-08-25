/**
 * Bundles each Edge Function with _shared/cors.ts for Supabase MCP-style deploy.
 * Run: node scripts/deploy-edge-functions.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.join(process.cwd(), 'supabase', 'functions')
const shared = fs.readFileSync(path.join(root, '_shared', 'cors.ts'), 'utf8')
const names = [
  'chat-support',
  'create-cart-checkout',
  'download-free-pattern',
  'subscribe-newsletter',
  'chat-escalate',
  'download-order-receipt',
  'admin-refund-order',
]

for (const name of names) {
  const index = fs.readFileSync(path.join(root, name, 'index.ts'), 'utf8')
  console.log(`\n=== ${name} ===`)
  console.log(JSON.stringify({ name, indexBytes: index.length, sharedBytes: shared.length }))
}
