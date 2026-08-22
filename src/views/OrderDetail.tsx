'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useAuth } from '../context/AuthContext'
import { MaterialIcon } from '../components/MaterialIcon'
import { StatusBadge, type OrderRow } from './Account'
import type { Product } from '../lib/types'

type OrderItem = { product: Product | null }

export function OrderDetail() {
  const params = useParams()
  const orderId = typeof params?.orderId === 'string' ? params.orderId : undefined
  const { user } = useAuth()
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

  if (loading) return <div className="max-w-[1000px] mx-auto px-6 md:px-16 py-32 text-center text-ink-soft text-sm">Loading…</div>

  if (!order) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 md:px-16 py-32 text-center">
        <p className="font-subheading text-2xl mb-4">Order not found.</p>
        <Link href="/account/orders" className="text-[12px] tracking-[0.12em] border-b border-ink pb-1">BACK TO ORDERS →</Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1000px] mx-auto px-6 md:px-16 py-10 md:py-14">
      <nav className="flex items-center gap-2 text-[12px] text-ink-soft mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/account/orders" className="hover:text-ink">My Purchases</Link>
        <span>/</span>
        <span className="text-ink">Order #{order.lemon_order_id}</span>
      </nav>

      <div className="flex items-center gap-3 mb-8">
        <h1 className="font-display font-semibold text-2xl md:text-3xl">Order #{order.lemon_order_id}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-8">
        <div>
          <div className="rounded-xl border border-line px-5 py-4 mb-6 grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <p className="text-[11px] tracking-[0.1em] text-ink-soft mb-1">ORDER DATE</p>
              <p>{new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.1em] text-ink-soft mb-1">PAYMENT</p>
              <p>Powered by Lemon Squeezy</p>
            </div>
          </div>

          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">ITEMS ({items.length})</p>
          <div className="divide-y divide-line border-t border-b border-line">
            {items.map((item, i) => (
              <div key={item.product?.id ?? i} className="py-4 flex items-center gap-4">
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
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 border border-ink rounded-lg text-[11px] tracking-[0.08em] hover:bg-surface transition-colors disabled:opacity-50"
                  >
                    <MaterialIcon name="download" size={14} />
                    {downloading === item.product.id ? '…' : 'DOWNLOAD'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-line px-5 py-4 h-fit space-y-2.5 text-[13px]">
          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-1">ORDER SUMMARY</p>
          <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span>${order.amount.toFixed(2)}</span></div>
          <div className="flex justify-between font-medium pt-2 border-t border-line"><span>Total</span><span>${order.amount.toFixed(2)} {order.currency}</span></div>
        </div>
      </div>
    </div>
  )
}
