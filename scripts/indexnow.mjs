// Tells Bing (and other IndexNow search engines) that pages are new or changed.
// Usage:  node scripts/indexnow.mjs                 -> every URL in the live sitemap
//         node scripts/indexnow.mjs /pattern/some-slug /shop/amigurumi   -> only these paths
// The key file lives in /public (named after the key) and is public by design.
const HOST = 'notioncreativeart.com'
const KEY = '6a17bc9c9fc4749d02fdb7884a869b43'
const SITE = `https://${HOST}`

async function sitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`)
  if (!res.ok) throw new Error(`sitemap.xml answered ${res.status}`)
  const xml = await res.text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())
}

const args = process.argv.slice(2)
const urlList = args.length ? args.map((p) => (p.startsWith('http') ? p : `${SITE}${p}`)) : await sitemapUrls()
const unique = [...new Set(urlList)].filter((u) => u.startsWith(SITE))

const keyCheck = await fetch(`${SITE}/${KEY}.txt`)
if (!keyCheck.ok || (await keyCheck.text()).trim() !== KEY) {
  console.error(`The key file is not live yet at ${SITE}/${KEY}.txt (status ${keyCheck.status}). Deploy first.`)
  process.exit(1)
}

const res = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: unique }),
})
console.log(`IndexNow: sent ${unique.length} URLs, answer ${res.status} ${res.statusText}`)
// 200 or 202 means accepted. 400/403/422 mean the key file or the URLs were rejected.
if (![200, 202].includes(res.status)) process.exit(1)
