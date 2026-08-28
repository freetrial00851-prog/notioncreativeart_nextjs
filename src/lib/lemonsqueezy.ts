declare global {
  interface Window {
    createLemonSqueezy?: () => void
    LemonSqueezy?: {
      Url: { Open: (url: string) => void; Close: () => void }
      Refresh: () => void
      Setup: (config: { eventHandler?: (event: { event: string; data?: unknown }) => void }) => void
    }
  }
}

import { supabase } from './supabase'

const FALLBACK_CHECKOUT_ERROR = "Couldn't start checkout — please try again in a moment."

export type ApiCheckoutCustomer = {
  /** Deprecated — server derives user id from the session JWT. */
  userId?: string
  email?: string | null
  name?: string
  billingCountry?: string | null
  billingState?: string | null
  billingZip?: string | null
}

/**
 * Opens a checkout URL as a real Lemon Squeezy overlay (a proper modal over
 * the current page). Navigating to the URL directly (window.location.href)
 * does NOT trigger the overlay — LemonSqueezy.Url.Open() is the correct way.
 */
export function openCheckout(url: string) {
  if (window.LemonSqueezy) {
    window.LemonSqueezy.Url.Open(url)
  } else {
    window.location.href = url
  }
}

async function readFunctionError(
  fnError: unknown,
  data: { error?: string } | null,
): Promise<string> {
  try {
    const context = (fnError as { context?: Response })?.context
    if (context && typeof context.json === 'function') {
      const body = await context.json()
      if (body?.error) return body.error
    } else if (data?.error) {
      return data.error
    }
  } catch {
    /* keep generic */
  }
  return FALLBACK_CHECKOUT_ERROR
}

/**
 * Creates a Lemon Squeezy checkout via the Checkouts API (create-cart-checkout)
 * so product_options.redirect_url is actually applied. Shareable buy-link query
 * params like checkout[redirect_url] are ignored by Lemon.
 */
export async function startApiCheckout(
  productIds: string[],
  customer: ApiCheckoutCustomer,
  options?: { onRedirecting?: () => void },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error: fnError } = await supabase.functions.invoke('create-cart-checkout', {
    body: {
      productIds,
      email: customer.email,
      name: customer.name,
      billingCountry: customer.billingCountry,
      billingState: customer.billingState,
      billingZip: customer.billingZip,
    },
  })

  if (fnError || !data?.url) {
    const error = await readFunctionError(fnError, data)
    console.error('Checkout creation failed:', fnError, data)
    return { ok: false, error }
  }

  if (data.hosted) {
    options?.onRedirecting?.()
    window.open(data.url, '_blank', 'noopener')
  } else {
    options?.onRedirecting?.()
    openCheckout(data.url)
  }
  return { ok: true }
}
