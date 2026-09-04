/**
 * Pinterest Tag (pintrk) helpers — consent-gated by callers / Analytics loader.
 * Base script: https://s.pinimg.com/ct/core.js
 */

import { COOKIE_CONSENT_KEY } from '@/components/CookieConsent'

export const PINTEREST_TAG_ID = process.env.NEXT_PUBLIC_PINTEREST_TAG_ID as string | undefined

const PURCHASE_DEDUP_PREFIX = 'nca_pin_purchase_'

declare global {
  interface Window {
    pintrk?: ((...args: unknown[]) => void) & {
      queue?: unknown[]
      version?: string
    }
  }
}

export type PinterestEventPayload = {
  value?: number
  order_quantity?: number
  currency?: string
  product_id?: string
  product_name?: string
  order_id?: string
  line_items?: Array<{ product_id?: string; product_name?: string; product_price?: number }>
}

function hasAnalyticsConsent(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted'
}

let tagLoaded = false

/** Injects core.js once and calls pintrk('load', tagId). Does not fire page. */
export function loadPinterestTag(): boolean {
  if (!PINTEREST_TAG_ID || typeof window === 'undefined') return false
  if (!hasAnalyticsConsent()) return false

  if (!window.pintrk) {
    const pintrk = function (...args: unknown[]) {
      ;(pintrk.queue = pintrk.queue || []).push(args)
    } as NonNullable<Window['pintrk']>
    pintrk.queue = []
    pintrk.version = '3.0'
    window.pintrk = pintrk

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://s.pinimg.com/ct/core.js'
    const first = document.getElementsByTagName('script')[0]
    first?.parentNode?.insertBefore(script, first)
  }

  if (!tagLoaded) {
    window.pintrk('load', PINTEREST_TAG_ID)
    tagLoaded = true
  }
  return true
}

export function trackPinterestPage(): void {
  if (!PINTEREST_TAG_ID || !hasAnalyticsConsent()) return
  if (typeof window.pintrk !== 'function') return
  window.pintrk('page')
}

export function trackPinterestEvent(event: string, payload?: PinterestEventPayload): void {
  if (!PINTEREST_TAG_ID || !hasAnalyticsConsent()) return
  if (typeof window.pintrk !== 'function') {
    // Tag may not be loaded yet (consent just granted mid-session) — load then track
    if (!loadPinterestTag()) return
  }
  if (typeof window.pintrk !== 'function') return
  if (payload) window.pintrk('track', event, payload)
  else window.pintrk('track', event)
}

export function trackPinterestAddToCart(opts: {
  productId: string
  value?: number
  productName?: string
}): void {
  trackPinterestEvent('addtocart', {
    value: opts.value,
    currency: 'USD',
    order_quantity: 1,
    product_id: opts.productId,
    product_name: opts.productName,
    line_items: [
      {
        product_id: opts.productId,
        product_name: opts.productName,
        product_price: opts.value,
      },
    ],
  })
}

export function trackPinterestCheckout(opts: {
  productIds: string[]
  value?: number
}): void {
  trackPinterestEvent('checkout', {
    value: opts.value,
    currency: 'USD',
    order_quantity: opts.productIds.length,
    line_items: opts.productIds.map((product_id) => ({ product_id })),
  })
}

/** Fires purchase once per order id (sessionStorage). Returns whether it fired. */
export function trackPinterestPurchase(opts: {
  orderId: string
  lemonOrderId?: string
  value?: number
}): boolean {
  if (typeof window === 'undefined') return false
  const key = `${PURCHASE_DEDUP_PREFIX}${opts.orderId}`
  if (sessionStorage.getItem(key)) return false
  sessionStorage.setItem(key, '1')
  trackPinterestEvent('purchase', {
    value: opts.value,
    currency: 'USD',
    order_id: opts.lemonOrderId || opts.orderId,
  })
  return true
}
