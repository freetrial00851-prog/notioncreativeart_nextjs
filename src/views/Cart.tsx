'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from '../context/ToastContext'
import { setPendingCheckout } from '../lib/guestStorage'
import { supabase } from '../lib/supabase'
import { useReviewStatsMapForLists } from '../lib/useReviewStatsMap'
import { MaterialIcon } from '../components/MaterialIcon'
import { LevelBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PatternCard } from '../components/PatternCard'
import { PatternGrid } from '../components/PatternGrid'
import { ContentSkeleton } from '../components/Skeleton'
import type { Product } from '../lib/types'

const RECOMMENDATION_POOL = 12
const RECOMMENDATIONS_SHOWN = 4

function money(n: number) {
  return `$${n.toFixed(2)}`
}

function isOnSale(p: Product) {
  return p.price > 0 && !!p.compare_at_price && p.compare_at_price > p.price
}

function patternsLabel(n: number) {
  return `${n} ${n === 1 ? 'pattern' : 'patterns'}`
}

export function Cart() {
  const { user, loading: authLoading } = useAuth()
  const { requireAuth } = useUI()
  const { items, loading, removeFromCart, checkingOut, checkoutError, checkout } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { showToast } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pool, setPool] = useState<Product[]>([])

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

  const lines = useMemo(
    () => items.filter((i): i is typeof i & { product: Product } => !!i.product),
    [items],
  )
  const cartIds = useMemo(() => new Set(items.map((i) => i.product_id)), [items])
  const recommendations = useMemo(
    () => pool.filter((p) => !cartIds.has(p.id)).slice(0, RECOMMENDATIONS_SHOWN),
    [pool, cartIds],
  )
  const reviewStats = useReviewStatsMapForLists([recommendations])

  if (authLoading || (loading && items.length === 0)) return <ContentSkeleton />

  const total = lines.reduce((sum, i) => sum + i.product.price, 0)
  const regularSubtotal = lines.reduce(
    (sum, i) => sum + (isOnSale(i.product) ? (i.product.compare_at_price as number) : i.product.price),
    0,
  )
  const savings = Math.max(0, regularSubtotal - total)
  const count = lines.length

  const handleCheckout = () => {
    if (!user) {
      setPendingCheckout(true)
      requireAuth()
      return
    }
    void checkout()
  }

  const handleRemove = async (productId: string) => {
    setBusyId(productId)
    try {
      await removeFromCart(productId)
    } finally {
      setBusyId(null)
    }
  }

  const handleSaveForLater = async (productId: string) => {
    setBusyId(productId)
    try {
      if (!isWishlisted(productId)) {
        const { added } = await toggleWishlist(productId)
        if (!added) return
      }
      await removeFromCart(productId)
      showToast('Saved to your wishlist.', 'success')
    } finally {
      setBusyId(null)
    }
  }

  const recommendationsSection = recommendations.length > 0 && (
    <section className="mt-16 md:mt-20" aria-labelledby="cart-recommendations">
      <div className="mb-6 md:mb-8 flex items-end justify-between gap-4">
        <h2 id="cart-recommendations" className="font-heading text-3xl md:text-4xl font-bold text-ink">
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

  const topNav = (
    <>
      <Link
        href="/shop"
        className="md:hidden -ml-1 inline-flex min-h-11 items-center gap-1 px-1 text-[15px] font-medium text-ink"
      >
        <MaterialIcon name="chevron_left" size={20} />
        Continue shopping
      </Link>
      <nav aria-label="Breadcrumb" className="hidden md:block">
        <ol className="flex items-center gap-2 text-[13px] text-muted">
          <li>
            <Link href="/" className="hover:text-ink">Home</Link>
          </li>
          <li aria-hidden>›</li>
          <li aria-current="page" className="font-semibold text-ink">Cart</li>
        </ol>
      </nav>
    </>
  )

  if (count === 0) {
    return (
      <div className="max-w-site w-full mx-auto px-5 md:px-10 lg:px-8 pt-4 md:pt-6 pb-16">
        {topNav}
        <h1 className="font-heading text-[40px] md:text-[44px] font-bold text-ink leading-tight mt-3 md:mt-4">Your cart</h1>
        <div className="mt-6 rounded-[20px] border border-border bg-surface px-6 py-14 text-center">
          <span className="mx-auto mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-primary-soft" aria-hidden>
            <MaterialIcon name="shopping_bag" size={34} color="var(--color-primary)" />
          </span>
          <p className="font-heading text-[24px] font-bold text-ink mb-2">Your cart is empty</p>
          <p className="mx-auto mb-7 max-w-sm text-[15px] leading-relaxed text-muted">
            Pick a pattern you love and it will wait here. Saved items stay in your cart for about 7 days.
          </p>
          <div className="mx-auto flex w-full max-w-[300px] flex-col items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-primary px-7 text-[15px] font-semibold text-primary-contrast hover:bg-primary-hover"
            >
              Shop all patterns
            </Link>
            <Link
              href="/shop?price=free"
              className="inline-flex min-h-11 items-center px-3 text-[15px] font-semibold text-primary underline-offset-2 hover:underline"
            >
              Browse free patterns
            </Link>
          </div>
        </div>
        {recommendationsSection}
      </div>
    )
  }

  return (
    <div className="max-w-site w-full mx-auto px-5 md:px-10 lg:px-8 pt-4 md:pt-6 pb-28 md:pb-16">
      {topNav}

      <h1 className="mt-3 md:mt-4 flex flex-wrap items-baseline gap-x-3 font-heading text-[40px] md:text-[44px] font-bold text-ink leading-tight">
        Your cart
        <span className="font-body text-[18px] md:text-[16px] font-medium text-muted">{patternsLabel(count)}</span>
      </h1>

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-6">
        <ul className="rounded-[20px] border border-border bg-surface px-4 md:px-6 py-2 md:py-3">
          {lines.map(({ product_id, product }) => {
            const onSale = isOnSale(product)
            const busy = busyId === product_id
            const price = (
              <span className="text-[20px] md:text-[17px] font-bold text-primary">
                {onSale && <span className="sr-only">Now </span>}
                {money(product.price)}
              </span>
            )
            const oldPrice = onSale && product.compare_at_price != null && (
              <span className="text-[14px] md:text-[12px] text-muted line-through">
                <span className="sr-only">Was </span>
                {money(product.compare_at_price)}
              </span>
            )
            return (
              <li
                key={product_id}
                aria-busy={busy || undefined}
                className={`flex gap-4 border-b border-border py-5 last:border-b-0 transition-opacity ${busy ? 'opacity-60' : ''}`}
              >
                <Link
                  href={`/pattern/${product.slug}`}
                  tabIndex={-1}
                  aria-hidden
                  className="relative h-[92px] w-[92px] md:h-[96px] md:w-[96px] lg:h-[88px] lg:w-[88px] shrink-0 overflow-hidden rounded-xl border border-border bg-surface-soft"
                >
                  {product.images?.[0] && (
                    <Image src={product.images[0]} alt="" fill sizes="96px" className="object-cover" />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col md:flex-row md:gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/pattern/${product.slug}`}
                      className="block text-[16px] md:text-[15px] font-semibold text-ink leading-snug line-clamp-2 hover:text-primary"
                    >
                      {product.title}
                    </Link>
                    <div className="mt-1.5 flex flex-col items-start gap-1.5 md:flex-row md:flex-wrap md:items-center md:gap-2">
                      {product.skill_level && <LevelBadge level={product.skill_level} />}
                      <span className="text-[14px] md:text-[12px] text-muted">PDF · instant download</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-x-4 md:justify-start md:gap-x-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleSaveForLater(product_id)}
                        aria-label={`Save ${product.title} for later`}
                        className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-[15px] md:text-[13px] text-muted hover:text-ink disabled:cursor-wait"
                      >
                        <MaterialIcon name="favorite" size={16} />
                        Save for later
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleRemove(product_id)}
                        aria-label={`Remove ${product.title} from cart`}
                        className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap text-[15px] md:text-[13px] text-muted hover:text-ink disabled:cursor-wait"
                      >
                        <MaterialIcon name="delete" size={16} />
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="mt-1 flex items-baseline justify-end gap-2 md:hidden">
                    {price}
                    {oldPrice}
                  </p>
                  <p className="hidden md:flex shrink-0 flex-col items-end gap-0.5 text-right">
                    {price}
                    {oldPrice}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>

        <aside
          aria-labelledby="order-summary-title"
          className="rounded-[20px] border border-border bg-surface p-5 md:p-6 lg:p-5 lg:sticky lg:top-24"
        >
          <h2 id="order-summary-title" className="text-[20px] md:text-[18px] font-bold text-ink mb-4">
            Order summary
          </h2>
          <dl className="space-y-2.5 text-[15px] md:text-[14px] text-muted">
            <div className="flex items-center justify-between gap-4">
              <dt>Subtotal ({patternsLabel(count)})</dt>
              <dd>{money(regularSubtotal)}</dd>
            </div>
            {savings > 0.004 && (
              <div className="flex items-center justify-between gap-4">
                <dt>You save</dt>
                <dd className="font-bold text-free">{money(savings)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <dt>Taxes</dt>
              <dd>Shown at checkout</dd>
            </div>
            <div className="!mt-4 flex items-center justify-between gap-4 border-t border-border pt-4 text-[17px] md:text-[15px] font-bold text-ink">
              <dt>Total</dt>
              <dd>{money(total)}</dd>
            </div>
          </dl>

          {checkoutError && (
            <p role="alert" className="mt-3 text-[13px] text-error">
              {checkoutError}
            </p>
          )}

          <Button
            variant="primary"
            size="lg"
            className="mt-4 w-full"
            loading={checkingOut}
            onClick={handleCheckout}
            iconRight={checkingOut ? undefined : <span aria-hidden>→</span>}
          >
            Checkout
          </Button>
          {!user && (
            <p className="mt-2.5 text-center text-[12px] text-muted">
              You will sign in or create a free account at checkout.
            </p>
          )}
          <div className="mt-1 text-center">
            <Link href="/shop" className="inline-flex min-h-11 items-center text-[14px] font-semibold text-primary hover:underline underline-offset-2">
              Continue shopping
            </Link>
          </div>

          <ul className="mt-2 space-y-3 border-t border-border pt-4 text-[14px] md:text-[13px] text-muted">
            <li className="flex items-center gap-2.5">
              <MaterialIcon name="verified_user" size={16} color="var(--color-free)" className="shrink-0" />
              Secure checkout by Lemon Squeezy
            </li>
            <li className="flex items-center gap-2.5">
              <MaterialIcon name="download" size={16} color="var(--color-free)" className="shrink-0" />
              Instant PDF download after payment
            </li>
            <li className="flex items-center gap-2.5">
              <ClockIcon />
              Lifetime access in your account
            </li>
          </ul>
        </aside>
      </div>

      {recommendationsSection}

      <div className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <p className="text-[13px] text-muted leading-tight">Total</p>
            <p className="text-[20px] font-extrabold text-ink leading-tight">{money(total)}</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            loading={checkingOut}
            onClick={handleCheckout}
          >
            Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="9" stroke="var(--color-free)" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="var(--color-free)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
