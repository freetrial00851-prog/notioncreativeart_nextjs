'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useAuth } from '../context/AuthContext'
import { MaterialIcon } from '../components/MaterialIcon'
import { ContentSkeleton } from '../components/Skeleton'
import { StatusBadge, type OrderRow } from '../components/StatusBadge'
import { DownloadReceiptButton } from '../components/DownloadReceiptButton'
import type { Product } from '../lib/types'

const BRAND = '#1f249c'

type OrderItem = { product: Product | null }

export function OrderDetail({ embedded = false }: { embedded?: boolean }) {
  const params = useParams()
  const orderId = typeof params?.orderId === 'string' ? params.orderId : undefined
  const { user, profile } = useAuth()
  const [order, setOrder] = useState<OrderRow | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

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
      alert("This pattern's file isn't uploaded yet — please check back soon.")
      return
    }
    const a = document.createElement('a')
    a.href = data.signedUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  if (loading) return <ContentSkeleton />

  if (!order) {
    return (
      <div className={embedded ? 'py-16 text-center' : 'max-w-[1000px] mx-auto px-6 md:px-16 py-32 text-center'}>
        <p className="font-subheading text-2xl mb-4">Order not found.</p>
        <Link href="/account/orders" className="text-[12px] tracking-[0.12em] border-b border-ink pb-1">BACK TO ORDERS →</Link>
      </div>
    )
  }

  const body = (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="font-heading font-semibold text-2xl md:text-3xl">Order #{order.lemon_order_id || order.id.slice(0, 8)}</h1>
        <StatusBadge status={order.status} />
        <div className="ml-auto">
          <DownloadReceiptButton orderId={order.id} variant="header" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div className="rounded-2xl border border-line bg-white p-5 text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] tracking-[0.12em] text-ink-soft mb-3 font-medium">ORDER SUMMARY</p>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-ink-soft">Date</span><span>{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span>${order.amount.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold pt-2 border-t border-line"><span>Total</span><span>${order.amount.toFixed(2)} {order.currency}</span></div>
            <div className="flex justify-between items-center pt-1 gap-2"><span className="text-ink-soft shrink-0">Payment</span><span className="flex items-center gap-2 flex-wrap justify-end">Lemon Squeezy <StatusBadge status={order.status} /></span></div>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] tracking-[0.12em] text-ink-soft mb-3 font-medium">BILLING</p>
          {profile?.billing_country ? (
            <div className="text-ink-soft leading-relaxed space-y-0.5">
              <p className="text-ink font-medium">{[profile.first_name, profile.last_name].filter(Boolean).join(' ') || user?.email}</p>
              {profile.billing_country === 'US' ? (
                <>
                  {profile.billing_address_line1 && <p>{profile.billing_address_line1}</p>}
                  <p>{[profile.billing_city, profile.billing_state, profile.billing_zip].filter(Boolean).join(', ')}</p>
                </>
              ) : (
                profile.billing_zip && <p>{profile.billing_zip}</p>
              )}
              <p>{profile.billing_country}</p>
            </div>
          ) : (
            <p className="text-ink-soft">
              No billing address on file.{' '}
              <Link href="/account/addresses" className="underline underline-offset-2" style={{ color: BRAND }}>Add one</Link>
            </p>
          )}
          <p className="text-[11px] text-ink-soft mt-3">Digital products — no shipping required.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <p className="text-[11px] tracking-[0.12em] text-ink-soft font-medium px-5 pt-4 pb-2">ORDER ITEMS ({items.length})</p>
        <div className="divide-y divide-line">
          {items.map((item, i) => (
            <div key={item.product?.id ?? i} className="px-5 py-4 flex items-center gap-4">
              <div className="w-14 h-14 shrink-0 bg-surface rounded-lg overflow-hidden">
                {item.product?.images?.[0] && (
                  <img src={deriveVariantUrl(item.product.images[0], 'micro')} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={item.product ? `/pattern/${item.product.slug}` : '#'} className="text-[13px] font-medium hover:underline underline-offset-2 truncate block">
                  {item.product?.title ?? 'Pattern no longer available'}
                </Link>
                {item.product && <p className="text-[12px] text-ink-soft mt-0.5">${item.product.price.toFixed(2)}</p>}
              </div>
              {item.product && (
                <button
                  onClick={() => download(item.product!.id, item.product!.title)}
                  disabled={downloading === item.product.id}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-canvas text-[11px] tracking-[0.08em] font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                  style={{ background: BRAND }}
                >
                  <MaterialIcon name="download" size={14} />
                  {downloading === item.product.id ? '…' : 'DOWNLOAD'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )

  if (embedded) return <div>{body}</div>

  return (
    <div className="max-w-[1000px] mx-auto px-6 md:px-16 py-10 md:py-14">
      <nav className="flex items-center gap-2 text-[12px] text-ink-soft mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/account/orders" className="hover:text-ink">Orders</Link>
        <span>/</span>
        <span className="text-ink">Order #{order.lemon_order_id}</span>
      </nav>
      {body}
    </div>
  )
}
