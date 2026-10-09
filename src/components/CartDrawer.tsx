'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { setPendingCheckout } from '../lib/guestStorage'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { LevelBadge } from './ui/Badge'
import { Button } from './ui/Button'
import type { Product } from '../lib/types'

/**
 * Cart drawer — DESIGN_SPEC §3.9.
 * Right panel on md+, bottom sheet on mobile. Keeps existing checkout / auth behaviour.
 */
export function CartDrawer() {
  const { user } = useAuth()
  const { requireAuth } = useUI()
  const { items, count, drawerOpen, closeDrawer, justAdded, removeFromCart, checkingOut, checkoutError, checkout } =
    useCart()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  useBodyScrollLock(drawerOpen)

  const handleCheckout = () => {
    if (!user) {
      setPendingCheckout(true)
      requireAuth()
      return
    }
    void checkout()
  }

  useEffect(() => {
    if (!drawerOpen) return
    closeButtonRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !checkingOut) closeDrawer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen, closeDrawer, checkingOut])

  const total = items.reduce((sum, i) => sum + (i.product?.price ?? 0), 0)

  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => {
          if (!checkingOut) closeDrawer()
        }}
        className={`fixed inset-0 z-50 bg-ink/40 transition-opacity duration-200 motion-reduce:transition-none ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        aria-hidden={!drawerOpen}
        inert={drawerOpen ? undefined : true}
        className={`fixed z-50 bg-surface flex flex-col shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none
          inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl
          md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:max-h-none md:h-full md:w-[420px] md:rounded-none
          ${drawerOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full invisible'}`}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <h2 className="font-heading text-2xl font-bold text-ink">Your cart ({count})</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Close cart"
            className="touch-target inline-flex items-center justify-center rounded-full hover:bg-surface-warm"
          >
            <CloseIcon />
          </button>
        </div>

        {justAdded && (
          <div className="mx-6 mb-3 px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 bg-success-bg animate-[fadeIn_0.3s_ease-out]">
            <CheckCircleIcon />
            <span className="text-[13px] font-medium text-ink">Added to your cart</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-10">
            <p className="font-heading text-xl font-bold text-ink mb-2">Your cart is empty</p>
            <p className="text-[14px] text-muted mb-6 max-w-xs leading-relaxed">
              Pick a pattern you love and it will wait here. Saved items stay in your cart for about 7 days.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Link
                href="/shop"
                onClick={closeDrawer}
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full bg-primary px-7 text-[14px] font-semibold text-primary-contrast hover:bg-primary-hover"
              >
                Shop all patterns
              </Link>
              <Link
                href="/shop?price=free"
                onClick={closeDrawer}
                className="text-center text-[13px] font-semibold text-primary underline-offset-2 hover:underline"
              >
                Browse free patterns
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 divide-y divide-border">
              {items.map((item) => (
                <CartLine
                  key={item.product_id}
                  product={item.product}
                  onRemove={() => removeFromCart(item.product_id)}
                  onNavigate={closeDrawer}
                />
              ))}
            </div>

            <div className="border-t border-border px-6 py-5 shrink-0 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[14px] text-ink">Subtotal</span>
                <span className="text-[18px] font-extrabold text-primary">${total.toFixed(2)}</span>
              </div>
              <p className="text-[12px] text-muted">Taxes, if any, are shown at checkout.</p>
              {checkoutError && <p className="text-[12px] text-sale">{checkoutError}</p>}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={checkingOut}
                onClick={handleCheckout}
                iconRight={<span aria-hidden>→</span>}
              >
                Checkout
              </Button>
              <button
                type="button"
                onClick={closeDrawer}
                className="block w-full text-center text-[13px] font-semibold text-primary py-2"
              >
                Continue shopping
              </button>
              <p className="flex items-start gap-2 text-[11px] text-muted leading-relaxed pt-1">
                <ShieldIcon />
                <span>
                  Secure checkout by Lemon Squeezy. You will sign in or create a free account to get your downloads.
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function CartLine({
  product,
  onRemove,
  onNavigate,
}: {
  product?: Product | null
  onRemove: () => void
  onNavigate: () => void
}) {
  if (!product) return null
  const onSale =
    product.price > 0 && !!product.compare_at_price && product.compare_at_price > product.price

  return (
    <div className="flex gap-3 py-5">
      <Link
        href={`/pattern/${product.slug}`}
        onClick={onNavigate}
        className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-surface-warm border border-border"
      >
        {product.images?.[0] && (
          <img
            src={deriveVariantUrl(product.images[0], 'micro')}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/pattern/${product.slug}`}
          onClick={onNavigate}
          className="block text-[14px] font-semibold text-ink leading-snug line-clamp-2"
        >
          {product.title}
        </Link>
        {product.skill_level && (
          <div className="mt-1.5">
            <LevelBadge level={product.skill_level} />
          </div>
        )}
        <p className="text-[12px] text-muted mt-1.5">PDF · instant download</p>
        <button
          type="button"
          onClick={onRemove}
          className="mt-1.5 text-[12px] font-medium text-primary underline underline-offset-2"
        >
          Remove
        </button>
      </div>
      <div className="shrink-0 text-right">
        {onSale && product.compare_at_price != null && (
          <p className="text-[12px] text-muted line-through">${product.compare_at_price.toFixed(2)}</p>
        )}
        <p className="text-[14px] font-bold text-primary">
          {product.price === 0 ? 'Free' : `$${product.price.toFixed(2)}`}
        </p>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="9" stroke="var(--color-free)" strokeWidth="2" />
      <path d="M8 12.5l2.5 2.5L16 9" stroke="var(--color-free)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 mt-0.5">
      <path
        d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z"
        stroke="var(--color-free)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9.5 12l1.8 1.8L15 10" stroke="var(--color-free)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
