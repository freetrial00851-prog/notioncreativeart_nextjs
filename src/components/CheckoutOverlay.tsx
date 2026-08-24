'use client'

import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'

const COPY = {
  checkout: {
    label: 'Preparing checkout',
    title: 'Preparing your order…',
    subtitle: 'Redirecting to checkout',
  },
  download: {
    label: 'Preparing download',
    title: 'Preparing your download…',
    subtitle: 'Your free pattern is almost ready',
  },
} as const

/**
 * Full-screen blur + spinner for cart checkout, Buy Now, and free downloads.
 * Cart uses CartContext.checkingOut; Buy Now / Download Free use UIContext.busyOverlay.
 */
export function CheckoutOverlay() {
  const { checkingOut } = useCart()
  const { busyOverlay } = useUI()

  const kind = checkingOut ? 'checkout' : busyOverlay
  const active = kind !== null
  useBodyScrollLock(active)

  if (!kind) return null

  const copy = COPY[kind]

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="assertive"
      aria-label={copy.label}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <div
          className="h-10 w-10 rounded-full border-[3px] border-white/25 border-t-[var(--color-accent)] animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        <div>
          <p className="text-[15px] font-semibold text-white tracking-wide">{copy.title}</p>
          <p className="text-[13px] text-white/75 mt-1">{copy.subtitle}</p>
        </div>
      </div>
    </div>
  )
}
