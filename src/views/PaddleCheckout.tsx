'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadPaddle, paddleConfigured, removePaddleListener, PADDLE_ENVIRONMENT, type PaddleEvent } from '../lib/paddle'
import { track } from '../lib/track'

type Phase = 'loading' | 'ready' | 'error' | 'blocked'

type CheckoutLine = { product?: { name?: string }; product_name?: string; totals?: { total?: unknown } }
type CheckoutData = { items?: CheckoutLine[]; currency_code?: string; totals?: { total?: unknown } }

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
  const [lines, setLines] = useState<{ name: string; total: string }[]>([])
  const [total, setTotal] = useState<string | null>(null)
  const opened = useRef(false)

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
      if (Array.isArray(data.items)) {
        setLines(
          data.items.map((i) => ({
            name: String(i?.product?.name ?? i?.product_name ?? 'Crochet pattern'),
            total: formatMoney(i?.totals?.total, data.currency_code),
          })),
        )
      }
      if (data.totals?.total != null) setTotal(formatMoney(data.totals.total, data.currency_code))
      if (event.name === 'checkout.completed') {
        router.push('/order-success')
      }
      if (event.name === 'checkout.error' || event.name === 'checkout.failed') {
        setMessage('Something went wrong with the payment form. Please try again.')
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
          successUrl: `${window.location.origin}/order-success`,
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

        {lines.length > 0 && (
          <ul className="mb-4 divide-y divide-border text-[14px]" aria-label="Order summary">
            {lines.map((l, i) => (
              <li key={i} className="flex justify-between gap-4 py-2">
                <span className="text-ink">{l.name}</span>
                <span className="text-muted">{l.total}</span>
              </li>
            ))}
            {total && (
              <li className="flex justify-between gap-4 py-2 font-semibold text-ink">
                <span>Total</span>
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

function formatMoney(minor: unknown, currency: unknown) {
  const n = Number(minor)
  if (!Number.isFinite(n)) return ''
  const code = typeof currency === 'string' && currency ? currency : 'USD'
  const zeroDecimal = ['JPY', 'KRW', 'VND', 'CLP', 'HUF'].includes(code)
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(zeroDecimal ? n : n / 100)
  } catch {
    return `${(n / 100).toFixed(2)} ${code}`
  }
}
