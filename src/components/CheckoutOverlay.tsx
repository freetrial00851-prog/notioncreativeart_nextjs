'use client'

import { useCart } from '../context/CartContext'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'

/** Full-screen blur + spinner while create-cart-checkout runs. */
export function CheckoutOverlay() {
  const { checkingOut } = useCart()
  useBodyScrollLock(checkingOut)

  if (!checkingOut) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="assertive"
      aria-label="Preparing checkout"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <div
          className="h-10 w-10 rounded-full border-[3px] border-white/25 border-t-[var(--color-accent)] animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        <div>
          <p className="text-[15px] font-semibold text-white tracking-wide">Preparing your order…</p>
          <p className="text-[13px] text-white/75 mt-1">Redirecting to checkout</p>
        </div>
      </div>
    </div>
  )
}
