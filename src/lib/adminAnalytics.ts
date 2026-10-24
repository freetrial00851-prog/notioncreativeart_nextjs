/**
 * Admin analytics data layer. Every call goes through admin-only SECURITY DEFINER RPCs
 * defined in supabase/admin-analytics.sql. If they are not installed yet the calls
 * resolve to `{ missing: true }` so the UI can show a "setup needed" card instead of breaking.
 */
import { supabase } from './supabase'

export type DailyRow = {
  day: string
  views: number
  visitors: number
  signups: number
  orders: number
  revenue: number
  refunds: number
  refund_value: number
  free_claims: number
  wishlist_adds: number
  cart_adds: number
  newsletter: number
}
export type Funnel = { sessions: number; view_item: number; add_to_cart: number; begin_checkout: number; orders: number }
export type Traffic = {
  top_pages: { path: string; views: number }[]
  sources: { source: string; sessions: number; cart_adds: number; checkouts: number }[]
  campaigns: { campaign: string; source: string; sessions: number }[]
  devices: { device: string; sessions: number }[]
  countries: { country: string; sessions: number }[]
  landing_pages: { path: string; sessions: number }[]
}
export type SearchTerm = { term: string; searches: number; zero_results: number; avg_results: number }
export type Live = { active_visitors: number; recent: { event_name: string; path: string | null; created_at: string }[] }
export type Customer = {
  /** null for a guest buyer (paid without an account). */
  user_id: string | null
  is_guest?: boolean
  email: string
  name: string | null
  joined: string
  last_sign_in: string | null
  orders: number
  revenue: number
  free_claims: number
  wishlist_items: number
  cart_items: number
  reviews: number
  newsletter: boolean
  total_count: number
}
export type WishlistRow = {
  user_id: string
  email: string
  name: string | null
  product_id: string
  title: string
  slug: string
  price: number
  added_at: string
  bought: boolean
  total_count: number
}
export type CartRow = {
  user_id: string
  email: string
  name: string | null
  items: { product_id: string; title: string; slug: string; price: number }[]
  item_count: number
  value: number
  updated_at: string
  abandoned: boolean
}
export type ProductRow = {
  product_id: string
  title: string
  slug: string
  price: number
  views: number
  wishlist_adds: number
  wishlist_total: number
  cart_adds: number
  orders: number
  free_claims: number
  revenue: number
}
export type Health = {
  version: number
  events_total: number
  events_24h: number
  last_event_at: string | null
  page_views_total: number
  users_total: number
}
export type CustomerDetail = Record<string, unknown> & {
  profile?: Record<string, unknown> | null
  orders?: Record<string, unknown>[]
  wishlist?: Record<string, unknown>[]
  cart?: Record<string, unknown>[]
  downloads?: Record<string, unknown>[]
  reviews?: Record<string, unknown>[]
  events?: { event_name: string; path: string | null; created_at: string }[]
}

export type Result<T> = { ok: true; data: T } | { ok: false; missing: boolean; message: string }

export type CustomerQuery = { search?: string; segment?: string; sort?: string; limit?: number; offset?: number }

export interface AnalyticsSource {
  health(): Promise<Result<Health>>
  daily(from: Date, to: Date): Promise<Result<DailyRow[]>>
  funnel(from: Date, to: Date): Promise<Result<Funnel>>
  traffic(from: Date, to: Date): Promise<Result<Traffic>>
  searchTerms(from: Date, to: Date): Promise<Result<SearchTerm[]>>
  live(): Promise<Result<Live>>
  customers(q: CustomerQuery): Promise<Result<Customer[]>>
  customerDetail(id: string): Promise<Result<CustomerDetail>>
  guestDetail(email: string): Promise<Result<CustomerDetail>>
  wishlists(onlyUnbought: boolean, limit: number, offset: number): Promise<Result<WishlistRow[]>>
  carts(): Promise<Result<CartRow[]>>
  topProducts(from: Date, to: Date): Promise<Result<ProductRow[]>>
}

const num = (v: unknown) => (v == null ? 0 : Number(v))

async function call<T>(fn: string, args: Record<string, unknown>, map: (d: unknown) => T): Promise<Result<T>> {
  try {
    const { data, error } = await supabase.rpc(fn, args)
    if (error) {
      const missing = error.code === 'PGRST202' || error.code === '42883' || /could not find the function|does not exist/i.test(error.message)
      return { ok: false, missing, message: error.message }
    }
    return { ok: true, data: map(data) }
  } catch (e) {
    return { ok: false, missing: false, message: e instanceof Error ? e.message : 'Request failed' }
  }
}

const tz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
const iso = (d: Date) => d.toISOString()
const rows = <T,>(d: unknown): T[] => (Array.isArray(d) ? (d as T[]) : [])

const realSource: AnalyticsSource = {
  health: () => call('admin_health', {}, (d) => d as Health),
  daily: (from, to) =>
    call('admin_daily', { p_from: iso(from), p_to: iso(to), p_tz: tz() }, (d) =>
      rows<Record<string, unknown>>(d).map((r) => ({
        day: String(r.day),
        views: num(r.views),
        visitors: num(r.visitors),
        signups: num(r.signups),
        orders: num(r.orders),
        revenue: num(r.revenue),
        refunds: num(r.refunds),
        refund_value: num(r.refund_value),
        free_claims: num(r.free_claims),
        wishlist_adds: num(r.wishlist_adds),
        cart_adds: num(r.cart_adds),
        newsletter: num(r.newsletter),
      })),
    ),
  funnel: (from, to) => call('admin_funnel', { p_from: iso(from), p_to: iso(to) }, (d) => d as Funnel),
  traffic: (from, to) =>
    call('admin_traffic', { p_from: iso(from), p_to: iso(to) }, (d) => {
      const t = (d ?? {}) as Partial<Traffic>
      return {
        top_pages: t.top_pages ?? [],
        sources: t.sources ?? [],
        campaigns: t.campaigns ?? [],
        devices: t.devices ?? [],
        countries: t.countries ?? [],
        landing_pages: t.landing_pages ?? [],
      }
    }),
  searchTerms: (from, to) => call('admin_search_terms', { p_from: iso(from), p_to: iso(to) }, (d) => rows<SearchTerm>(d)),
  live: () =>
    call('admin_live', { p_minutes: 5 }, (d) => {
      // The database sends { at, event }; the page reads { created_at, event_name }.
      const raw = (d ?? {}) as { active_visitors?: number; recent?: { at?: string; created_at?: string; event?: string; event_name?: string; path?: string | null }[] }
      return {
        active_visitors: Number(raw.active_visitors ?? 0),
        recent: (raw.recent ?? []).map((e) => ({
          event_name: String(e.event_name ?? e.event ?? 'event'),
          path: e.path ?? null,
          created_at: String(e.created_at ?? e.at ?? ''),
        })),
      } as Live
    }),
  customers: (q) =>
    call(
      'admin_customers',
      { p_search: q.search || null, p_segment: q.segment ?? 'all', p_sort: q.sort ?? 'joined', p_limit: q.limit ?? 25, p_offset: q.offset ?? 0 },
      (d) => rows<Customer>(d),
    ),
  customerDetail: (id) => call('admin_customer_detail', { p_user_id: id }, (d) => (d ?? {}) as CustomerDetail),
  guestDetail: (email) => call('admin_guest_detail', { p_email: email }, (d) => (d ?? {}) as CustomerDetail),
  wishlists: (onlyUnbought, limit, offset) =>
    call('admin_wishlists', { p_only_unbought: onlyUnbought, p_limit: limit, p_offset: offset }, (d) => rows<WishlistRow>(d)),
  carts: () => call('admin_carts', { p_abandon_hours: 24 }, (d) => rows<CartRow>(d)),
  topProducts: (from, to) => call('admin_top_products', { p_from: iso(from), p_to: iso(to) }, (d) => rows<ProductRow>(d)),
}

let source: AnalyticsSource = realSource
/** Dev preview only: swap in mock data. */
export function setAnalyticsSource(s: AnalyticsSource) {
  source = s
}
export const analytics: AnalyticsSource = new Proxy({} as AnalyticsSource, {
  get: (_t, k) => (source as unknown as Record<string, unknown>)[k as string],
})

export const RANGES = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
] as const
export type RangeId = (typeof RANGES)[number]['id']

/** Current window + the equally long window right before it (for “vs previous” deltas). */
export function rangeWindows(id: RangeId, now = new Date()) {
  const days = RANGES.find((r) => r.id === id)!.days
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  const start = new Date(end)
  start.setDate(start.getDate() - days)
  const prevStart = new Date(start)
  prevStart.setDate(prevStart.getDate() - days)
  return { start, end, prevStart, prevEnd: start, days }
}

export const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`
export const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(a / b < 0.1 ? 1 : 0)}%` : '—')
export function delta(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? 0 : null
  return Math.round(((cur - prev) / prev) * 100)
}
export function timeAgo(isoStr: string | null | undefined) {
  if (!isoStr) return '—'
  const m = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 30 ? `${d}d ago` : new Date(isoStr).toLocaleDateString()
}
