'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MaterialIcon } from '../components/MaterialIcon'
import { DownloadReceiptButton } from '../components/DownloadReceiptButton'
import { trackPinterestPurchase } from '../lib/pinterest'

type RecentOrder = {
  id: string
  lemon_order_id: string
  customer_email: string
  status: string
}

export function OrderSuccess() {
const { user, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<RecentOrder | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    let attempts = 0

    // The Lemon Squeezy webhook that creates this order runs asynchronously
    // and can land a second or two after the redirect — retry briefly so we
    // don't show a blank/failed state just because we beat the webhook here.
    const poll = () => {
      supabase.from('orders').select('id, lemon_order_id, customer_email, status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
        .then(({ data }) => {
          if (cancelled) return
          if (data) {
            setOrder(data as RecentOrder)
            setChecking(false)
            trackPinterestPurchase({
              orderId: data.id,
              lemonOrderId: data.lemon_order_id,
            })
            return
          }
          attempts += 1
          if (attempts < 6) setTimeout(poll, 1500)
          else setChecking(false)
        })
    }
    poll()
    return () => { cancelled = true }
  }, [user])

  if (authLoading || checking) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse" style={{ background: 'var(--color-surface)' }}>
          <MaterialIcon name="lock" size={26} color="var(--color-ink-soft)" />
        </div>
        <h1 className="font-display font-semibold text-2xl mb-3">Confirming your order…</h1>
        <p className="text-ink-soft text-[14px]">This only takes a moment.</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16 md:py-24 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--color-sale-green)' }}>
        <MaterialIcon name="check" size={30} color="var(--color-canvas)" />
      </div>
      <h1 className="font-display font-semibold text-3xl mb-3">Thank you!</h1>
      <p className="text-ink-soft text-[14px] mb-1">Your order is confirmed.</p>
      {order ? (
        <p className="text-[14px] font-medium mb-6">Order #{order.lemon_order_id}</p>
      ) : (
        <p className="text-ink-soft text-[13px] mb-6">We're still finalizing your order — it'll appear in My Orders shortly.</p>
      )}
      <p className="text-ink-soft text-[13px] mb-8">
        A confirmation email has been sent to {order?.customer_email ?? user?.email}.
      </p>
      <div className="space-y-3">
        <Link href="/account/downloads" className="block w-full py-3.5 text-canvas text-[13px] font-semibold rounded-full hover:opacity-90 transition-opacity" style={{ background: 'var(--color-sale-green)' }}>
          Download your patterns
        </Link>
        {order && <DownloadReceiptButton orderId={order.id} />}
        <Link href="/account/orders" className="block w-full py-3.5 border border-line rounded-full text-[13px] font-semibold text-ink hover:bg-surface transition-colors">
          View my orders
        </Link>
      </div>
      <Link href="/shop" className="block mt-8 text-[13px] text-ink-soft hover:text-ink underline underline-offset-2">Continue Shopping</Link>
    </div>
  )
}
