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
      Origin: SITE,
      ...headers,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  return { status: res.status, json }
}

console.log('--- M8 auth-rate-limit: login ok ---')
const a1 = await post('auth-rate-limit', { action: 'login', email: `rate-test-${Date.now()}@example.com` })
console.log(a1.status, a1.json)

console.log('--- M8 auth-rate-limit: invalid action ---')
const a2 = await post('auth-rate-limit', { action: 'hack' })
console.log(a2.status, a2.json)

console.log('--- M9 chat-escalate honeypot (filled company) -> fake ok, no real send ---')
const h = await post('chat-escalate', {
  email: 'bot@example.com',
  message: 'spam spam spam',
  company: 'Acme Bot Corp',
})
console.log(h.status, h.json)

console.log('--- M9 chat-escalate empty company + short message -> validation ---')
const v = await post('chat-escalate', {
  email: 'real@example.com',
  message: 'hi',
  company: '',
})
console.log(v.status, v.json)

console.log('--- newsletter regression ---')
const nl = await post('subscribe-newsletter', { email: `batch2-${Date.now()}@example.com` })
console.log(nl.status, nl.json.ok || nl.json.error)
