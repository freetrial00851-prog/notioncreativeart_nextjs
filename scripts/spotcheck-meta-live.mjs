const slugs = [
  'corgi-amigurumi-crochet-pattern',
  'amigurumi-bear-trio-crochet-pattern',
  'plush-koala-amigurumi-crochet-pattern',
  'zebra-rattle-amigurumi-crochet-pattern',
]

const expected = {
  'corgi-amigurumi-crochet-pattern':
    'Crochet a keychain-sized corgi worked in one continuous piece, no sewing required. Easy PDF pattern — a charming gift for dog lovers.',
  'amigurumi-bear-trio-crochet-pattern':
    'Crochet a matching trio of panda, brown, and white amigurumi bears from one easy base pattern. Instant PDF — perfect keychains or bag charms.',
  'plush-koala-amigurumi-crochet-pattern':
    'Crochet a huggable koala with fuzzy little ears, written row-by-row in US terms. Intermediate PDF pattern — a soft handmade gift.',
  'zebra-rattle-amigurumi-crochet-pattern':
    'Crochet a zebra rattle with a soft crocheted head on a wooden ring base and yarn mane. Easy PDF pattern — a sweet first baby gift.',
}

function metaDesc(html) {
  const re1 = /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  const re2 = /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i
  const m = html.match(re1) || html.match(re2)
  return m ? m[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"') : null
}

const results = []
for (const slug of slugs) {
  const url = `https://notioncreativeart.com/pattern/${slug}`
  const res = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 meta-check', 'cache-control': 'no-cache' },
  })
  const html = await res.text()
  const desc = metaDesc(html)
  const exp = expected[slug]
  results.push({
    slug,
    status: res.status,
    liveDesc: desc,
    matchesExpected: desc === exp,
    startsWithExpected: desc?.startsWith(exp.slice(0, 40)) ?? false,
    len: desc?.length ?? 0,
  })
}
console.log(JSON.stringify(results, null, 2))
