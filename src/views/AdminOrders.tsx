'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Btn, Card, Chip, Drawer, Empty, PageHeader, SearchBox, Tabs, ago, downloadCsv, money, useAdminUi } from '../components/adminUi'

type Order = {
  id: string
  lemon_order_id: string | null
  display_order_number?: string | null
  provider?: string | null
  environment?: string | null
  customer_email: string
  amount: number
  currency: string
  status: string
  created_at: string
  product_ids: string[] | null
}
type Filter = 'all' | 'paid' | 'refunded'
const PAGE = 25

const statusChip = (s: string) =>
  s === 'paid' ? <Chip tone="green">Paid</Chip> : s === 'refunded' ? <Chip>Money returned</Chip> : <Chip tone="amber">{s}</Chip>

export function AdminOrders() {
  const { confirm, toast } = useAdminUi()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [access, setAccess] = useState<Set<string>>(new Set())
  const [summary, setSummary] = useState<{ orders: number; revenue: number; refunded: number } | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [alsoRevoke, setAlsoRevoke] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const apply = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (query: any) => {
      let x = query
      if (filter !== 'all') x = x.eq('status', filter)
      if (q) x = x.or(`customer_email.ilike.%${q.replace(/[%,()]/g, '')}%,lemon_order_id.ilike.%${q.replace(/[%,()]/g, '')}%,display_order_number.ilike.%${q.replace(/[%,()]/g, '')}%`)
      return x
    },
    [filter, q],
  )

  const hydrate = useCallback(async (rows: Order[]) => {
    const ids = [...new Set(rows.flatMap((o) => o.product_ids ?? []))]
    if (ids.length) {
      const { data } = await supabase.from('products').select('id, title').in('id', ids)
      setTitles((prev) => ({ ...prev, ...Object.fromEntries(((data ?? []) as { id: string; title: string }[]).map((p) => [p.id, p.title])) }))
    }
    if (rows.length) {
      const { data } = await supabase.from('purchases').select('order_id').in('order_id', rows.map((o) => o.id))
      setAccess((prev) => new Set([...prev, ...((data ?? []) as { order_id: string }[]).map((p) => p.order_id)]))
    }
  }, [])

  useEffect(() => {
    let alive = true
    const run = async () => {
      setLoading(true)
      const { data } = await apply(supabase.from('orders').select('*').order('created_at', { ascending: false })).range(0, PAGE - 1)
      if (!alive) return
      const rows = (data ?? []) as Order[]
      setOrders(rows)
      setHasMore(rows.length === PAGE)
      setLoading(false)
      hydrate(rows)
    }
    run()
    return () => {
      alive = false
    }
  }, [apply, hydrate])

  useEffect(() => {
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    supabase
      .from('orders')
      .select('amount, status')
      .gte('created_at', since)
      .limit(1000)
      .then(({ data }) => {
        const rows = (data ?? []) as { amount: number; status: string }[]
        setSummary({
          orders: rows.filter((r) => r.status !== 'refunded').length,
          revenue: rows.filter((r) => r.status !== 'refunded').reduce((s, r) => s + Number(r.amount || 0), 0),
          refunded: rows.filter((r) => r.status === 'refunded').length,
        })
      })
  }, [])

  const loadMore = async () => {
    const { data } = await apply(supabase.from('orders').select('*').order('created_at', { ascending: false })).range(orders.length, orders.length + PAGE - 1)
    const rows = (data ?? []) as Order[]
    setOrders((p) => [...p, ...rows])
    setHasMore(rows.length === PAGE)
    hydrate(rows)
  }

  const open = useMemo(() => orders.find((o) => o.id === openId) ?? null, [orders, openId])
  const itemTitles = (o: Order) => (o.product_ids ?? []).map((id) => titles[id] ?? '…')

  const exportCsv = async () => {
    const { data } = await apply(supabase.from('orders').select('*').order('created_at', { ascending: false })).limit(5000)
    const rows = (data ?? []) as Order[]
    downloadCsv('orders.csv', [
      ['order', 'date', 'email', 'amount', 'currency', 'status'],
      ...rows.map((o) => [o.display_order_number ?? o.lemon_order_id, o.created_at, o.customer_email, o.amount, o.currency, o.status]),
    ])
  }

  const refund = async (o: Order) => {
    const ok = await confirm({
      title: `Return ${money(o.amount, o.currency)} to ${o.customer_email}?`,
      body: (
        <>
          This sends a real refund through Lemon Squeezy and <b>can’t be undone from here</b>.
          {alsoRevoke && access.has(o.id) ? ' Their download access will also be removed.' : ' They will keep their downloads.'}
        </>
      ),
      confirmLabel: 'Refund now',
      tone: 'danger',
    })
    if (!ok) return
    setWorking(true)
    const revokeAccess = alsoRevoke && access.has(o.id)
    const { data, error } = await supabase.functions.invoke('admin-refund-order', { body: { orderId: o.id, revokeAccess } })
    setWorking(false)
    if (error || data?.error) {
      toast(data?.error ?? 'The refund didn’t go through. Try again, or check the order in Lemon Squeezy.', 'error')
      return
    }
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: 'refunded' } : x)))
    if (revokeAccess) setAccess((prev) => { const n = new Set(prev); n.delete(o.id); return n })
    toast('Refund sent')
  }

  const revoke = async (o: Order) => {
    const ok = await confirm({
      title: 'Remove download access?',
      body: 'They won’t be able to download this pattern from their account any more. This does not refund their payment.',
      confirmLabel: 'Remove access',
      tone: 'danger',
    })
    if (!ok) return
    setWorking(true)
    await supabase.from('purchases').delete().eq('order_id', o.id)
    setWorking(false)
    setAccess((prev) => { const n = new Set(prev); n.delete(o.id); return n })
    toast('Access removed')
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        desc="Every sale, newest first. Click an order to see what was bought, refund it, or manage downloads."
        actions={<Btn onClick={exportCsv}>Export CSV</Btn>}
      />

      {summary && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[['Sales (30 days)', money(summary.revenue)], ['Orders', String(summary.orders)], ['Refunds', String(summary.refunded)]].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
              <p className="text-[12px] text-[#6b7280]">{k}</p>
              <p className="mt-1 text-[22px] font-bold tabular-nums md:text-[26px]">{v}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={filter} onChange={setFilter} items={[{ id: 'all', label: 'All' }, { id: 'paid', label: 'Paid' }, { id: 'refunded', label: 'Refunded' }]} />
        <div className="flex-1" />
        <SearchBox value={search} onChange={setSearch} placeholder="Search email or order number" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        {loading ? (
          <div className="h-48 animate-pulse bg-[#F6F6F7]" aria-busy="true" />
        ) : orders.length === 0 ? (
          q || filter !== 'all' ? (
            <Empty icon="search" title="No orders match" body="Try a different search or filter." action={<Btn onClick={() => { setSearch(''); setFilter('all') }}>Clear filters</Btn>} />
          ) : (
            <Empty icon="receipt_long" title="No orders yet" body="When someone buys a pattern, it shows up here straight away." />
          )
        ) : (
          <>
            <ul className="divide-y divide-[#EEF0F2] md:hidden">
              {orders.map((o) => (
                <li key={o.id}>
                  <button onClick={() => setOpenId(o.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">{itemTitles(o).join(', ') || 'Order'}</span>
                      <span className="block truncate text-[12px] text-[#6b7280]">{o.customer_email} · {ago(o.created_at)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-[14px] font-semibold tabular-nums">{money(o.amount, o.currency)}</span>
                      {statusChip(o.status)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <table className="hidden w-full md:table">
              <thead className="border-b border-[#EEF0F2] text-left text-[12px] font-semibold text-[#6b7280]">
                <tr>
                  <th className="px-5 py-3">Pattern</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">When</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF0F2]">
                {orders.map((o) => {
                  const t = itemTitles(o)
                  return (
                    <tr key={o.id} onClick={() => setOpenId(o.id)} className="cursor-pointer hover:bg-[#FAFAFA]">
                      <td className="max-w-[260px] px-5 py-3.5 text-[14px] font-medium">
                        <span className="block truncate">{t[0] ?? 'Order'}</span>
                        {t.length > 1 && <span className="text-[12px] font-normal text-[#6b7280]">+{t.length - 1} more</span>}
                      </td>
                      <td className="px-3 py-3.5 text-[14px] text-[#4B5563]">{o.customer_email}</td>
                      <td className="px-3 py-3.5 text-[13px] text-[#6b7280]">{ago(o.created_at)}</td>
                      <td className="px-3 py-3.5">{statusChip(o.status)}</td>
                      <td className="px-5 py-3.5 text-right text-[14px] font-semibold tabular-nums">{money(o.amount, o.currency)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
      {hasMore && (
        <div className="mt-5 text-center">
          <Btn onClick={loadMore}>Load more</Btn>
        </div>
      )}

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? `Order ${open.display_order_number ?? open.lemon_order_id}` : 'Order'}>
        {open && (
          <>
            <Card>
              <div className="flex items-center justify-between">
                <p className="text-[24px] font-bold tabular-nums">{money(open.amount, open.currency)}</p>
                {statusChip(open.status)}
              </div>
              <p className="mt-1 text-[13px] text-[#6b7280]">{new Date(open.created_at).toLocaleString()}</p>
            </Card>
            <Card title="Customer">
              <p className="break-all text-[14px]">{open.customer_email}</p>
              <div className="mt-3 flex gap-2">
                <Btn size="sm" onClick={() => { navigator.clipboard?.writeText(open.customer_email); toast('Email copied') }}>Copy email</Btn>
                <a href={`/admin/customers?q=${encodeURIComponent(open.customer_email)}`} className="inline-flex min-h-9 items-center rounded-full border border-[#D1D5DB] bg-white px-3.5 text-[13px] hover:bg-[#F6F6F7]">See customer</a>
              </div>
            </Card>
            <Card title="What they bought">
              {(open.product_ids ?? []).length === 0 ? (
                <p className="text-[14px] text-[#6b7280]">No patterns recorded on this order.</p>
              ) : (
                <ul className="space-y-2 text-[14px]">
                  {itemTitles(open).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              )}
              <p className="mt-3 text-[13px] text-[#6b7280]">
                Download access:{' '}
                {open.status === 'refunded' ? 'not applicable' : access.has(open.id) ? <b className="text-deal">active</b> : <b className="text-sale">removed</b>}
              </p>
            </Card>
            {open.status === 'paid' && (
              <Card title="Refund or remove access">
                {access.has(open.id) && (
                  <label className="mb-3 flex items-start gap-2.5 text-[14px]">
                    <input type="checkbox" checked={alsoRevoke} onChange={(e) => setAlsoRevoke(e.target.checked)} className="mt-1 h-4 w-4" />
                    Also remove their download access when refunding
                  </label>
                )}
                <div className="flex flex-wrap gap-2">
                  <Btn variant="danger" disabled={working} onClick={() => refund(open)}>{working ? 'Working…' : `Refund ${money(open.amount, open.currency)}`}</Btn>
                  {access.has(open.id) && <Btn disabled={working} onClick={() => revoke(open)}>Remove access only</Btn>}
                </div>
              </Card>
            )}
          </>
        )}
      </Drawer>
    </div>
  )
}
