'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  analytics,
  money,
  pct,
  delta,
  timeAgo,
  rangeWindows,
  RANGES,
  type RangeId,
  type DailyRow,
  type Funnel,
  type Traffic,
  type SearchTerm,
  type Live,
  type Customer,
  type CustomerDetail,
  type WishlistRow,
  type CartRow,
  type ProductRow,
  type Health,
  type Result,
} from '../lib/adminAnalytics'

const H1 = 'font-heading text-[22px] md:text-[24px] font-bold leading-tight text-ink'
const CARD = 'rounded-2xl border border-[#e4e1db] bg-white'
const TH = 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#777] whitespace-nowrap'
const TD = 'px-3 py-2.5 text-[13px] text-ink align-top'

/* ───────────────────────── shared bits ───────────────────────── */

function useLoad<T>(load: () => Promise<Result<T>>, deps: unknown[]) {
  const key = JSON.stringify(deps)
  const [done, setDone] = useState<{ key: string; res: Result<T> } | null>(null)
  useEffect(() => {
    let alive = true
    load().then((res) => alive && setDone({ key, res }))
    return () => {
      alive = false
    }
    // `load` is recreated every render; `key` captures the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return { loading: done?.key !== key, res: done?.res ?? null }
}

export function SetupNeeded({ what }: { what: string }) {
  return (
    <div className={`${CARD} p-5 border-dashed`}>
      <p className="text-[14px] font-semibold text-ink">Setup needed for {what}</p>
      <p className="mt-1 text-[13px] text-[#666] max-w-xl">
        The analytics functions are not installed in your database yet. Open the <Link href="/admin/setup" className="underline">Setup</Link> page for the 3 quick steps. Nothing else in the admin is affected.
      </p>
    </div>
  )
}

function Gate<T>({ state, what, children }: { state: { loading: boolean; res: Result<T> | null }; what: string; children: (d: T) => ReactNode }) {
  if (state.loading && !state.res) return <div className={`${CARD} h-32 animate-pulse bg-[#f3f1ec]`} aria-busy="true" />
  if (!state.res) return null
  if (!state.res.ok) {
    return state.res.missing ? (
      <SetupNeeded what={what} />
    ) : (
      <div className={`${CARD} p-5 text-[13px] text-sale`}>Could not load {what}: {state.res.message}</div>
    )
  }
  return <div className={state.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>{children(state.res.data)}</div>
}

function RangePicker({ value, onChange }: { value: RangeId; onChange: (r: RangeId) => void }) {
  return (
    <div className="inline-flex rounded-full border border-[#e4e1db] bg-white p-0.5" role="tablist" aria-label="Date range">
      {RANGES.map((r) => (
        <button
          key={r.id}
          role="tab"
          aria-selected={value === r.id}
          onClick={() => onChange(r.id)}
          className={`min-h-9 px-3.5 rounded-full text-[12px] font-medium transition-colors ${value === r.id ? 'bg-ink text-white' : 'text-[#555] hover:text-ink'}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

function Stat({ label, value, prev, current, hint, invert }: { label: string; value: string; prev?: number; current?: number; hint?: string; invert?: boolean }) {
  const d = prev != null && current != null ? delta(current, prev) : null
  const good = d == null ? null : invert ? d <= 0 : d >= 0
  return (
    <div className={`${CARD} p-4`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#777]">{label}</p>
      <p className="mt-1.5 text-[26px] leading-none font-bold text-ink tabular-nums">{value}</p>
      <p className="mt-2 text-[12px] h-4">
        {d != null && d !== 0 ? (
          <span className={good ? 'text-deal font-semibold' : 'text-sale font-semibold'}>
            {d > 0 ? '▲' : '▼'} {Math.abs(d)}%<span className="font-normal text-[#888]"> vs previous</span>
          </span>
        ) : d === 0 ? (
          <span className="text-[#888]">No change</span>
        ) : prev != null ? (
          <span className="text-[#888]">New this period</span>
        ) : (
          <span className="text-[#888]">{hint}</span>
        )}
      </p>
    </div>
  )
}

/** Simple SVG bar chart. */
function Bars({ rows, pick, format, label }: { rows: DailyRow[]; pick: (r: DailyRow) => number; format: (n: number) => string; label: string }) {
  const max = Math.max(1, ...rows.map(pick))
  const w = 100 / Math.max(rows.length, 1)
  return (
    <figure>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-40" role="img" aria-label={label}>
        {rows.map((r, i) => {
          const h = (pick(r) / max) * 36
          return (
            <rect key={r.day} x={i * w + w * 0.15} y={40 - h} width={w * 0.7} height={Math.max(h, pick(r) > 0 ? 0.6 : 0)} rx="0.4" fill="#111">
              <title>{`${r.day}: ${format(pick(r))}`}</title>
            </rect>
          )
        })}
      </svg>
      <figcaption className="mt-1 flex justify-between text-[11px] text-[#888]">
        <span>{rows[0]?.day}</span>
        <span>peak {format(max)}</span>
        <span>{rows[rows.length - 1]?.day}</span>
      </figcaption>
    </figure>
  )
}

function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: string }) {
  const isEmpty = Array.isArray(children) && children.length === 0
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px]">
        <thead className="border-b border-[#eceae5]">
          <tr>{head.map((h) => <th key={h} className={TH}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[#f1efea]">{children}</tbody>
      </table>
      {isEmpty && <p className="px-3 py-6 text-center text-[13px] text-[#888]">{empty ?? 'Nothing here yet.'}</p>}
    </div>
  )
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className={`${CARD} p-4 md:p-5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

const sum = (rows: DailyRow[], k: keyof DailyRow) => rows.reduce((a, r) => a + Number(r[k] || 0), 0)

/* ───────────────────────── Overview ───────────────────────── */

export function InsightsOverview() {
  const [range, setRange] = useState<RangeId>('30d')
  const w = useMemo(() => rangeWindows(range), [range])
  const cur = useLoad(() => analytics.daily(w.start, w.end), [w])
  const prev = useLoad(() => analytics.daily(w.prevStart, w.prevEnd), [w])
  const funnel = useLoad(() => analytics.funnel(w.start, w.end), [w])
  const [live, setLive] = useState<Result<Live> | null>(null)

  useEffect(() => {
    let alive = true
    const tick = () => analytics.live().then((r) => alive && setLive(r))
    tick()
    const id = setInterval(tick, 30000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={H1}>Overview</h1>
          <p className="text-[13px] text-[#777] mt-0.5">How the shop is doing, and who is doing what.</p>
        </div>
        <div className="flex items-center gap-3">
          {live?.ok && (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-[#555]" title="Visitors with activity in the last 5 minutes">
              <span className="h-2 w-2 rounded-full bg-deal animate-pulse" /> {live.data.active_visitors} online now
            </span>
          )}
          <RangePicker value={range} onChange={setRange} />
        </div>
      </div>

      <Gate state={cur} what="the overview">
        {(rows) => {
          const p = prev.res?.ok ? prev.res.data : null
          const pv = (k: keyof DailyRow) => (p ? sum(p, k) : undefined)
          const revenue = sum(rows, 'revenue')
          const orders = sum(rows, 'orders')
          const visitors = sum(rows, 'visitors')
          return (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Revenue" value={money(revenue)} current={revenue} prev={pv('revenue')} />
                <Stat label="Orders" value={String(orders)} current={orders} prev={pv('orders')} />
                <Stat label="Visitors" value={visitors.toLocaleString()} current={visitors} prev={pv('visitors')} hint="Needs cookie consent" />
                <Stat label="Conversion" value={pct(orders, visitors)} hint="Orders ÷ visitors" />
                <Stat label="Page views" value={sum(rows, 'views').toLocaleString()} current={sum(rows, 'views')} prev={pv('views')} />
                <Stat label="New accounts" value={String(sum(rows, 'signups'))} current={sum(rows, 'signups')} prev={pv('signups')} />
                <Stat label="Free downloads" value={String(sum(rows, 'free_claims'))} current={sum(rows, 'free_claims')} prev={pv('free_claims')} />
                <Stat label="Refunds" value={String(sum(rows, 'refunds'))} current={sum(rows, 'refunds')} prev={pv('refunds')} invert hint={sum(rows, 'refund_value') ? money(sum(rows, 'refund_value')) : undefined} />
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <Section title="Revenue per day"><Bars rows={rows} pick={(r) => r.revenue} format={money} label="Revenue per day" /></Section>
                <Section title="Visitors per day"><Bars rows={rows} pick={(r) => r.visitors} format={(n) => String(n)} label="Visitors per day" /></Section>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <Section title="Shopper journey" aside={<span className="text-[11px] text-[#888]">sessions that accepted cookies</span>}>
                  <Gate state={funnel} what="the funnel">{(f) => <FunnelView f={f} />}</Gate>
                </Section>
                <Section title="Interest signals">
                  <dl className="grid grid-cols-3 gap-3 text-center">
                    {[
                      ['Saved to wishlist', sum(rows, 'wishlist_adds')],
                      ['Added to cart', sum(rows, 'cart_adds')],
                      ['Newsletter', sum(rows, 'newsletter')],
                    ].map(([k, v]) => (
                      <div key={String(k)} className="rounded-xl bg-[#f7f6f3] py-4">
                        <dd className="text-[22px] font-bold tabular-nums">{String(v)}</dd>
                        <dt className="text-[11px] text-[#777] mt-1">{k}</dt>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
                    <Link className="underline" href="/admin/saved">Who saved what →</Link>
                    <Link className="underline" href="/admin/customers">Customer profiles →</Link>
                  </div>
                </Section>
              </div>

              {live?.ok && live.data.recent?.length > 0 && (
                <Section title="Live activity">
                  <ul className="divide-y divide-[#f1efea]">
                    {live.data.recent.slice(0, 10).map((e, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                        <span className="font-medium">{e.event_name.replace(/_/g, ' ')}</span>
                        <span className="truncate text-[#777] flex-1">{e.path}</span>
                        <span className="text-[#999] text-[12px] shrink-0">{timeAgo(e.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )
        }}
      </Gate>
    </div>
  )
}

function FunnelView({ f }: { f: Funnel }) {
  const steps = [
    ['Visited', f.sessions],
    ['Viewed a product', f.view_item],
    ['Added to cart', f.add_to_cart],
    ['Started checkout', f.begin_checkout],
    ['Ordered', f.orders],
  ] as const
  const top = Math.max(1, steps[0][1])
  return (
    <ol className="space-y-2">
      {steps.map(([label, n], i) => (
        <li key={label}>
          <div className="flex justify-between text-[12px] mb-1">
            <span>{label}</span>
            <span className="tabular-nums text-[#555]">
              {n.toLocaleString()} {i > 0 && steps[i - 1][1] > 0 && <span className="text-[#999]">· {pct(n, steps[i - 1][1])}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#eeece7]"><div className="h-2 rounded-full bg-ink" style={{ width: `${Math.max((n / top) * 100, n > 0 ? 2 : 0)}%` }} /></div>
        </li>
      ))}
    </ol>
  )
}

/* ───────────────────────── Customers ───────────────────────── */

const SEGMENTS = [
  ['all', 'Everyone'],
  ['buyers', 'Paying customers'],
  ['free_only', 'Free downloads only'],
  ['wishlisters', 'Has wishlist'],
  ['cart', 'Has items in cart'],
  ['idle', 'Never ordered'],
] as const
const PAGE = 25

export function InsightsCustomers() {
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [segment, setSegment] = useState('all')
  const [sort, setSort] = useState('joined')
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim())
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const state = useLoad(() => analytics.customers({ search: q, segment, sort, limit: PAGE, offset: page * PAGE }), [q, segment, sort, page])

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className={H1}>Customers</h1>
        <p className="text-[13px] text-[#777] mt-0.5">Everyone who made an account. Open a row to see everything they did.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email"
          aria-label="Search customers"
          className="min-h-11 flex-1 min-w-[200px] rounded-full border border-[#e4e1db] bg-white px-4 text-[14px] outline-none focus:border-ink"
        />
        <select value={segment} onChange={(e) => { setSegment(e.target.value); setPage(0) }} aria-label="Segment" className="min-h-11 rounded-full border border-[#e4e1db] bg-white px-3 text-[13px]">
          {SEGMENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(0) }} aria-label="Sort" className="min-h-11 rounded-full border border-[#e4e1db] bg-white px-3 text-[13px]">
          <option value="joined">Newest first</option>
          <option value="revenue">Top spenders</option>
          <option value="orders">Most orders</option>
          <option value="last_seen">Last seen</option>
        </select>
      </div>

      <Gate state={state} what="customers">
        {(rows: Customer[]) => {
          const total = rows[0]?.total_count ?? 0
          return (
            <div className={CARD}>
              <Table head={['Customer', 'Joined', 'Orders', 'Spent', 'Free', 'Wishlist', 'Cart', 'Reviews']} empty="No customers match.">
                {rows.map((c) => (
                  <tr key={c.user_id} className="hover:bg-[#faf9f7] cursor-pointer" onClick={() => setOpen(c.user_id)}>
                    <td className={TD}>
                      <button className="text-left" onClick={() => setOpen(c.user_id)}>
                        <span className="block font-medium">{c.name || c.email}</span>
                        {c.name && <span className="block text-[12px] text-[#777]">{c.email}</span>}
                      </button>
                    </td>
                    <td className={`${TD} text-[#666]`}>{timeAgo(c.joined)}</td>
                    <td className={`${TD} tabular-nums`}>{c.orders}</td>
                    <td className={`${TD} tabular-nums font-medium`}>{money(Number(c.revenue))}</td>
                    <td className={`${TD} tabular-nums`}>{c.free_claims}</td>
                    <td className={`${TD} tabular-nums`}>{c.wishlist_items}</td>
                    <td className={`${TD} tabular-nums`}>{c.cart_items}</td>
                    <td className={`${TD} tabular-nums`}>{c.reviews}</td>
                  </tr>
                ))}
              </Table>
              <Pager page={page} total={total} size={PAGE} onPage={setPage} />
            </div>
          )
        }}
      </Gate>

      {open && <CustomerPanel id={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function Pager({ page, total, size, onPage }: { page: number; total: number; size: number; onPage: (n: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size))
  return (
    <div className="flex items-center justify-between border-t border-[#eceae5] px-3 py-2.5 text-[12px] text-[#666]">
      <span>{total.toLocaleString()} total</span>
      <div className="flex items-center gap-2">
        <button disabled={page === 0} onClick={() => onPage(page - 1)} className="min-h-9 px-3 rounded-full border border-[#e4e1db] disabled:opacity-40">Prev</button>
        <span>{page + 1} / {pages}</span>
        <button disabled={page + 1 >= pages} onClick={() => onPage(page + 1)} className="min-h-9 px-3 rounded-full border border-[#e4e1db] disabled:opacity-40">Next</button>
      </div>
    </div>
  )
}

type Row = Record<string, unknown>
const s = (v: unknown) => (v == null ? '' : String(v))

function CustomerPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const state = useLoad(() => analytics.customerDetail(id), [id])
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Customer details">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <aside className="relative h-full w-full max-w-[520px] overflow-y-auto bg-[#f9f8f6] p-4 md:p-5 shadow-xl">
        <button onClick={onClose} className="mb-3 min-h-10 rounded-full border border-[#e4e1db] bg-white px-4 text-[13px]">Close</button>
        <Gate state={state} what="this customer">{(d) => <CustomerBody d={d} />}</Gate>
      </aside>
    </div>
  )
}

function CustomerBody({ d }: { d: CustomerDetail }) {
  const p = (d.profile ?? {}) as Row
  const orders = (d.orders ?? []) as Row[]
  const wish = (d.wishlist ?? []) as Row[]
  const cart = (d.cart ?? []) as Row[]
  const dls = (d.downloads ?? []) as Row[]
  const reviews = (d.reviews ?? []) as Row[]
  const events = (d.events ?? []) as unknown as Row[]
  const spent = orders.filter((o) => o.status !== 'refunded').reduce((a, o) => a + Number(o.amount || 0), 0)
  const name = [s(p.first_name), s(p.last_name)].filter(Boolean).join(' ')
  const list = (title: string, items: Row[], line: (r: Row) => ReactNode) => (
    <Section title={`${title} (${items.length})`}>
      {items.length === 0 ? <p className="text-[13px] text-[#888]">None.</p> : (
        <ul className="divide-y divide-[#f1efea] max-h-64 overflow-y-auto">{items.map((r, i) => <li key={i} className="py-2 text-[13px]">{line(r)}</li>)}</ul>
      )}
    </Section>
  )
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-heading text-[20px] font-bold">{name || s(p.email)}</h2>
        {name && <p className="text-[13px] text-[#666]">{s(p.email)}</p>}
        <p className="mt-1 text-[12px] text-[#888]">
          Joined {timeAgo(s(p.created_at))} · last sign-in {timeAgo(s(p.last_sign_in_at))}
          {s(p.billing_country) && ` · ${s(p.billing_country)}`} · {d.newsletter ? 'subscribed to newsletter' : 'not on newsletter'}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[['Spent', money(spent)], ['Orders', orders.length], ['Free claims', dls.filter((x) => x.kind === 'free').length]].map(([k, v]) => (
          <div key={String(k)} className={`${CARD} py-3`}><p className="text-[18px] font-bold tabular-nums">{String(v)}</p><p className="text-[11px] text-[#777]">{k}</p></div>
        ))}
      </div>
      {list('Orders', orders, (o) => (
        <div className="flex justify-between gap-3">
          <span>{((o.items ?? []) as Row[]).map((i) => s(i.title)).join(', ') || 'Order'}<span className="block text-[11px] text-[#999]">{timeAgo(s(o.created_at))} · {s(o.status)}</span></span>
          <span className="font-medium tabular-nums">{money(Number(o.amount || 0))}</span>
        </div>
      ))}
      {list('Wishlist', wish, (r) => <div className="flex justify-between gap-3"><span>{s(r.title)}</span><span className="text-[12px] text-[#888] shrink-0">{r.bought ? 'bought' : 'not bought'} · {timeAgo(s(r.added_at))}</span></div>)}
      {list('In cart', cart, (r) => <div className="flex justify-between gap-3"><span>{s(r.title)}</span><span className="text-[12px] text-[#888] shrink-0">{money(Number(r.price || 0))} · {timeAgo(s(r.added_at))}</span></div>)}
      {list('Downloads', dls, (r) => <div className="flex justify-between gap-3"><span>{s(r.title)}</span><span className="text-[12px] text-[#888] shrink-0">{s(r.kind)} · {timeAgo(s(r.at))}</span></div>)}
      {list('Reviews', reviews, (r) => <div><span className="font-medium">{s(r.title)}</span> — {s(r.rating)}★ <span className="text-[11px] text-[#999]">({s(r.status)})</span>{r.body ? <p className="text-[#666]">{s(r.body)}</p> : null}</div>)}
      {list('Recent activity', events, (r) => <div className="flex justify-between gap-3"><span>{s(r.event).replace(/_/g, ' ')}{r.product ? ` · ${s(r.product)}` : r.path ? ` · ${s(r.path)}` : ''}</span><span className="text-[12px] text-[#888] shrink-0">{timeAgo(s(r.at))}</span></div>)}
      <p className="text-[11px] text-[#999]">Activity is recorded only after a visitor accepts cookies and only while they are signed in.</p>
    </div>
  )
}

/* ───────────────────────── Wishlists & carts ───────────────────────── */

export function InsightsSaved() {
  const [tab, setTab] = useState<'wishlists' | 'carts'>('wishlists')
  const [onlyUnbought, setOnlyUnbought] = useState(true)
  const [page, setPage] = useState(0)
  const wl = useLoad(() => analytics.wishlists(onlyUnbought, PAGE, page * PAGE), [onlyUnbought, page])
  const carts = useLoad(() => analytics.carts(), [])

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className={H1}>Wishlists &amp; carts</h1>
        <p className="text-[13px] text-[#777] mt-0.5">Who saved what, and who left something behind. Good people to email a nudge.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(['wishlists', 'carts'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t} className={`min-h-10 rounded-full px-4 text-[13px] font-medium border ${tab === t ? 'bg-ink text-white border-ink' : 'bg-white border-[#e4e1db] text-[#555]'}`}>
            {t === 'wishlists' ? 'Wishlists' : 'Carts'}
          </button>
        ))}
        {tab === 'wishlists' && (
          <label className="ml-auto flex items-center gap-2 text-[13px] text-[#555]">
            <input type="checkbox" checked={onlyUnbought} onChange={(e) => { setOnlyUnbought(e.target.checked); setPage(0) }} className="h-4 w-4" />
            Not bought yet
          </label>
        )}
      </div>

      {tab === 'wishlists' ? (
        <Gate state={wl} what="wishlists">
          {(rows: WishlistRow[]) => (
            <div className={CARD}>
              <Table head={['Customer', 'Saved', 'Price', 'When', 'Status']} empty="No saved items.">
                {rows.map((r) => (
                  <tr key={`${r.user_id}-${r.product_id}`}>
                    <td className={TD}><span className="block font-medium">{r.name || r.email}</span>{r.name && <span className="text-[12px] text-[#777]">{r.email}</span>}</td>
                    <td className={TD}><Link className="hover:underline" href={`/product/${r.slug}`} target="_blank">{r.title}</Link></td>
                    <td className={`${TD} tabular-nums`}>{money(Number(r.price))}</td>
                    <td className={`${TD} text-[#666]`}>{timeAgo(r.added_at)}</td>
                    <td className={TD}>{r.bought ? <span className="text-deal font-medium">Bought</span> : <span className="text-[#888]">Waiting</span>}</td>
                  </tr>
                ))}
              </Table>
              <Pager page={page} total={rows[0]?.total_count ?? 0} size={PAGE} onPage={setPage} />
            </div>
          )}
        </Gate>
      ) : (
        <Gate state={carts} what="carts">
          {(rows: CartRow[]) => (
            <div className={CARD}>
              <Table head={['Customer', 'Items', 'Value', 'Last change', 'Status']} empty="No open carts.">
                {rows.map((r) => (
                  <tr key={r.user_id}>
                    <td className={TD}><span className="block font-medium">{r.name || r.email}</span>{r.name && <span className="text-[12px] text-[#777]">{r.email}</span>}</td>
                    <td className={TD}>{r.items.map((i) => i.title).join(', ')}</td>
                    <td className={`${TD} tabular-nums font-medium`}>{money(Number(r.value))}</td>
                    <td className={`${TD} text-[#666]`}>{timeAgo(r.updated_at)}</td>
                    <td className={TD}>{r.abandoned ? <span className="text-sale font-medium">Abandoned</span> : <span className="text-[#888]">Active</span>}</td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </Gate>
      )}
    </div>
  )
}

/* ───────────────────────── Products ───────────────────────── */

export function InsightsProducts() {
  const [range, setRange] = useState<RangeId>('30d')
  const w = useMemo(() => rangeWindows(range), [range])
  const [sortKey, setSortKey] = useState<keyof ProductRow>('revenue')
  const state = useLoad(() => analytics.topProducts(w.start, w.end), [w])

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={H1}>Product performance</h1>
          <p className="text-[13px] text-[#777] mt-0.5">Which patterns get looked at, saved, carted and bought.</p>
        </div>
        <RangePicker value={range} onChange={setRange} />
      </div>
      <Gate state={state} what="product performance">
        {(rows: ProductRow[]) => {
          const sorted = [...rows].sort((a, b) => Number(b[sortKey]) - Number(a[sortKey]))
          const cols: [keyof ProductRow, string][] = [['views', 'Views'], ['wishlist_adds', 'Saved'], ['wishlist_total', 'Saved total'], ['cart_adds', 'Carted'], ['orders', 'Orders'], ['free_claims', 'Free'], ['revenue', 'Revenue']]
          return (
            <div className={CARD}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead className="border-b border-[#eceae5]">
                    <tr>
                      <th className={TH}>Product</th>
                      {cols.map(([k, l]) => (
                        <th key={k} className={TH} aria-sort={sortKey === k ? 'descending' : 'none'}>
                          <button onClick={() => setSortKey(k)} className={sortKey === k ? 'text-ink' : ''}>{l}{sortKey === k ? ' ↓' : ''}</button>
                        </th>
                      ))}
                      <th className={TH}>View→buy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1efea]">
                    {sorted.map((r) => (
                      <tr key={r.product_id}>
                        <td className={TD}><Link href={`/product/${r.slug}`} target="_blank" className="font-medium hover:underline">{r.title}</Link><span className="block text-[12px] text-[#888]">{money(Number(r.price))}</span></td>
                        {cols.map(([k]) => <td key={k} className={`${TD} tabular-nums`}>{k === 'revenue' ? money(Number(r[k])) : Number(r[k]).toLocaleString()}</td>)}
                        <td className={`${TD} tabular-nums`}>{pct(Number(r.orders), Number(r.views))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sorted.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-[#888]">No data for this period.</p>}
              </div>
            </div>
          )
        }}
      </Gate>
      <p className="text-[12px] text-[#888]">Views are counted from the first day tracking is turned on. Many views + many saves + few orders = a price or description problem worth looking at.</p>
    </div>
  )
}

/* ───────────────────────── Traffic & search ───────────────────────── */

export function InsightsTraffic() {
  const [range, setRange] = useState<RangeId>('30d')
  const w = useMemo(() => rangeWindows(range), [range])
  const traffic = useLoad(() => analytics.traffic(w.start, w.end), [w])
  const terms = useLoad(() => analytics.searchTerms(w.start, w.end), [w])

  const mini = (title: string, head: string[], rows: ReactNode[][]) => (
    <Section title={title}>
      <Table head={head} empty="No data yet.">
        {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`${TD} ${j > 0 ? 'tabular-nums' : 'break-all'}`}>{c}</td>)}</tr>)}
      </Table>
    </Section>
  )

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={H1}>Traffic &amp; search</h1>
          <p className="text-[13px] text-[#777] mt-0.5">Where visitors come from and what they look for.</p>
        </div>
        <RangePicker value={range} onChange={setRange} />
      </div>
      <Gate state={traffic} what="traffic">
        {(t: Traffic) => (
          <div className="grid lg:grid-cols-2 gap-4">
            {mini('Where visitors come from', ['Source', 'Sessions', 'Carted', 'Checkout'], t.sources.map((r) => [r.source, r.sessions, r.cart_adds, r.checkouts]))}
            {mini('Top pages', ['Page', 'Views'], t.top_pages.map((r) => [r.path, r.views]))}
            {mini('Landing pages', ['Page', 'Sessions'], t.landing_pages.map((r) => [r.path, r.sessions]))}
            {mini('Campaigns', ['Campaign', 'Source', 'Sessions'], t.campaigns.map((r) => [r.campaign, r.source || '—', r.sessions]))}
            {mini('Devices', ['Device', 'Sessions'], t.devices.map((r) => [r.device, r.sessions]))}
            {mini('Countries', ['Country', 'Sessions'], t.countries.map((r) => [r.country, r.sessions]))}
          </div>
        )}
      </Gate>
      <Gate state={terms} what="search insights">
        {(rows: SearchTerm[]) => (
          <Section title="What people search for" aside={<span className="text-[11px] text-[#888]">“No results” = patterns customers want and you don’t have</span>}>
            <Table head={['Search', 'Times', 'No results', 'Avg results']} empty="No searches yet.">
              {rows.map((r) => (
                <tr key={r.term}>
                  <td className={TD}>{r.term}</td>
                  <td className={`${TD} tabular-nums`}>{r.searches}</td>
                  <td className={`${TD} tabular-nums ${r.zero_results > 0 ? 'text-sale font-medium' : ''}`}>{r.zero_results}</td>
                  <td className={`${TD} tabular-nums`}>{Number(r.avg_results).toFixed(1)}</td>
                </tr>
              ))}
            </Table>
          </Section>
        )}
      </Gate>
    </div>
  )
}

/* ───────────────────────── Setup / health ───────────────────────── */

export function InsightsSetup() {
  const health = useLoad(() => analytics.health(), [])
  const trackingOn = process.env.NEXT_PUBLIC_EVENT_TRACKING === 'on'
  const h: Health | null = health.res?.ok ? health.res.data : null
  const step = (done: boolean, title: string, body: ReactNode) => (
    <li className={`${CARD} p-4 flex gap-3`}>
      <span className={`mt-0.5 h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[12px] font-bold ${done ? 'bg-deal text-white' : 'bg-[#eeece7] text-[#777]'}`}>{done ? '✓' : '•'}</span>
      <div className="text-[13px] text-[#555]"><p className="text-[14px] font-semibold text-ink">{title}</p>{body}</div>
    </li>
  )
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className={H1}>Tracking setup</h1>
        <p className="text-[13px] text-[#777] mt-0.5">Three one-time steps switch on full customer tracking. Until then the shop works exactly as before.</p>
      </div>
      <ol className="space-y-3">
        {step(!!h, '1. Install the analytics database functions', <p>Supabase → SQL Editor → paste the file <code className="bg-[#f1efea] px-1 rounded">supabase/admin-analytics.sql</code> → Run. Safe to run twice.</p>)}
        {step(!!h && h.events_total > 0, '2. Deploy the track-event function', <p>Supabase → Edge Functions → deploy <code className="bg-[#f1efea] px-1 rounded">track-event</code> (or run <code className="bg-[#f1efea] px-1 rounded">scripts/deploy-edge-functions.mjs</code>).</p>)}
        {step(trackingOn, '3. Turn tracking on', <p>Vercel → Project → Environment Variables → <code className="bg-[#f1efea] px-1 rounded">NEXT_PUBLIC_EVENT_TRACKING=on</code> → redeploy. {trackingOn ? 'It is on in this build.' : 'It is off in this build.'}</p>)}
      </ol>
      <Gate state={health} what="status">
        {(x: Health) => (
          <Section title="Status">
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              {[['Events stored', x.events_total], ['Last 24h', x.events_24h], ['Page views', x.page_views_total], ['Accounts', x.users_total]].map(([k, v]) => (
                <div key={String(k)} className="rounded-xl bg-[#f7f6f3] py-3"><dd className="text-[20px] font-bold tabular-nums">{Number(v).toLocaleString()}</dd><dt className="text-[11px] text-[#777]">{k}</dt></div>
              ))}
            </dl>
            <p className="mt-3 text-[12px] text-[#888]">Last event: {timeAgo(x.last_event_at)}. Only visitors who accept cookies are counted as sessions; refusing visitors are stored anonymously (no session, no user).</p>
          </Section>
        )}
      </Gate>
    </div>
  )
}
