'use client'

import { useEffect, useState } from 'react'
import { getDefaultCheckoutProvider, paddleConfigured, type CheckoutProvider } from './paddle'
import { useSiteCheckoutProvider } from './CheckoutProviderContext'

/**
 * Which provider will take the payment for a product (its own setting, else the site default) — for the
 * "Secure checkout by …" wording. Starts as Lemon Squeezy so the server-rendered text never claims Paddle early.
 */
export function useCheckoutProvider(own?: CheckoutProvider | null): { provider: CheckoutProvider; name: string } {
  // Starts from the server-rendered site default (root layout), then re-checks it in the browser.
  const [fallback, setFallback] = useState<CheckoutProvider>(useSiteCheckoutProvider())
  useEffect(() => {
    let alive = true
    void getDefaultCheckoutProvider().then((p) => { if (alive) setFallback(p) })
    return () => { alive = false }
  }, [])
  const chosen = own ?? fallback
  const provider: CheckoutProvider = chosen === 'paddle' && paddleConfigured() ? 'paddle' : 'lemonsqueezy'
  return { provider, name: provider === 'paddle' ? 'Paddle' : 'Lemon Squeezy' }
}
