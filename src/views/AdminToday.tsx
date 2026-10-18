'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { analytics, delta, money, timeAgo } from '../lib/adminAnalytics'
import { MaterialIcon } from '../components/MaterialIcon'

type OrderRow = { id: string; customer_email: string | null; amount: number; status: string; created_at: string; product_ids: string[] | null }
type Data = {
  today: { revenue: number; orders: number }
  yesterday: { revenue: number; orders: number }
  recent: (OrderRow & { titles: string[] })[]
  liveListings: number
  drafts: number
  pendingReviews: number
  abandonedCarts: number | null
  online: number | null
}

const CARD = 'rounded-2xl border border-[#E5E7EB] bg-white'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function AdminToday({ name }: { name: string }) {
  const [d, setD] = useState<Data | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    const run = async () => {
      const startToday = new Date()
      startToday.setHours(0, 0, 0, 0)
      const startYesterday = new Date(startToday)
      startYesterday.setDate(startYesterday.getDate() - 1)
      try {
        const [ordersRes, recentRes, live, drafts, reviews, carts, online] = await Promise.all([
          supabase.from('orders').select('amount, status, created_at').gte('created_at', startYesterday.toISOString()),
          supabase.from('orders').select('id, customer_email, amount, status, created_at, product_ids').order('created_at', { ascending: false }).limit(8),
          supabase.from('products').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('active', true),
          supabase.from('products').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('active', false),
          supabase.rpc('get_pending_review_count'),
          analytics.carts(),
          analytics.live(),
        ])
        const rows = (ordersRes.data ?? []) as { amount: number; status: string; created_at: string }[]
        const sum = (from: Date, to: Date) => {
          const part = rows.filter((o) => o.status !== 'refunded' && new Date(o.created_at) >= from && new Date(o.created_at) < to)
          return { revenue: part.reduce((s, o) => s + Number(o.amount || 0), 0), orders: part.length }
        }
        const recent = (recentRes.data ?? []) as OrderRow[]
        const ids = [...new Set(recent.flatMap((o) => o.product_ids ?? []))]
        const titles = new Map<string, string>()
        if (ids.length) {
          const { data } = await supabase.from('products').select('id, title').in('id', ids)
          for (const p of (data ?? []) as { id: string; title: string }[]) titles.set(p.id, p.title)
        }
        if (!alive) return
        setD({
          today: sum(startToday, new Date(Date.now() + 86400000)),
          yesterday: sum(startYesterday, startToday),
          recent: recent.map((o) => ({ ...o, titles: (o.product_ids ?? []).map((id) => titles.get(id) ?? 'Pattern') })),
          liveListings: live.count ?? 0,
          drafts: drafts.count ?? 0,
          pendingReviews: Number(reviews.data) || 0,
          abandonedCarts: carts.ok ? carts.data.filter((c) => c.abandoned).length : null,
          online: online.ok ? online.data.active_visitors : null,
        })
      } catch {
        if (alive) setFailed(true)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [])

  const first = name.split(' ')[0] || 'there'

  if (failed) return <div className={`${CARD} p-6 text-[14px]`}>Could not load today’s numbers. Refresh to try again.</div>
  if (!d) return <div className={`${CARD} h-64 animate-pulse bg-[#F1F2F4]`} aria-busy="true" />

  const attention: { label: string; count: number; to: string; cta: string }[] = [
    { label: 'Reviews waiting for approval', count: d.pendingReviews, to: '/admin/reviews', cta: 'Review' },
    { label: 'Listings saved as draft (not visible to customers)', count: d.drafts, to: '/admin/listings', cta: 'Open' },
    ...(d.abandonedCarts ? [{ label: 'Customers left items in their cart', count: d.abandonedCarts, to: '/admin/saved', cta: 'See who' }] : []),
  ].filter((a) => a.count > 0)

  const revDelta = delta(d.today.revenue, d.yesterday.revenue)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-[26px] font-bold leading-tight md:text-[30px]">
          {greeting()}, {first}
        </h2>
        <p className="mt-1 text-[14px] text-[#6b7280]">Here’s what’s happening in the shop today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sales today" value={money(d.today.revenue)} sub={revDelta == null ? 'New vs yesterday' : revDelta === 0 ? 'Same as yesterday' : `${revDelta > 0 ? '▲' : '▼'} ${Math.abs(revDelta)}% vs yesterday`} good={revDelta == null || revDelta === 0 ? null : revDelta > 0} />
        <Stat label="Orders today" value={String(d.today.orders)} sub={`${d.yesterday.orders} yesterday`} />
        <Stat label="Online now" value={d.online == null ? '—' : String(d.online)} sub={d.online == null ? 'turn on tracking to see this' : 'last 5 minutes'} />
        <Stat label="Live listings" value={String(d.liveListings)} sub={`${d.drafts} draft${d.drafts === 1 ? '' : 's'}`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <section className={`${CARD} p-5`}>
          <h3 className="text-[15px] font-semibold">Needs your attention</h3>
          {attention.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-[14px] text-[#6b7280]">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-deal text-[12px] text-white">✓</span> You’re all caught up.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-[#EEF0F2]">
              {attention.map((a) => (
                <li key={a.to} className="flex items-center gap-3 py-3">
                  <span className="grid h-9 min-w-9 place-items-center rounded-full bg-[#F1F2F4] px-2 text-[14px] font-bold tabular-nums">{a.count}</span>
                  <span className="flex-1 text-[14px]">{a.label}</span>
                  <Link href={a.to} className="min-h-9 rounded-full border border-[#E5E7EB] px-4 text-[13px] leading-9 hover:bg-[#F6F6F7]">{a.cta}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${CARD} p-5`}>
          <h3 className="text-[15px] font-semibold">Quick actions</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Action to="/admin/listings" icon="sell" label="Add a listing" />
            <Action to="/admin/bulk-upload" icon="upload_file" label="Bulk upload" />
            <Action to="/admin/homepage" icon="language" label="Edit homepage" />
            <Action to="/admin/analytics" icon="insights" label="See analytics" />
          </div>
        </section>
      </div>

      <section className={`${CARD} p-5`}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold">Latest orders</h3>
          <Link href="/admin/orders" className="text-[13px] underline">All orders</Link>
        </div>
        {d.recent.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-[#8a8f98]">No orders yet. They’ll show up here the moment someone buys.</p>
        ) : (
          <ul className="divide-y divide-[#EEF0F2]">
            {d.recent.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{o.titles.join(', ') || 'Order'}</p>
                  <p className="truncate text-[12px] text-[#8a8f98]">{o.customer_email ?? 'Guest'} · {timeAgo(o.created_at)}</p>
                </div>
                {o.status === 'refunded' && <span className="rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-medium text-[#B91C1C]">Refunded</span>}
                <span className="text-[14px] font-semibold tabular-nums">{money(Number(o.amount || 0))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, sub, good }: { label: string; value: string; sub: ReactNode; good?: boolean | null }) {
  return (
    <div className={`${CARD} p-4`}>
      <p className="text-[12px] text-[#6b7280]">{label}</p>
      <p className="mt-1 text-[28px] font-bold leading-none tabular-nums">{value}</p>
      <p className={`mt-2 text-[12px] ${good == null ? 'text-[#8a8f98]' : good ? 'font-semibold text-deal' : 'font-semibold text-sale'}`}>{sub}</p>
    </div>
  )
}

function Action({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <Link href={to} className="flex min-h-[72px] flex-col justify-between rounded-xl border border-[#E5E7EB] p-3 text-[13px] font-medium transition-colors hover:bg-[#F6F6F7]">
      <MaterialIcon name={icon} size={20} />
      {label}
    </Link>
  )
}
