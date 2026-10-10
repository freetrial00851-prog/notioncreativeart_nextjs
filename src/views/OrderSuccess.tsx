'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useToast } from '../context/ToastContext'
import { MaterialIcon } from '../components/MaterialIcon'
import { LevelBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PatternCard } from '../components/PatternCard'
import { PatternGrid } from '../components/PatternGrid'
import { triggerPdfDownload } from '../lib/downloads'
import { downloadOrderReceipt } from '../lib/orderReceipt'
import { trackPinterestPurchase } from '../lib/pinterest'
import { useReviewStatsMapForLists } from '../lib/useReviewStatsMap'
import type { Product } from '../lib/types'

type RecentOrder = {
  id: string
  lemon_order_id: string
  customer_email: string
  status: string
  amount: number
  currency: string
  product_ids: string[]
  created_at: string
}

type OrderProduct = Pick<Product, 'id' | 'title' | 'slug' | 'images' | 'skill_level' | 'pdf_pages'>

type Lookup = { kind: 'polling' } | { kind: 'not_found' } | { kind: 'found'; order: RecentOrder }

type Phase = 'polling' | 'signed_out' | 'not_found' | 'confirmed' | 'pending' | 'refunded'

/** An order older than this is a previous purchase, not the one that just redirected here. */
const RECENT_ORDER_WINDOW_MS = 30 * 60 * 1000
const POLL_ATTEMPTS = 6
const POLL_INTERVAL_MS = 1500
const RECOMMENDATION_POOL = 12
const RECOMMENDATIONS_SHOWN = 4

const PRIMARY_LINK =
  'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-primary px-7 text-[15px] md:text-[14px] font-semibold text-primary-contrast transition-colors hover:bg-primary-hover'
const SECONDARY_LINK =
  'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border-[1.5px] border-primary bg-white px-7 text-[15px] md:text-[14px] font-semibold text-primary transition-colors hover:bg-primary-soft'

function isRecent(createdAt: string) {
  const t = new Date(createdAt).getTime()
  return Number.isFinite(t) && Date.now() - t < RECENT_ORDER_WINDOW_MS
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(amount))
  } catch {
    return `${Number(amount).toFixed(2)} ${currency}`
  }
}

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function fileLabel(pages: number | null) {
  return pages ? `PDF · ${pages} ${pages === 1 ? 'page' : 'pages'}` : 'PDF'
}

export function OrderSuccess({ hideOwnerCopyPlaceholders = false }: { hideOwnerCopyPlaceholders?: boolean }) {
  const { user, loading: authLoading } = useAuth()
  const { requireAuth } = useUI()
  const { showToast } = useToast()
  const [lookup, setLookup] = useState<Lookup>({ kind: 'polling' })
  const [pollRun, setPollRun] = useState(0)
  const [orderProducts, setOrderProducts] = useState<{ orderId: string; products: OrderProduct[] } | null>(null)
  const [pool, setPool] = useState<Product[]>([])
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [receiptBusy, setReceiptBusy] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    // The Lemon Squeezy webhook that creates this order runs asynchronously
    // and can land a few seconds after the redirect, so poll briefly before
    // giving up. Only an order from the last 30 minutes counts as this purchase.
    const poll = () => {
      supabase
        .from('orders')
        .select('id, lemon_order_id, customer_email, status, amount, currency, product_ids, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (cancelled) return
          if (data && isRecent(data.created_at)) {
            setLookup({ kind: 'found', order: data as RecentOrder })
            trackPinterestPurchase({
              orderId: data.id,
              lemonOrderId: data.lemon_order_id,
            })
            return
          }
          attempts += 1
          if (attempts < POLL_ATTEMPTS) timer = setTimeout(poll, POLL_INTERVAL_MS)
          else setLookup({ kind: 'not_found' })
        })
    }
    poll()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [user, pollRun])

  const order = lookup.kind === 'found' ? lookup.order : null
  const orderId = order?.id ?? null
  const productIdsKey = order?.product_ids?.join(',') ?? ''

  useEffect(() => {
    if (!orderId || !productIdsKey) return
    let cancelled = false
    const ids = productIdsKey.split(',')
    void (async () => {
      const { data } = await supabase
        .from('products')
        .select('id, title, slug, images, skill_level, pdf_pages')
        .in('id', ids)
      if (cancelled) return
      const byId = new Map(((data as OrderProduct[]) ?? []).map((p) => [p.id, p]))
      setOrderProducts({
        orderId,
        products: ids.map((id) => byId.get(id)).filter((p): p is OrderProduct => !!p),
      })
    })()
    return () => {
      cancelled = true
    }
  }, [orderId, productIdsKey])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(RECOMMENDATION_POOL)
      if (!cancelled) setPool((data as Product[]) ?? [])
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const phase: Phase = authLoading
    ? 'polling'
    : !user
      ? 'signed_out'
      : lookup.kind === 'polling'
        ? 'polling'
        : lookup.kind === 'not_found'
          ? 'not_found'
          : lookup.order.status === 'paid'
            ? 'confirmed'
            : lookup.order.status === 'refunded'
              ? 'refunded'
              : 'pending'

  useEffect(() => {
    if (phase === 'polling') return
    headingRef.current?.focus({ preventScroll: true })
  }, [phase])

  const products = !productIdsKey
    ? []
    : orderProducts && orderProducts.orderId === orderId
      ? orderProducts.products
      : null
  const boughtIds = useMemo(() => new Set(order?.product_ids ?? []), [order])
  const recommendations = useMemo(
    () => pool.filter((p) => !boughtIds.has(p.id)).slice(0, RECOMMENDATIONS_SHOWN),
    [pool, boughtIds],
  )
  const reviewStats = useReviewStatsMapForLists([recommendations])

  const checkAgain = () => {
    setLookup({ kind: 'polling' })
    setPollRun((n) => n + 1)
  }

  const handleDownload = async (product: OrderProduct) => {
    if (downloadingId) return
    setDownloadingId(product.id)
    const ok = await triggerPdfDownload(product.id, product.title)
    setDownloadingId(null)
    showToast(
      ok ? 'Downloading your pattern…' : "This pattern's file isn't uploaded yet — please check back soon.",
      ok ? 'success' : 'error',
    )
  }

  const handleReceipt = async () => {
    if (!order || receiptBusy) return
    setReceiptBusy(true)
    const result = await downloadOrderReceipt(order.id)
    setReceiptBusy(false)
    if (!result.ok) showToast(result.error, 'error')
  }

  const recommendationsSection = phase !== 'polling' && recommendations.length > 0 && (
    <section className="mt-16 md:mt-20" aria-labelledby="order-recommendations">
      <div className="mb-6 md:mb-8 flex items-end justify-between gap-4">
        <h2 id="order-recommendations" className="font-heading text-3xl md:text-4xl font-bold text-ink">
          You may also like
        </h2>
        <Link href="/shop" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[15px] font-bold text-primary hover:underline">
          View all <span aria-hidden>→</span>
        </Link>
      </div>
      <PatternGrid variant="related">
        {recommendations.map((p) => (
          <PatternCard key={p.id} product={p} reviewStats={reviewStats.get(p.id)} />
        ))}
      </PatternGrid>
    </section>
  )

  const shell = (children: ReactNode) => (
    <div className="max-w-site w-full mx-auto px-5 md:px-8 pt-10 md:pt-14 pb-16">
      {children}
      {recommendationsSection}
    </div>
  )

  if (phase === 'polling') {
    return shell(
      <StatusCard
        role="status"
        icon={<span className="block h-8 w-8 animate-spin rounded-full border-[3px] border-primary-soft border-t-primary" aria-hidden />}
        title="Confirming your order"
      >
        <p>This only takes a moment.</p>
      </StatusCard>,
    )
  }

  if (phase === 'signed_out') {
    return shell(
      <StatusCard icon={<MaterialIcon name="lock" size={28} color="var(--color-primary)" />} title="Sign in to see your order" headingRef={headingRef}>
        <p>Your order and downloads are linked to the account you used at checkout.</p>
        <div className="mt-6 flex justify-center">
          <Button variant="primary" size="lg" className="w-full sm:w-auto sm:min-w-[220px]" onClick={() => requireAuth()}>
            Sign in
          </Button>
        </div>
      </StatusCard>,
    )
  }

  if (phase === 'not_found') {
    return shell(
      <>
        <StatusCard icon={<MaterialIcon name="search" size={28} color="var(--color-primary)" />} title="We couldn't find a recent order" headingRef={headingRef}>
          <p>If you just paid, it can take a minute to appear. Check again, or look in My orders.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="primary" size="lg" onClick={checkAgain}>
              Check again
            </Button>
            <Link href="/account/orders" className={SECONDARY_LINK}>
              Go to My orders
            </Link>
          </div>
        </StatusCard>
        <div className="mx-auto mt-5 max-w-[640px]">
          <SupportCard hidePlaceholder={hideOwnerCopyPlaceholders} />
        </div>
      </>,
    )
  }

  if (!order) return null

  if (phase === 'pending' || phase === 'refunded') {
    const pending = phase === 'pending'
    return shell(
      <>
        <StatusCard
          icon={<MaterialIcon name={pending ? 'hourglass_empty' : 'info'} size={28} color="var(--color-primary)" />}
          title={pending ? "We're still processing your order" : 'This order was refunded'}
          headingRef={headingRef}
        >
          <p>
            {pending
              ? `Order #${order.lemon_order_id} is not confirmed yet. As soon as it is, your patterns will appear in My downloads.`
              : `Order #${order.lemon_order_id} was refunded, so its patterns are no longer in your downloads.`}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {pending && (
              <Button variant="primary" size="lg" onClick={checkAgain}>
                Check again
              </Button>
            )}
            <Link href={pending ? '/account/downloads' : '/account/orders'} className={pending ? SECONDARY_LINK : PRIMARY_LINK}>
              {pending ? 'Go to My downloads' : 'Go to My orders'}
            </Link>
          </div>
        </StatusCard>
        <div className="mx-auto mt-5 max-w-[640px]">
          <SupportCard hidePlaceholder={hideOwnerCopyPlaceholders} />
        </div>
      </>,
    )
  }

  const firstProduct = products?.[0]

  return shell(
    <>
      <header className="text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 md:h-[72px] md:w-[72px] items-center justify-center rounded-full border border-border bg-success-bg" aria-hidden>
          <MaterialIcon name="check" size={32} color="var(--color-free)" />
        </span>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mx-auto max-w-[760px] font-heading text-[34px] md:text-[44px] font-bold leading-[1.1] text-ink outline-none"
        >
          Thank you, your order is confirmed
        </h1>
        <p className="mt-3 text-[16px] md:text-[15px] text-muted">
          Order #{order.lemon_order_id} · {formatOrderDate(order.created_at)}
        </p>
        <p className="mt-2 flex items-start justify-center gap-2 text-[16px] md:text-[14px] text-ink">
          <MaterialIcon name="mail" size={16} className="mt-1 md:mt-0.5 shrink-0" />
          <span>
            We sent your receipt and download links to{' '}
            <strong className="font-bold break-all">{order.customer_email || user?.email}</strong>
          </span>
        </p>
      </header>

      <div className="mt-8 md:mt-10 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-6">
        <section aria-labelledby="ready-title" className="rounded-[20px] border border-border bg-surface p-5 md:p-6">
          <h2 id="ready-title" className="font-heading text-[26px] md:text-[24px] font-bold text-ink">
            Your patterns are ready
          </h2>
          <p className="mt-1.5 text-[16px] md:text-[14px] leading-relaxed text-muted">
            Download now, or come back anytime. Every pattern stays in My downloads.
          </p>

          {products === null ? (
            <ul className="mt-4" aria-hidden>
              {order.product_ids.map((id) => (
                <li key={id} className="flex items-center gap-4 border-b border-border py-4 last:border-b-0">
                  <span className="h-[76px] w-[76px] md:h-16 md:w-16 shrink-0 animate-pulse rounded-xl bg-surface-soft" />
                  <span className="h-4 w-1/2 animate-pulse rounded bg-surface-soft" />
                </li>
              ))}
            </ul>
          ) : products.length > 0 ? (
            <ul className="mt-4">
              {products.map((p) => {
                const busy = downloadingId === p.id
                return (
                  <li key={p.id} className="flex flex-col gap-4 border-b border-border py-4 last:border-b-0 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <span className="relative h-[76px] w-[76px] md:h-16 md:w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-soft">
                        {p.images?.[0] && <Image src={p.images[0]} alt="" fill sizes="76px" className="object-cover" />}
                      </span>
                      <div className="min-w-0">
                        <Link href={`/pattern/${p.slug}`} className="block text-[17px] md:text-[15px] font-semibold leading-snug text-ink line-clamp-2 hover:text-primary">
                          {p.title}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {p.skill_level && <LevelBadge level={p.skill_level} />}
                          <span className="text-[14px] md:text-[12px] text-muted">{fileLabel(p.pdf_pages)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full md:w-auto md:min-w-[150px] min-h-12 md:min-h-11 text-[15px] md:text-[13px]"
                      loading={busy}
                      disabled={!!downloadingId && !busy}
                      onClick={() => void handleDownload(p)}
                      aria-label={`Download PDF of ${p.title}`}
                      iconLeft={busy ? undefined : <MaterialIcon name="download" size={18} />}
                    >
                      Download PDF
                    </Button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-4 text-[15px] text-muted">Your patterns are waiting in My downloads.</p>
          )}

          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <Link href="/account/downloads" className={`${PRIMARY_LINK} md:flex-1`}>
              <MaterialIcon name="person" size={18} />
              Go to My downloads
            </Link>
            <Link href="/shop" className={SECONDARY_LINK}>
              Continue shopping
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-1">
          <section aria-labelledby="summary-title" className="rounded-[20px] border border-border bg-surface p-5 md:p-6 md:col-span-2 lg:col-span-1">
            <h2 id="summary-title" className="text-[20px] md:text-[18px] font-bold text-ink">
              Order summary
            </h2>
            {products && products.length > 0 && (
              <ul className="mt-4 space-y-2 border-b border-border pb-4 text-[15px] md:text-[14px] font-medium text-ink">
                {products.map((p) => (
                  <li key={p.id} className="line-clamp-2">{p.title}</li>
                ))}
              </ul>
            )}
            <dl className="mt-4 flex items-center justify-between gap-4 text-[17px] md:text-[16px] font-bold text-ink">
              <dt>Total</dt>
              <dd>{formatMoney(order.amount, order.currency)}</dd>
            </dl>
            <div className="mt-4 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => void handleReceipt()}
                disabled={receiptBusy}
                aria-busy={receiptBusy || undefined}
                className="-ml-1 inline-flex min-h-11 items-center gap-2 px-1 text-[15px] md:text-[14px] font-semibold text-primary hover:underline underline-offset-2 disabled:opacity-60"
              >
                <MaterialIcon name="receipt_long" size={18} />
                {receiptBusy ? 'Preparing receipt…' : 'View receipt'}
              </button>
            </div>
          </section>

          <SupportCard hidePlaceholder={hideOwnerCopyPlaceholders} />

          {firstProduct && (
            <section aria-labelledby="review-title" className="rounded-[20px] border border-border bg-surface p-5 md:p-6">
              <div className="flex gap-3">
                <MaterialIcon name="star_border" size={22} color="var(--color-gold)" className="mt-0.5 shrink-0" />
                <div>
                  <h2 id="review-title" className="text-[17px] md:text-[16px] font-bold text-ink">Enjoy your pattern?</h2>
                  <p className="mt-1 text-[15px] md:text-[14px] leading-relaxed text-muted">
                    A short review helps other crocheters choose, and helps a small shop a lot.
                  </p>
                  <Link
                    href={`/pattern/${firstProduct.slug}#reviews`}
                    className="-ml-1 mt-1 inline-flex min-h-11 items-center px-1 text-[15px] md:text-[14px] font-semibold text-primary hover:underline underline-offset-2"
                  >
                    Leave a review
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>,
  )
}

function StatusCard({
  icon,
  title,
  headingRef,
  role,
  children,
}: {
  icon: ReactNode
  title: string
  headingRef?: Ref<HTMLHeadingElement>
  role?: 'status'
  children: ReactNode
}) {
  return (
    <section role={role} className="mx-auto max-w-[640px] rounded-[20px] border border-border bg-surface px-6 py-12 md:px-10 text-center">
      <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft" aria-hidden>
        {icon}
      </span>
      <h1 ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="font-heading text-[28px] md:text-[32px] font-bold leading-tight text-ink outline-none">
        {title}
      </h1>
      <div className="mx-auto mt-3 max-w-[460px] text-[16px] md:text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  )
}

function SupportCard({ hidePlaceholder }: { hidePlaceholder: boolean }) {
  return (
    <section aria-labelledby="support-title" className="rounded-[20px] border border-border bg-surface-warm p-5 md:p-6 text-left">
      <div className="flex gap-3">
        <MaterialIcon name="help" size={22} color="var(--color-primary)" className="mt-0.5 shrink-0" />
        <div>
          <h2 id="support-title" className="text-[17px] md:text-[16px] font-bold text-ink">Something not right?</h2>
          <p className="mt-1 text-[15px] md:text-[14px] leading-relaxed text-muted">
            If a file will not open or the email has not arrived after a few minutes,{' '}
            {hidePlaceholder ? (
              <>
                write to us through our{' '}
                <Link href="/contact" className="text-primary underline underline-offset-2 hover:text-primary-hover">
                  Contact page
                </Link>
              </>
            ) : (
              <>
                {/* TODO(owner): real support email */}
                write to us at <span className="text-primary underline">[SUPPORT EMAIL]</span>
              </>
            )}{' '}
            and we will fix it.
          </p>
        </div>
      </div>
    </section>
  )
}
