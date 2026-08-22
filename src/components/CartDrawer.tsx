'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { deriveVariantUrl } from '../lib/imageVariants'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { MaterialIcon } from './MaterialIcon'

export function CartDrawer() {
  const { items, count, drawerOpen, closeDrawer, justAdded, removeFromCart, checkingOut, checkoutError, checkout } = useCart()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  useBodyScrollLock(drawerOpen)

  // ESC to close + move focus to the drawer's close button when it opens (basic focus management)
  useEffect(() => {
    if (!drawerOpen) return
    closeButtonRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeDrawer()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen, closeDrawer])

  const total = items.reduce((sum, i) => sum + (i.product?.price ?? 0), 0)

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        className={`fixed inset-0 z-50 bg-ink/30 transition-opacity duration-200 motion-reduce:transition-none ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer — right-side panel on desktop, bottom sheet on mobile */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        aria-hidden={!drawerOpen}
        inert={drawerOpen ? undefined : true}
        className={`fixed z-50 bg-canvas flex flex-col shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
          md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:max-h-none md:h-full md:w-[420px] md:rounded-none
          ${drawerOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full invisible'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-line shrink-0">
          <div>
            <h2 className="font-subheading font-semibold text-lg">Your Cart</h2>
            <p className="text-[11px] text-ink-soft mt-0.5">{count} {count === 1 ? 'item' : 'items'}</p>
          </div>
          <button ref={closeButtonRef} onClick={closeDrawer} aria-label="Close cart" className="w-8 h-8 flex items-center justify-center text-ink hover:opacity-60 text-lg">
            ✕
          </button>
        </div>

        {justAdded && (
          <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 animate-[fadeIn_0.3s_ease-out]" style={{ background: '#E8F0E5' }}>
            <CheckIcon />
            <span className="text-[13px] font-medium" style={{ color: 'var(--color-sale-green)' }}>Added to cart</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <YarnBasketIcon />
            <p className="font-subheading text-lg mb-2 mt-4">Your cart is empty</p>
            <p className="text-[13px] text-ink-soft mb-6">Discover beautiful crochet patterns and find your next project.</p>
            <Link
              href="/shop"
              onClick={closeDrawer}
              className="px-6 py-3 rounded-lg text-white text-[13px] font-semibold"
              style={{ background: 'var(--color-cart-blue)' }}
            >
              Browse Patterns
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y divide-line px-6">
              {items.map((item) => (
                <div key={item.product_id} className="flex gap-4 py-5">
                  <Link
                    href={item.product ? `/pattern/${item.product.slug}` : '#'}
                    onClick={closeDrawer}
                    className="w-16 h-16 shrink-0 bg-surface rounded-lg overflow-hidden"
                  >
                    {item.product?.images?.[0] && (
                      <img src={deriveVariantUrl(item.product.images[0], 'micro')} alt={item.product.title} className="w-full h-full object-cover" />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="font-subheading text-[14px] font-medium leading-tight truncate">{item.product?.title}</p>
                    <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--color-sale-green)' }}>Digital PDF Pattern</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[13px] font-medium">
                        {item.product?.price === 0 ? 'Free' : `$${item.product?.price.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    aria-label="Remove item"
                    className="shrink-0 self-start text-ink-soft hover:text-madder transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-line px-6 py-5 shrink-0 space-y-4 mt-4">
              <div className="flex items-center justify-between text-[14px]">
                <span>Subtotal</span>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>

              {checkoutError && <p className="text-madder text-[12px]">{checkoutError}</p>}

              <div className="space-y-2.5">
                <button
                  onClick={checkout}
                  disabled={checkingOut}
                  className="w-full py-3.5 text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--color-cart-blue)' }}
                >
                  {checkingOut ? 'Preparing…' : `Checkout — $${total.toFixed(2)}`}
                </button>
                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="block text-center w-full py-3.5 border rounded-lg hover:bg-surface transition-colors text-[13px] font-semibold"
                  style={{ borderColor: 'var(--color-cart-blue)', color: 'var(--color-cart-blue)' }}
                >
                  View Cart
                </Link>
                <button onClick={closeDrawer} className="flex items-center justify-center gap-1 w-full text-center text-[12px] font-medium py-1" style={{ color: 'var(--color-cart-blue)' }}>
                  Continue Shopping <ArrowIcon />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function CheckIcon() {
  return <MaterialIcon name="check_circle" size={16} color="var(--color-sale-green)" />
}
function TrashIcon() {
  return <MaterialIcon name="delete" size={16} />
}
function ArrowIcon() {
  return <MaterialIcon name="chevron_right" size={12} />
}
// Decorative illustration, not a semantic UI icon — no Lucide equivalent, stays custom.
function YarnBasketIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 96 96" fill="none">
      <path d="M20 44h56l-6 34a4 4 0 0 1-4 3.4H30a4 4 0 0 1-4-3.4L20 44z" stroke="var(--color-ink-soft)" strokeWidth="2" fill="#F0EDE4" />
      <path d="M14 44h68" stroke="var(--color-ink-soft)" strokeWidth="2" />
      <circle cx="36" cy="30" r="12" fill="#E8F0E5" stroke="var(--color-sale-green)" strokeWidth="2" />
      <circle cx="58" cy="24" r="9" fill="#E5EDFF" stroke="var(--color-cart-blue)" strokeWidth="2" />
      <path d="M36 22c4 2 6 5 6 8s-2 6-6 8" stroke="var(--color-sale-green)" strokeWidth="1.4" fill="none" />
      <path d="M58 18c3 1.5 4.5 3.8 4.5 6s-1.5 4.5-4.5 6" stroke="var(--color-cart-blue)" strokeWidth="1.2" fill="none" />
    </svg>
  )
}
