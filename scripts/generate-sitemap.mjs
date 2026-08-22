// Generates public/sitemap.xml before each build, so it's always up to date
// with whatever products are currently active — run automatically via the
// "prebuild" npm script, no manual step needed.
import { writeFileSync, readFileSync, existsSync } from 'fs'

function loadEnvLocal() {
  if (!existsSync('.env.local')) return {}
  const content = readFileSync('.env.local', 'utf-8')
  const env = {}
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (match) env[match[1]] = match[2].trim()
  }
  return env
}
const env = loadEnvLocal()

const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY
const SITE_URL = 'https://notioncreativeart.com'

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/shop', priority: '0.9', changefreq: 'daily' },
  { path: '/shop/amigurumi', priority: '0.7', changefreq: 'weekly' },
  { path: '/shop/wearables', priority: '0.7', changefreq: 'weekly' },
  { path: '/shop/home-decor', priority: '0.7', changefreq: 'weekly' },
  { path: '/shop/bundles', priority: '0.7', changefreq: 'weekly' },
  { path: '/shop/new', priority: '0.6', changefreq: 'daily' },
  { path: '/shop/sale', priority: '0.6', changefreq: 'daily' },
  { path: '/faq', priority: '0.3', changefreq: 'monthly' },
  { path: '/about', priority: '0.3', changefreq: 'monthly' },
  { path: '/contact', priority: '0.3', changefreq: 'monthly' },
  { path: '/refund-policy', priority: '0.2', changefreq: 'monthly' },
  { path: '/terms', priority: '0.2', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.2', changefreq: 'monthly' },
]

async function main() {
  const urls = [...STATIC_ROUTES.map((r) => ({ ...r, lastmod: null }))]

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=slug,created_at&active=eq.true`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      })
      if (res.ok) {
        const products = await res.json()
        for (const p of products) {
          urls.push({ path: `/pattern/${p.slug}`, priority: '0.8', changefreq: 'weekly', lastmod: p.created_at?.slice(0, 10) })
        }
        console.log(`sitemap: included ${products.length} product pages`)
      } else {
        console.warn(`sitemap: could not fetch products (HTTP ${res.status} ${res.statusText}), generating static routes only`)
        console.warn(await res.text())
      }
    } catch (err) {
      console.warn('sitemap: fetch failed, generating static routes only:', err.message, err.cause?.message ?? '')
    }
  } else {
    console.warn('sitemap: VITE_SUPABASE_URL/ANON_KEY not found in .env.local, generating static routes only')
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.path}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>
`
  writeFileSync('public/sitemap.xml', xml)
  console.log(`sitemap: wrote public/sitemap.xml with ${urls.length} URLs total`)
}

main()
