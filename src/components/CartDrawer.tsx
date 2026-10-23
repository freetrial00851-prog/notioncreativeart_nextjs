'use client'

import { useRef } from 'react'
import { useSheet } from '../lib/useSheet'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { setPendingCheckout } from '../lib/guestStorage'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { useFocusTrap } from '../lib/useFocusTrap'
import { LevelBadge } from './ui/Badge'
import { Button } from './ui/Button'
import { MaterialIcon } from './MaterialIcon'
import type { Product } from '../lib/types'
import { useCheckoutProvider } from '../lib/useCheckoutProvider'
import { allProductsUsePaddle } from '../lib/paddle'
import { SHOW_COMPARE_AT_PRICES } from '../lib/pricing'

/**
 * Cart drawer — DESIGN_SPEC §3.9.
 * Right panel on md+, bottom sheet on mobile. Keeps existing checkout / auth behaviour.
 */
export function CartDrawer() {
  const { user } = useAuth()
  const { name: payProviderName, provider: payProvider } = useCheckoutProvider()
  const { requireAuth } = useUI()
  const { items, count, drawerOpen, closeDrawer, justAdded, removeFromCart, checkingOut, checkoutError, checkout } =
    useCart()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock(drawerOpen)
  const { dragHandlers } = useSheet({
    open: drawerOpen,
    onClose: () => {
      if (!checkingOut) closeDrawer()
    },
    panelRef,
    scrimRef,
    dragDisabled: checkingOut,
  })
  useFocusTrap(panelRef, drawerOpen, {
    initialFocusRef: closeButtonRef,
    onEscape: () => {
      if (!checkingOut) closeDrawer()
    },
  })

  const handleCheckout = async () => {
    // Paddle carts can be paid for without an account; Lemon Squeezy ones still need a sign-in first.
    if (!user && !(await allProductsUsePaddle(items.map((i) => i.product_id)))) {
      setPendingCheckout(true)
      requireAuth()
      return
    }
    void checkout()
  }

  const total = items.reduce((sum, i) => sum + (i.product?.price ?? 0), 0)
  const empty = items.length === 0

  return (
    <>
      <div
        ref={scrimRef}
        aria-hidden="true"
        onClick={() => {
          if (!checkingOut) closeDrawer()
        }}
        className={`fixed inset-0 z-50 bg-navy/40 opacity-0 ${drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        aria-hidden={!drawerOpen}
        inert={drawerOpen ? undefined : true}
        tabIndex={-1}
        className="fixed z-50 flex flex-col bg-background shadow-2xl outline-none will-change-transform invisible [transform:translateY(100%)] inset-x-0 bottom-0 max-h-[90dvh] rounded-t-[5px] md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:max-h-none md:h-full md:w-[420px] md:rounded-none md:[transform:translateX(100%)]"
      >
        {/* Drag zone (mobile): handle + title bar. A real handle — it actually drags. */}
        <div {...dragHandlers} style={{ touchAction: 'none' }} className="shrink-0 cursor-grab select-none active:cursor-grabbing md:cursor-auto">
        <div className="flex justify-center pt-3 md:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-border" />
        </div>

        <div className="flex items-center justify-between gap-3 pl-6 pr-3 pt-2 pb-3 md:pt-4 shrink-0">
          <h2 id="cart-drawer-title" className="type-h2 text-ink leading-tight">
            Your cart
            {!empty && <span className="ml-1.5 font-body text-[15px] font-normal text-muted">({count})</span>}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => {
              if (!checkingOut) closeDrawer()
            }}
            aria-label="Close cart"
            className="touch-target inline-flex items-center justify-center rounded-[3px] text-ink hover:bg-surface-warm"
          >
            <MaterialIcon name="close" size={24} />
          </button>
        </div>
        </div>

        {justAdded && !empty && (
          <div
            role="status"
            className="mx-6 mb-2 flex shrink-0 items-center gap-2.5 rounded-xl border border-free/15 bg-success-bg px-4 py-3 animate-[fadeIn_0.3s_ease-out]"
          >
            <MaterialIcon name="check" size={18} color="var(--color-free)" />
            <span className="text-[14px] font-semibold text-free">Added to your cart</span>
          </div>
        )}

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-[3px] bg-primary-soft" aria-hidden>
              <BagIcon />
            </span>
            <p className="type-h2 text-ink mb-2">Your cart is empty</p>
            <p className="text-[15px] text-muted mb-5 max-w-xs leading-relaxed">
              Pick a pattern you love and it will wait here. Saved items stay in your cart for about 7 days.
            </p>
            <div className="flex w-full max-w-[300px] flex-col items-center gap-3">
              <Link
                href="/shop"
                onClick={closeDrawer}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[3px] bg-primary px-7 text-[15px] font-semibold text-primary-contrast hover:bg-primary-hover"
              >
                Shop all patterns
              </Link>
              <Link
                href="/shop?price=free"
                onClick={closeDrawer}
                className="inline-flex min-h-11 items-center px-3 text-[15px] font-semibold text-primary underline-offset-2 hover:underline"
              >
                Browse free patterns
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto overscroll-contain px-6">
              {items.map((item) => (
                <CartLine
                  key={item.product_id}
                  product={item.product}
                  onRemove={() => removeFromCart(item.product_id)}
                  onNavigate={closeDrawer}
                />
              ))}
            </ul>

            <div className="shrink-0 space-y-3 border-t border-border bg-surface px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between">
                <span className="text-[15px] font-semibold text-ink">Subtotal</span>
                <span className="text-[18px] font-bold text-ink">${total.toFixed(2)}</span>
              </div>
              <p className="text-[13px] text-muted">Taxes, if any, are shown at checkout.</p>
              {checkoutError && (
                <p role="alert" className="text-[13px] text-error">
                  {checkoutError}
                </p>
              )}
              <Button
                variant="primary"
                size="md"
                className="w-full"
                loading={checkingOut}
                onClick={handleCheckout}
                iconRight={checkingOut ? undefined : <ArrowIcon />}
              >
                Checkout
              </Button>
              <button
                type="button"
                onClick={closeDrawer}
                className="flex min-h-11 w-full items-center justify-center text-[15px] font-semibold text-primary hover:underline underline-offset-2"
              >
                Continue shopping
              </button>
              <p className="flex items-start gap-2 text-[12px] text-muted leading-relaxed">
                <MaterialIcon name="verified_user" size={15} color="var(--color-free)" className="mt-0.5 shrink-0" />
                <span>
                  Secure checkout by {payProviderName}. {payProvider === 'paddle' ? 'No account needed: your download link appears right after payment.' : 'You will sign in or create a free account to get your downloads.'}
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
    SHOW_COMPARE_AT_PRICES && product.price > 0 && !!product.compare_at_price && product.compare_at_price > product.price

  return (
    <li className="flex gap-4 border-b border-border py-5">
      <Link
        href={`/pattern/${product.slug}`}
        onClick={onNavigate}
        tabIndex={-1}
        aria-hidden
        className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-border bg-surface-soft md:h-14 md:w-14"
      >
        {product.images?.[0] && (
          <Image src={product.images[0]} alt="" fill sizes="72px" className="object-cover" />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/pattern/${product.slug}`}
          onClick={onNavigate}
          className="text-[15px] font-semibold text-ink leading-snug line-clamp-2 hover:text-primary md:text-[14px]"
        >
          {product.title}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {product.skill_level && <LevelBadge level={product.skill_level} />}
          <span className="text-[13px] text-muted md:text-[12px]">PDF · instant download</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${product.title} from cart`}
            className="-ml-1 inline-flex min-h-11 items-center px-1 text-[14px] text-muted underline underline-offset-2 hover:text-ink md:text-[13px]"
          >
            Remove
          </button>
          <p className="flex items-baseline gap-2">
            {onSale && product.compare_at_price != null && (
              <span className="text-[15px] font-medium text-sale line-through md:text-[14px]">
                <span className="sr-only">Was </span>${product.compare_at_price.toFixed(2)}
              </span>
            )}
            <span className={`text-[18px] font-bold md:text-[16px] ${onSale ? 'text-deal' : 'text-primary'}`}>
              {onSale && <span className="sr-only">Now </span>}
              {product.price === 0 ? 'Free' : `$${product.price.toFixed(2)}`}
            </span>
          </p>
        </div>
      </div>
    </li>
  )
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8h12l-1 12H7L6 8z"
        stroke="var(--color-primary)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
