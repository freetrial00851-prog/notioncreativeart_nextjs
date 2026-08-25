/** Print deploy bundle JSON for one Edge Function (stdout). */
import fs from 'node:fs'
import path from 'node:path'

const name = process.argv[2]
if (!name) {
  console.error('Usage: node scripts/bundle-edge-function.mjs <function-name>')
  process.exit(1)
}

const root = path.join(process.cwd(), 'supabase', 'functions')
const index = fs.readFileSync(path.join(root, name, 'index.ts'), 'utf8')
const shared = fs.readFileSync(path.join(root, '_shared', 'cors.ts'), 'utf8')

const verifyJwtByName = {
  'create-cart-checkout': true,
  'download-order-receipt': true,
  'admin-refund-order': true,
  'chat-support': false,
  'subscribe-newsletter': false,
  'download-free-pattern': false,
  'chat-escalate': false,
}

console.log(
  JSON.stringify({
    project_id: 'anlsellghialszuuvipw',
    name,
    entrypoint_path: 'index.ts',
    verify_jwt: verifyJwtByName[name] ?? false,
    files: [
      { name: 'index.ts', content: index },
      { name: '../_shared/cors.ts', content: shared },
    ],
  }),
)
