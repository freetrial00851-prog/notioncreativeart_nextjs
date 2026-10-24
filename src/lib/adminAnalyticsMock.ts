/** Dev-only sample data so the admin analytics pages can be previewed without a database. */
import type { AnalyticsSource, DailyRow, Customer, ProductRow } from './adminAnalytics'

const ok = <T,>(data: T) => Promise.resolve({ ok: true as const, data })
const titles = ['Floral Crochet Blanket', 'Amigurumi Bunny', 'Granny Square Bag', 'Cable Knit Beanie', 'Lace Doily Set', 'Baby Booties']

function daily(from: Date, to: Date, k = 1): DailyRow[] {
  const out: DailyRow[] = []
  for (let d = new Date(from), i = 0; d < to; d.setDate(d.getDate() + 1), i++) {
    const w = 0.6 + 0.4 * Math.abs(Math.sin(i / 3))
    const orders = Math.round(w * 4 * k)
    out.push({
      day: d.toISOString().slice(0, 10), views: Math.round(w * 420 * k), visitors: Math.round(w * 160 * k), signups: Math.round(w * 3),
      orders, revenue: orders * 7.5, refunds: i % 11 === 0 ? 1 : 0, refund_value: i % 11 === 0 ? 7.5 : 0,
      free_claims: Math.round(w * 6), wishlist_adds: Math.round(w * 9), cart_adds: Math.round(w * 12), newsletter: Math.round(w * 4),
    })
  }
  return out
}
const customers: Customer[] = Array.from({ length: 8 }, (_, i) => ({
  user_id: `u${i}`, email: `customer${i + 1}@example.com`, name: i % 3 ? `Customer ${i + 1}` : null,
  joined: new Date(Date.now() - i * 86400000 * 3).toISOString(), last_sign_in: null, orders: i % 4, revenue: (i % 4) * 7.5,
  free_claims: i % 3, wishlist_items: i % 5, cart_items: i % 2, reviews: i % 2, newsletter: i % 2 === 0, total_count: 8,
}))
const products: ProductRow[] = titles.map((t, i) => ({
  product_id: `p${i}`, title: t, slug: t.toLowerCase().replace(/ /g, '-'), price: 5 + i, views: 900 - i * 120, wishlist_adds: 40 - i * 5,
  wishlist_total: 120 - i * 15, cart_adds: 60 - i * 8, orders: 22 - i * 3, free_claims: i % 2 ? 5 : 0, revenue: (22 - i * 3) * (5 + i),
}))

export const mockSource: AnalyticsSource = {
  health: () => ok({ version: 1, events_total: 18420, events_24h: 612, last_event_at: new Date().toISOString(), page_views_total: 90210, users_total: 342 }),
  daily: (f, t) => ok(daily(f, t, f.getTime() < Date.now() - 31 * 86400000 ? 0.85 : 1)),
  funnel: () => ok({ sessions: 4800, view_item: 3100, add_to_cart: 640, begin_checkout: 290, orders: 210 }),
  traffic: () => ok({
    top_pages: [{ path: '/', views: 5200 }, { path: '/product/amigurumi-bunny', views: 1800 }, { path: '/search', views: 900 }],
    sources: [{ source: 'pinterest.com', sessions: 2100, cart_adds: 310, checkouts: 140 }, { source: 'direct', sessions: 1500, cart_adds: 180, checkouts: 90 }, { source: 'google', sessions: 900, cart_adds: 120, checkouts: 55 }],
    campaigns: [{ campaign: 'spring_sale', source: 'newsletter', sessions: 430 }],
    devices: [{ device: 'mobile', sessions: 3100 }, { device: 'desktop', sessions: 1400 }, { device: 'tablet', sessions: 300 }],
    countries: [{ country: 'US', sessions: 2600 }, { country: 'GB', sessions: 700 }, { country: 'CA', sessions: 500 }],
    landing_pages: [{ path: '/', sessions: 2400 }, { path: '/product/granny-square-bag', sessions: 700 }],
  }),
  searchTerms: () => ok([{ term: 'baby blanket', searches: 88, zero_results: 0, avg_results: 12.4 }, { term: 'tunisian crochet', searches: 41, zero_results: 41, avg_results: 0 }, { term: 'bunny', searches: 30, zero_results: 0, avg_results: 3 }]),
  live: () => ok({ active_visitors: 7, recent: [{ event_name: 'add_to_cart', path: '/product/amigurumi-bunny', created_at: new Date().toISOString() }, { event_name: 'search', path: '/search', created_at: new Date(Date.now() - 90000).toISOString() }] }),
  customers: () => ok(customers),
  customerDetail: () => ok({
    profile: { email: 'customer2@example.com', first_name: 'Customer', last_name: '2', created_at: new Date(Date.now() - 9 * 86400000).toISOString(), last_sign_in_at: new Date().toISOString(), billing_country: 'US' },
    newsletter: true,
    orders: [{ id: 'o1', amount: 7.5, status: 'completed', created_at: new Date(Date.now() - 86400000).toISOString(), items: [{ title: 'Amigurumi Bunny' }] }],
    wishlist: [{ title: 'Lace Doily Set', added_at: new Date(Date.now() - 3600000).toISOString(), bought: false }],
    cart: [{ title: 'Baby Booties', price: 9, added_at: new Date(Date.now() - 7200000).toISOString() }],
    downloads: [{ title: 'Amigurumi Bunny', kind: 'paid', at: new Date().toISOString() }],
    reviews: [{ title: 'Amigurumi Bunny', rating: 5, status: 'approved', body: 'Lovely pattern!' }],
    events: [{ at: new Date().toISOString(), event: 'view_item', path: '/product/x', product: 'Lace Doily Set' }],
  } as never),
  guestDetail: () => ok({
    guest: true,
    profile: { email: 'guest@example.com', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    newsletter: false,
    orders: [{ id: 'g1', amount: 5.43, status: 'paid', created_at: new Date(Date.now() - 86400000).toISOString(), items: [{ title: 'Amigurumi Bunny' }] }],
  } as never),
  wishlists: () => ok(customers.slice(0, 5).map((c, i) => ({ user_id: c.user_id ?? 'guest', email: c.email, name: c.name, product_id: `p${i}`, title: titles[i], slug: 'x', price: 6, added_at: new Date(Date.now() - i * 5e6).toISOString(), bought: i === 3, total_count: 5 }))),
  carts: () => ok(customers.slice(0, 3).map((c, i) => ({ user_id: c.user_id ?? 'guest', email: c.email, name: c.name, items: [{ product_id: 'p', title: titles[i], slug: 'x', price: 6 }], item_count: 1, value: 6 + i, updated_at: new Date(Date.now() - i * 40 * 3600000).toISOString(), abandoned: i > 0 }))),
  topProducts: () => ok(products),
}
