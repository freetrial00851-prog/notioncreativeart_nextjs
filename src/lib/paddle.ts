/**
 * Paddle (merchant of record) — inline checkout helpers.
 *
 * Flow: the server (create-paddle-checkout) creates the transaction and decides the prices; the browser only
 * opens it inline on /checkout. Access to files is granted by the signed paddle-webhook, never by this code.
 */
import { supabase } from './supabase'

export type PaddleEnvironment = 'sandbox' | 'live'

export const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? ''
export const PADDLE_ENVIRONMENT: PaddleEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENV === 'live' ? 'live' : 'sandbox'

const PADDLE_SCRIPT = 'https://cdn.paddle.com/paddle/v2/paddle.js'

export type PaddleEvent = { name?: string; data?: Record<string, unknown> }
type Listener = (event: PaddleEvent) => void

const listeners = new Set<Listener>()
let loadPromise: Promise<boolean> | null = null

export function paddleConfigured() {
  return PADDLE_CLIENT_TOKEN.length > 0
}

/** Loads Paddle.js once and initialises it once (Paddle only allows one Initialize per page). */
export function loadPaddle(onEvent?: Listener): Promise<boolean> {
  if (onEvent) listeners.add(onEvent)
  if (!paddleConfigured() || typeof window === 'undefined') return Promise.resolve(false)
  if (loadPromise) return loadPromise

  loadPromise = new Promise<boolean>((resolve) => {
    const init = () => {
      try {
        if (!window.Paddle) return resolve(false)
        if (PADDLE_ENVIRONMENT === 'sandbox') window.Paddle.Environment.set('sandbox')
        window.Paddle.Initialize({
          token: PADDLE_CLIENT_TOKEN,
          eventCallback: (event: PaddleEvent) => listeners.forEach((fn) => fn(event)),
        })
        resolve(true)
      } catch (err) {
        console.error('Paddle failed to initialise', err)
        resolve(false)
      }
    }
    if (window.Paddle) return init()
    const script = document.createElement('script')
    script.src = PADDLE_SCRIPT
    script.async = true
    script.onload = init
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
  // Allow a retry if loading failed (for example an ad blocker was switched off).
  void loadPromise.then((ok) => { if (!ok) loadPromise = null })
  return loadPromise
}

export function removePaddleListener(fn: Listener) {
  listeners.delete(fn)
}

export type CheckoutProvider = 'lemonsqueezy' | 'paddle'

let defaultProviderCache: { value: CheckoutProvider; at: number } | null = null

/**
 * Site-wide default payment provider (Admin → Payments). Products with their own provider setting ignore it.
 * Cached briefly; any failure means Lemon Squeezy (the safe, current behaviour).
 */
export async function getDefaultCheckoutProvider(): Promise<CheckoutProvider> {
  if (defaultProviderCache && Date.now() - defaultProviderCache.at < 60_000) return defaultProviderCache.value
  let value: CheckoutProvider = 'lemonsqueezy'
  try {
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'checkout').maybeSingle()
    if ((data?.value as { default_provider?: string } | null)?.default_provider === 'paddle') value = 'paddle'
  } catch {
    /* keep Lemon Squeezy */
  }
  defaultProviderCache = { value, at: Date.now() }
  return value
}

/** Forget the cached default (after the admin changes it). */
export function resetDefaultCheckoutProvider() {
  defaultProviderCache = null
}

type ProviderRow = { id: string; checkout_provider: string | null }

/** True only when every product in the cart is sold through Paddle (mixed carts use Lemon Squeezy). */
export async function allProductsUsePaddle(productIds: string[]): Promise<boolean> {
  if (!paddleConfigured() || productIds.length === 0) return false
  const [{ data, error }, fallback] = await Promise.all([
    supabase.from('products').select('id, checkout_provider').in('id', productIds),
    getDefaultCheckoutProvider(),
  ])
  if (error || !data) return false
  const rows = data as ProviderRow[]
  return rows.length === new Set(productIds).size && rows.every((r) => (r.checkout_provider ?? fallback) === 'paddle')
}

export type PaddleStart = { ok: true } | { ok: false; error: string; fallback: boolean }

/** Asks the server to create the transaction, then opens the inline checkout page. */
export async function startPaddleCheckout(productIds: string[]): Promise<PaddleStart> {
  const { data, error } = await supabase.functions.invoke('create-paddle-checkout', { body: { productIds } })

  let code: string | undefined = data?.code
  let message: string | undefined = data?.error
  if (error) {
    try {
      const body = await (error as { context?: Response }).context?.json()
      code = body?.code ?? code
      message = body?.error ?? message
    } catch {
      /* keep generic */
    }
  }
  if (error || !data?.transactionId) {
    return {
      ok: false,
      fallback: code === 'paddle_unavailable',
      error: message || "Couldn't start checkout — please try again in a moment.",
    }
  }
  // Full page load on purpose: Paddle.js is initialised once per page load. The product ids let the checkout page
  // show our own product card (photo, name, price) above Paddle's form.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `/checkout?txn=${encodeURIComponent(data.transactionId)}&items=${encodeURIComponent(productIds.join(','))}`
  return { ok: true }
}
