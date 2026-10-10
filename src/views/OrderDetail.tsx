'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { downloadOrderReceipt } from '../lib/orderReceipt'
import { MaterialIcon } from '../components/MaterialIcon'
import { LevelBadge } from '../components/ui/Badge'
import { ContentSkeleton } from '../components/Skeleton'
import { type OrderRow } from '../components/StatusBadge'
import {
  ACCOUNT_CARD,
  OrderStatusPill,
  PRIMARY_PILL,
  SECONDARY_PILL,
  fileLabel,
  formatMoney,
  formatShortDate,
} from '../components/account/AccountUI'
import type { Product } from '../lib/types'

type OrderItem = { product: Product | null }

export function OrderDetail({ embedded = false }: { embedded?: boolean }) {
  const params = useParams()
  const orderId = typeof params?.orderId === 'string' ? params.orderId : undefined
  const { user } = useAuth()
  const { showToast } = useToast()
  const [order, setOrder] = useState<OrderRow | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [receiptBusy, setReceiptBusy] = useState(false)

  useEffect(() => {
    if (!user || !orderId) return
    supabase.from('orders').select('*').eq('id', orderId).eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        setOrder(data as OrderRow | null)
        const productIds = (data as OrderRow | null)?.product_ids ?? []
        if (productIds.length === 0) { setLoading(false); return }
        supabase.from('products').select('*').in('id', productIds).then(({ data: products }) => {
          setItems(productIds.map((id) => ({ product: (products as Product[] | null)?.find((p) => p.id === id) ?? null })))
          setLoading(false)
        })
      })
  }, [user, orderId])

  const download = async (productId: string, title?: string) => {
    setDownloading(productId)
    const filename = `${(title ?? 'pattern').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.pdf`
    const { data, error } = await supabase.storage.from('patterns').createSignedUrl(`${productId}.pdf`, 60, { download: filename })
    setDownloading(null)
    if (error || !data) {
      showToast("This pattern's file isn't uploaded yet — please check back soon.", 'error')
      return
    }
    const a = document.createElement('a')
    a.href = data.signedUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const viewReceipt = async () => {
    if (!order || receiptBusy) return
    setReceiptBusy(true)
    const result = await downloadOrderReceipt(order.id)
    setReceiptBusy(false)
    if (!result.ok) showToast(result.error, 'error')
  }

  const backLink = (
    <Link href="/account/orders" className="-ml-1 mb-3 inline-flex min-h-11 items-center gap-1 px-1 text-[15px] md:text-[14px] font-medium text-ink hover:text-primary">
      <MaterialIcon name="chevron_left" size={20} />
      All orders
    </Link>
  )

  if (loading) return <ContentSkeleton />

  if (!order) {
    const notFound = (
      <div>
        {backLink}
        <div className={`${ACCOUNT_CARD} px-6 py-12 text-center`}>
          <h1 className="font-heading text-[28px] font-bold text-ink">Order not found</h1>
          <p className="mt-2 text-[15px] text-muted">This order is not in your account.</p>
          <Link href="/account/orders" className={`${PRIMARY_PILL} mt-6 min-h-[52px]`}>Back to orders</Link>
        </div>
      </div>
    )
    return embedded ? notFound : <div className="max-w-site w-full mx-auto px-5 md:px-8 py-10">{notFound}</div>
  }

  const body = (
    <div>
      {backLink}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-[32px] md:text-[40px] font-bold leading-tight text-ink">
            Order #{order.lemon_order_id || order.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-[16px] md:text-[14px] text-muted">Placed {formatShortDate(order.created_at)}</p>
        </div>
        <OrderStatusPill status={order.status} />
      </div>

      <section aria-labelledby="order-items-title" className={`${ACCOUNT_CARD} p-5 md:p-6`}>
        <h2 id="order-items-title" className="text-[18px] md:text-[17px] font-bold text-ink">
          {items.length === 1 ? '1 pattern' : `${items.length} patterns`}
        </h2>
        {items.length > 0 && (
          <ul className="mt-2">
            {items.map((item, i) => {
              const p = item.product
              const busy = !!p && downloading === p.id
              return (
                <li key={p?.id ?? i} className="flex flex-col gap-4 border-b border-border py-4 last:border-b-0 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="relative h-[72px] w-[72px] md:h-16 md:w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-soft" aria-hidden>
                      {p?.images?.[0] && <Image src={p.images[0]} alt="" fill sizes="72px" className="object-cover" />}
                    </span>
                    <div className="min-w-0">
                      {p ? (
                        <Link href={`/pattern/${p.slug}`} className="block text-[17px] md:text-[15px] font-semibold leading-snug text-ink line-clamp-2 hover:text-primary">
                          {p.title}
                        </Link>
                      ) : (
                        <p className="text-[16px] md:text-[15px] text-muted">Pattern no longer available</p>
                      )}
                      {p && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {p.skill_level && <LevelBadge level={p.skill_level} />}
                          <span className="text-[14px] md:text-[12px] text-muted">{fileLabel(p.pdf_pages)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {p && (
                    <button
                      type="button"
                      onClick={() => void download(p.id, p.title)}
                      disabled={busy}
                      aria-busy={busy || undefined}
                      aria-label={`Download PDF of ${p.title}`}
                      className={`${PRIMARY_PILL} min-h-12 w-full md:min-h-11 md:w-auto md:min-w-[160px]`}
                    >
                      {!busy && <MaterialIcon name="download" size={18} />}
                      {busy ? 'Preparing…' : 'Download PDF'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
          <p className="flex items-baseline gap-2.5">
            <span className="text-[15px] md:text-[14px] text-muted">Total</span>
            <span className="text-[19px] md:text-[17px] font-bold text-ink">{formatMoney(order.amount, order.currency)}</span>
          </p>
          <button type="button" onClick={() => void viewReceipt()} disabled={receiptBusy} aria-busy={receiptBusy || undefined} className={SECONDARY_PILL}>
            {receiptBusy ? 'Preparing receipt…' : 'View receipt'}
          </button>
        </div>
      </section>
    </div>
  )

  if (embedded) return body

  return <div className="max-w-site w-full mx-auto px-5 md:px-8 py-10">{body}</div>
}
