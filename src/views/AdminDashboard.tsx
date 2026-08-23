'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { deriveVariantUrl } from '../lib/imageVariants'
import { MaterialIcon } from '../components/MaterialIcon'
import { useAuth } from '../context/AuthContext'

type DashStats = {
  viewsToday: number
  ordersToday: number
  revenueToday: number
  ordersPrev: number
  revenuePrev: number
  activeListings: number
  draftListings: number
  soldOutListings: number
  totalSales: number
  ordersOpen: number
}

type ActivityItem =
  | { kind: 'order'; id: string; email: string; amount: number; currency: string; created_at: string; titles: string[] }
  | { kind: 'favourite'; id: string; productTitle: string; productImage: string | null; created_at: string }

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return Math.round(((current - previous) / previous) * 100)
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.floor(h / 24)
  return `${d} day${d === 1 ? '' : 's'} ago`
}

export function AdminDashboard() {
  const { profile, user } = useAuth()
  const shopName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Notion Creative Art'
  const [tab, setTab] = useState<'home' | 'activity'>('home')
  const [activityFilter, setActivityFilter] = useState<'all' | 'purchases' | 'favourites'>('all')
  const [stats, setStats] = useState<DashStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [range, setRange] = useState<'today' | '7d' | '30d'>('today')

  useEffect(() => {
    const load = async () => {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const startOfYesterday = new Date(startOfToday)
      startOfYesterday.setDate(startOfYesterday.getDate() - 1)
      const dayMs = 86400000
      const rangeStart =
        range === 'today' ? startOfToday :
        range === '7d' ? new Date(now.getTime() - 7 * dayMs) :
        new Date(now.getTime() - 30 * dayMs)
      const prevStart =
        range === 'today' ? startOfYesterday :
        range === '7d' ? new Date(rangeStart.getTime() - 7 * dayMs) :
        new Date(rangeStart.getTime() - 30 * dayMs)

      const [
        { count: activeListings },
        { count: draftListings },
        { count: soldOutListings },
        { data: rangeOrders },
        { data: prevOrders },
        { count: totalSales },
        { data: recentOrders },
        { data: recentFavs },
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('active', true),
        supabase.from('products').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('active', false),
        supabase.from('products').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('sold_out', true),
        supabase.from('orders').select('amount, status, created_at').gte('created_at', rangeStart.toISOString()),
        supabase.from('orders').select('amount, status, created_at').gte('created_at', prevStart.toISOString()).lt('created_at', rangeStart.toISOString()),
        supabase.from('purchases').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, customer_email, amount, currency, created_at, product_ids, status').order('created_at', { ascending: false }).limit(20),
        supabase.from('wishlist').select('id, product_id, created_at').order('created_at', { ascending: false }).limit(20),
      ])

      const sumPaid = (rows: { amount: number; status: string }[] | null) =>
        (rows ?? []).filter((o) => o.status !== 'refunded').reduce((s, o) => s + (o.amount || 0), 0)
      const countPaid = (rows: { status: string }[] | null) =>
        (rows ?? []).filter((o) => o.status !== 'refunded').length

      setStats({
        viewsToday: 0,
        ordersToday: countPaid(rangeOrders),
        revenueToday: sumPaid(rangeOrders),
        ordersPrev: countPaid(prevOrders),
        revenuePrev: sumPaid(prevOrders),
        activeListings: activeListings ?? 0,
        draftListings: draftListings ?? 0,
        soldOutListings: soldOutListings ?? 0,
        totalSales: totalSales ?? 0,
        ordersOpen: (recentOrders ?? []).filter((o) => o.status === 'paid' || o.status === 'completed').length,
      })

      const productIds = new Set<string>()
      for (const o of recentOrders ?? []) for (const id of o.product_ids ?? []) productIds.add(id)
      for (const f of recentFavs ?? []) if (f.product_id) productIds.add(f.product_id)
      const idList = [...productIds]
      const titleMap: Record<string, { title: string; image: string | null }> = {}
      if (idList.length) {
        const { data: prods } = await supabase.from('products').select('id, title, images').in('id', idList)
        for (const p of prods ?? []) {
          titleMap[p.id] = { title: p.title, image: p.images?.[0] ?? null }
        }
      }

      const items: ActivityItem[] = [
        ...(recentOrders ?? []).map((o) => ({
          kind: 'order' as const,
          id: o.id,
          email: o.customer_email,
          amount: o.amount,
          currency: o.currency,
          created_at: o.created_at,
          titles: (o.product_ids ?? []).map((id: string) => titleMap[id]?.title ?? 'Pattern'),
        })),
        ...(recentFavs ?? []).map((f) => ({
          kind: 'favourite' as const,
          id: f.id,
          productTitle: titleMap[f.product_id]?.title ?? 'Pattern',
          productImage: titleMap[f.product_id]?.image ?? null,
          created_at: f.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setActivity(items)
    }
    load()
  }, [range])

  const ordersPct = stats ? pctChange(stats.ordersToday, stats.ordersPrev) : 0
  const revenuePct = stats ? pctChange(stats.revenueToday, stats.revenuePrev) : 0
  const filteredActivity = activity.filter((a) => {
    if (activityFilter === 'purchases') return a.kind === 'order'
    if (activityFilter === 'favourites') return a.kind === 'favourite'
    return true
  })

  return (
    <div className="max-w-[1100px]">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <div className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-white text-lg font-semibold" style={{ background: '#1f249c' }}>
          {(shopName[0] || 'N').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-[28px] md:text-[32px] leading-tight text-ink mb-1.5">
            Welcome back, {shopName}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-soft">
            <span>{stats?.totalSales.toLocaleString() ?? '—'} sales</span>
            <span>{stats?.activeListings.toLocaleString() ?? '—'} active listings</span>
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink hover:underline">
              View shop <MaterialIcon name="open_in_new" size={14} />
            </a>
          </div>
          <p className="text-[12px] text-ink-soft mt-1 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#e4e1db] mb-6">
        {([
          { id: 'home' as const, label: 'Home' },
          { id: 'activity' as const, label: 'Recent activity' },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[14px] -mb-px border-b-2 transition-colors ${
              tab === t.id ? 'border-[#1f249c] text-ink font-medium' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'home' && (
        <>
          <section className="mb-8">
            <h2 className="text-[18px] font-semibold text-ink mb-3">Top tasks</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TaskCard
                icon="inventory_2"
                title="Orders"
                links={[
                  { label: 'View recent orders', href: '/admin/orders', count: stats?.ordersOpen },
                ]}
              />
              <TaskCard
                icon="sell"
                title="Listings"
                links={[
                  { label: 'Sold out listings', href: '/admin/listings?status=sold_out', count: stats?.soldOutListings },
                  { label: 'Draft listings', href: '/admin/listings?status=draft', count: stats?.draftListings },
                ]}
              />
              <TaskCard
                icon="category"
                title="Shop setup"
                links={[
                  { label: 'Manage categories', href: '/admin/categories' },
                  { label: 'Homepage content', href: '/admin/homepage' },
                ]}
              />
            </div>
            <p className="text-[12px] text-ink-soft mt-3">Top tasks show activity from your shop right now.</p>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[18px] font-semibold text-ink">Stats</h2>
              <Link href="/admin/orders" className="text-[13px] text-ink underline underline-offset-2 hover:opacity-70">View all</Link>
            </div>
            <div className="mb-3">
              <label className="text-[12px] text-ink-soft mr-2">Date range</label>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value as typeof range)}
                className="border border-[#d9d5ce] rounded-md bg-white px-2.5 py-1.5 text-[13px]"
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
            <div className="bg-white border border-[#e4e1db] rounded-xl overflow-hidden grid grid-cols-2 lg:grid-cols-4">
              <StatCell label="Orders" value={String(stats?.ordersToday ?? '—')} pct={ordersPct} />
              <StatCell
                label="Revenue"
                value={stats ? `USD ${stats.revenueToday.toFixed(2)}` : '—'}
                pct={revenuePct}
              />
              <StatCell label="Active listings" value={String(stats?.activeListings ?? '—')} />
              <StatCell label="Total sales" value={String(stats?.totalSales ?? '—')} />
            </div>
          </section>
        </>
      )}

      {tab === 'activity' && (
        <div>
          <div className="flex flex-wrap gap-2 mb-5">
            {([
              { id: 'all' as const, label: 'All' },
              { id: 'purchases' as const, label: 'Purchases' },
              { id: 'favourites' as const, label: 'Item favourites' },
            ]).map((f) => (
              <button
                key={f.id}
                onClick={() => setActivityFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] border transition-colors ${
                  activityFilter === f.id
                    ? 'bg-[#222] text-white border-[#222]'
                    : 'bg-white text-ink border-[#d9d5ce] hover:bg-[#f3f1ec]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredActivity.length === 0 ? (
            <div className="bg-white border border-[#e4e1db] rounded-xl py-16 text-center text-[14px] text-ink-soft">
              No recent activity yet.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivity.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="bg-white border border-[#e4e1db] rounded-xl p-4 flex gap-4">
                  {item.kind === 'order' ? (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-[#f3f1ec] flex items-center justify-center shrink-0">
                        <MaterialIcon name="receipt_long" size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] text-ink">
                          <span className="font-medium">{item.email}</span> purchased {item.titles.slice(0, 2).join(', ') || 'a pattern'}
                          {item.titles.length > 2 ? ` +${item.titles.length - 2}` : ''}
                        </p>
                        <p className="text-[13px] text-ink-soft mt-0.5">
                          USD {item.amount.toFixed(2)} · {timeAgo(item.created_at)}
                        </p>
                        <Link href="/admin/orders" className="inline-block mt-2 text-[13px] text-[#1f249c] hover:underline">
                          View orders
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-[#f3f1ec] overflow-hidden shrink-0">
                        {item.productImage ? (
                          <img src={deriveVariantUrl(item.productImage, 'micro')} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MaterialIcon name="favorite" size={20} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] text-ink">
                          Someone favourited <span className="font-medium">{item.productTitle}</span>
                        </p>
                        <p className="text-[13px] text-ink-soft mt-0.5">{timeAgo(item.created_at)}</p>
                        <Link href="/admin/listings" className="inline-block mt-2 text-[13px] text-[#1f249c] hover:underline">
                          View listings
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TaskCard({
  icon,
  title,
  links,
}: {
  icon: string
  title: string
  links: { label: string; href: string; count?: number }[]
}) {
  return (
    <div className="bg-white border border-[#e4e1db] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <MaterialIcon name={icon} size={20} />
        <p className="text-[14px] font-semibold text-ink">{title}</p>
      </div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-[13px] text-[#1f249c] hover:underline inline-flex items-center gap-1.5">
              {l.label}
              {typeof l.count === 'number' && (
                <span className="text-ink-soft">({l.count})</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatCell({ label, value, pct }: { label: string; value: string; pct?: number }) {
  return (
    <div className="p-5 border-b border-r border-[#e4e1db] last:border-r-0">
      <p className="text-[12px] text-ink-soft mb-1">{label}</p>
      <p className="text-[22px] font-semibold text-ink tracking-tight">{value}</p>
      {typeof pct === 'number' && (
        <p className={`text-[12px] mt-1 ${pct < 0 ? 'text-[#b91c1c]' : pct > 0 ? 'text-[#15803d]' : 'text-ink-soft'}`}>
          {pct > 0 ? '+' : ''}{pct}% vs prior period
        </p>
      )}
      <p className="text-[11px] text-ink-soft mt-1">Updated just now</p>
    </div>
  )
}
