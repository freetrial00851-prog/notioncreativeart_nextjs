const BASE = 'https://anlsellghialszuuvipw.supabase.co'
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubHNlbGxnaGlhbHN6dXV2aXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MDMzMTAsImV4cCI6MjEwMjk3OTMxMH0.-M-RRdAIfjWePGvAJOvcMWuxcZvhRQY9r0LinqpvaI4'
const SITE = 'https://notioncreativeartnextjs.vercel.app'

async function post(fn, body, headers = {}) {
  const res = await fetch(`${BASE}/functions/v1/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON}`,
      apikey: ANON,
      ...headers,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { status: res.status, json, acao: res.headers.get('access-control-allow-origin') }
}

console.log('--- H3 CORS: evil origin blocked ---')
const evil = await post('subscribe-newsletter', { email: 'test@example.com' }, { Origin: 'https://evil.example' })
console.log('evil origin status', evil.status, evil.json.error || evil.json, 'acao', evil.acao)

console.log('--- H3 CORS: site origin allowed ---')
const good = await post('subscribe-newsletter', { email: `sec-test-${Date.now()}@example.com` }, { Origin: SITE })
console.log('site origin status', good.status, 'acao', good.acao, good.json.ok || good.json.error)

console.log('--- H1 checkout: anon JWT only -> expect 401 ---')
const checkout = await post('create-cart-checkout', { productIds: ['00000000-0000-0000-0000-000000000001'] }, { Origin: SITE })
console.log('checkout status', checkout.status, checkout.json.error || checkout.json)

console.log('--- H2 chat: order+email with anon JWT -> no downloads, authRequired ---')
const chat = await post(
  'chat-support',
  { messages: [{ role: 'user', content: 'My order 4328531 email engg.muhammadsufyan@gmail.com need download' }] },
  { Origin: SITE },
)
console.log('chat status', chat.status, 'downloads', chat.json.downloads, 'authRequired', chat.json.authRequired)

console.log('--- Regression: newsletter from site origin ---')
const nl = await post('subscribe-newsletter', { email: `regression-${Date.now()}@example.com` }, { Origin: SITE })
console.log('newsletter', nl.status, nl.json.ok ? 'ok' : nl.json.error)
