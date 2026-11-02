import { sendGAEvent } from '@next/third-parties/google'
import { COOKIE_CONSENT_KEY } from '@/components/CookieConsent'

/**
 * GA4 events (ecommerce + a few engagement ones), sent only after the visitor accepted
 * cookies and GA4 has loaded. Names and fields follow Google's recommended events, so
 * the standard ecommerce reports work. Never throws and never blocks the UI.
 */

type Item = { item_id: string; item_name?: string; price?: number; quantity?: number; item_category?: string }
type Params = Record<string, string | number | boolean | Item[] | undefined>

const CURRENCY = 'USD'

function ready(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (localStorage.getItem(COOKIE_CONSENT_KEY) !== 'accepted') return false
    if (window.location.pathname.startsWith('/admin')) return false
    return Array.isArray((window as unknown as { dataLayer?: unknown[] }).dataLayer)
  } catch {
    return false
  }
}

export function ga4Event(name: string, params: Params = {}): void {
  if (!ready()) return
  try {
    sendGAEvent('event', name, params)
  } catch {
    /* analytics must never break the app */
  }
}

type ProductLike = { id: string; title?: string | null; price?: number | string | null }

function toItem(p: ProductLike): Item {
  return {
    item_id: p.id,
    item_name: p.title ?? undefined,
    price: p.price != null ? Number(p.price) : undefined,
    quantity: 1,
  }
}

export const ga4ViewItem = (p: ProductLike) =>
  ga4Event('view_item', { currency: CURRENCY, value: Number(p.price ?? 0), items: [toItem(p)] })

export const ga4AddToCart = (p: ProductLike) =>
  ga4Event('add_to_cart', { currency: CURRENCY, value: Number(p.price ?? 0), items: [toItem(p)] })

export const ga4RemoveFromCart = (p: ProductLike) =>
  ga4Event('remove_from_cart', { currency: CURRENCY, value: Number(p.price ?? 0), items: [toItem(p)] })

export const ga4BeginCheckout = (opts: { value?: number; currency?: string; itemIds?: string[] }) =>
  ga4Event('begin_checkout', {
    currency: opts.currency || CURRENCY,
    ...(opts.value != null ? { value: opts.value } : {}),
    ...(opts.itemIds?.length ? { items: opts.itemIds.map((id) => ({ item_id: id, quantity: 1 })) } : {}),
  })

export const ga4Purchase = (opts: { transactionId: string; value: number; currency?: string; itemIds?: string[] }) =>
  ga4Event('purchase', {
    transaction_id: opts.transactionId,
    currency: opts.currency || CURRENCY,
    value: opts.value,
    ...(opts.itemIds?.length ? { items: opts.itemIds.map((id) => ({ item_id: id, quantity: 1 })) } : {}),
  })

export const ga4Search = (term: string) => ga4Event('search', { search_term: term.slice(0, 64) })
export const ga4SignUp = () => ga4Event('sign_up', { method: 'email' })
export const ga4Login = () => ga4Event('login', { method: 'email' })
export const ga4FreeDownload = (productId: string) => ga4Event('free_download', { item_id: productId })
export const ga4Newsletter = () => ga4Event('newsletter_subscribe')
