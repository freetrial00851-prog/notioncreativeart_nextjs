'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadPaddle, paddleConfigured, removePaddleListener, PADDLE_ENVIRONMENT, type PaddleEvent } from '../lib/paddle'
import { track } from '../lib/track'

type Phase = 'loading' | 'ready' | 'error' | 'blocked'

type CheckoutData = { items?: unknown[]; currency_code?: string; totals?: { total?: unknown } }
type OrderItem = { id: string; title: string; image: string | null; price: number }
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const FRAME_CLASS = 'paddle-checkout-frame'

/**
 * Inline Paddle checkout. The transaction was created on the server; this page only displays it.
 * The order itself (and file access) is created by the signed webhook, so after payment we send the
 * buyer to /order-success, which waits for it.
 */
export function PaddleCheckout() {
  const router = useRouter()
  const params = useSearchParams()
  const txn = params.get('txn') ?? params.get('_ptxn')
  const [phase, setPhase] = useState<Phase>(txn && paddleConfigured() ? 'loading' : 'error')
  const [message, setMessage] = useState<string | null>(
    !txn ? 'This checkout link is missing its order. Please start again from the pattern page.' : !paddleConfigured() ? 'Checkout is not available right now.' : null,
  )
  const [items, setItems] = useState<OrderItem[]>([])
  const [total, setTotal] = useState<string | null>(null)
  const itemIds = (params.get('items') ?? '').split(',').filter((id) => UUID_RE.test(id)).slice(0, 25).join(',')
  const opened = useRef(false)

  // Our own product card(s): photo, name and price come from our database, never from the browser's URL.
  useEffect(() => {
    if (!itemIds) return
    let alive = true
    supabase
      .from('products')
      .select('id, title, images, price')
      .in('id', itemIds.split(','))
      .then(({ data }) => {
        if (!alive || !data) return
        const order = itemIds.split(',')
        setItems(
          [...data]
            .sort((a, b) => order.indexOf(a.id as string) - order.indexOf(b.id as string))
            .map((p) => ({ id: p.id as string, title: p.title as string, image: ((p.images as string[] | null) ?? [])[0] ?? null, price: Number(p.price) })),
        )
      })
    return () => { alive = false }
  }, [itemIds])

  useEffect(() => {
    if (!txn || !paddleConfigured()) return
    let alive = true

    const onEvent = (event: PaddleEvent) => {
      if (!alive) return
      const data = (event.data ?? {}) as CheckoutData
      if (event.name === 'checkout.loaded') {
        setPhase('ready')
        track('begin_checkout', { props: { items: Array.isArray(data.items) ? data.items.length : 1 } })
      }
      // Paddle.js reports amounts in major units (5.99), not cents.
      if (data.totals?.total != null) setTotal(formatMoney(data.totals.total, data.currency_code))
      if (event.name === 'checkout.completed') {
        router.push(`/order-success?txn=${encodeURIComponent(txn)}`)
      }
      if (event.name === 'checkout.error' || event.name === 'checkout.failed') {
        setMessage('Something went wrong with the payment form. Please try again.')
        setPhase('error')
      }
    }

    void loadPaddle(onEvent).then((ok) => {
      if (!alive) return
      if (!ok) {
        // Most often an ad blocker or privacy extension stopped paddle.js.
        setPhase('blocked')
        return
      }
      if (opened.current) return
      opened.current = true
      window.Paddle?.Checkout.open({
        transactionId: txn,
        settings: {
          displayMode: 'inline',
          variant: 'one-page',
          frameTarget: FRAME_CLASS,
          frameInitialHeight: 450,
          frameStyle: 'width: 100%; min-width: 312px; background-color: transparent; border: none;',
          successUrl: `${window.location.origin}/order-success?txn=${encodeURIComponent(txn)}`,
          theme: 'light',
        },
      })
    })

    return () => {
      alive = false
      removePaddleListener(onEvent)
    }
  }, [txn, router])

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:py-14">
      <h1 className="type-h1 mb-2 text-ink">Checkout</h1>
      <p className="mb-6 text-[14px] text-muted">
        Secure payment, processed by Paddle, our merchant of record. Your PDF is available as soon as the payment goes through.
      </p>

      {PADDLE_ENVIRONMENT === 'sandbox' && (
        <p className="mb-5 rounded-lg bg-butter px-4 py-3 text-[13px] text-ink" role="note">
          <strong>Test mode.</strong> No real payment is taken. Use the test card 4242 4242 4242 4242, any future date and any 3-digit code.
        </p>
      )}

      <section aria-labelledby="checkout-heading" className="rounded-[10px] border border-border bg-surface p-4 md:p-6">
        <h2 id="checkout-heading" className="sr-only">Payment details</h2>

        {items.length > 0 && (
          <ul className="mb-5 divide-y divide-border" aria-label="Your order">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-4 py-3">
                {it.image ? (
                  <Image src={deriveVariantUrl(it.image, 'card')} alt="" width={64} height={80} className="h-20 w-16 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="h-20 w-16 shrink-0 rounded-md bg-surface-warm" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium leading-snug text-ink">{it.title}</span>
                  <span className="mt-0.5 block text-[13px] text-muted">Crochet pattern · PDF download</span>
                </span>
                <span className="shrink-0 text-[15px] font-semibold text-ink">{formatMoney(it.price, 'USD')}</span>
              </li>
            ))}
            {total && (
              <li className="flex justify-between gap-4 pt-3 text-[15px] font-semibold text-ink">
                <span>Total (including any tax)</span>
                <span>{total}</span>
              </li>
            )}
          </ul>
        )}

        <div aria-live="polite" className="text-[14px] text-muted">
          {phase === 'loading' && <p>Loading secure checkout…</p>}
          {phase === 'blocked' && (
            <p>
              The payment form couldn’t load. If you use an ad blocker or privacy extension, please allow paddle.com for this page and{' '}
              <button type="button" className="underline" onClick={() => window.location.reload()}>try again</button>.
            </p>
          )}
          {phase === 'error' && message && <p role="alert">{message}</p>}
          {phase !== 'error' && message && <p role="alert" className="mt-2 text-sale">{message}</p>}
        </div>

        <div className={`${FRAME_CLASS} ${phase === 'error' || phase === 'blocked' ? 'hidden' : ''}`} />
      </section>

      <p className="mt-5 text-[13px] text-muted">
        By paying you agree to our <Link href="/terms" className="underline">Terms</Link> and{' '}
        <Link href="/refund-policy" className="underline">Refund policy</Link>. Digital download; any sales tax or VAT is calculated in the checkout.{' '}
        <Link href="/shop" className="underline">Back to the shop</Link>
      </p>
    </div>
  )
}

function formatMoney(amount: unknown, currency: unknown) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return ''
  const code = typeof currency === 'string' && currency ? currency : 'USD'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(n)
  } catch {
    return `${n.toFixed(2)} ${code}`
  }
}
