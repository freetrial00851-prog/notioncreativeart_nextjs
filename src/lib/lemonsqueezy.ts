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

const LEMON_STORE_SLUG = process.env.NEXT_PUBLIC_LEMON_STORE_SLUG as string | undefined

/**
 * Builds a Lemon Squeezy checkout URL for a single variant.
 * No server call needed for a basic checkout — Lemon Squeezy's overlay.js
 * script (loaded once in index.html) intercepts links to *.lemonsqueezy.com/checkout/*
 * and opens them as an in-page overlay instead of a redirect.
 *
 * We pass user_id + product_id as custom checkout data so the webhook
 * (Supabase Edge Function) can match the completed order back to our DB
 * without needing its own createCheckout() API call.
 *
 * `embed` controls the resulting page's own layout, independent of how we
 * choose to open it: embed=1 forces Lemon Squeezy's narrow single-column
 * design (meant for use inside our overlay/iframe); omitting it renders
 * their normal wide, side-by-side hosted checkout page.
 */
export function buildCheckoutUrl(params: {
  variantId: string
  userId: string
  productId: string
  email?: string
  name?: string
  billingCountry?: string | null
  billingState?: string | null
  billingZip?: string | null
  embed?: boolean
}) {
  if (!LEMON_STORE_SLUG) {
    console.error('VITE_LEMON_STORE_SLUG is not set')
    return '#'
  }
  const url = new URL(`https://${LEMON_STORE_SLUG}.lemonsqueezy.com/checkout/buy/${params.variantId}`)
  url.searchParams.set('checkout[custom][user_id]', params.userId)
  url.searchParams.set('checkout[custom][product_id]', params.productId)
  if (params.email) url.searchParams.set('checkout[email]', params.email)
  if (params.name) url.searchParams.set('checkout[name]', params.name)
  if (params.billingCountry) url.searchParams.set('checkout[billing_address][country]', params.billingCountry)
  if (params.billingState) url.searchParams.set('checkout[billing_address][state]', params.billingState)
  if (params.billingZip) url.searchParams.set('checkout[billing_address][zip]', params.billingZip)
  if (params.embed !== false) url.searchParams.set('embed', '1')
  url.searchParams.set('desc', '0') // hide the long product description on checkout — it's already shown on our product page
  // Send buyers straight to their downloads after paying, on every product —
  // overrides that product's own "Confirmation Modal / Button Link" dashboard
  // setting (which is per-product and easy to forget to set on new listings).
  url.searchParams.set('checkout[redirect_url]', 'https://notioncreativeart.com/order-success')
  return url.toString()
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
    // lemon.js hasn't loaded yet (slow network / blocked) — fall back to a plain redirect
    window.location.href = url
  }
}

/**
 * Single entry point for starting checkout on any product — respects that
 * product's own checkout_mode (set per-listing in the admin panel):
 *   'overlay' → stays on our site, opens as an in-page modal (narrower layout)
 *   'hosted'  → opens Lemon Squeezy's full checkout page in a new tab (wide layout)
 */
export function startCheckout(params: {
  variantId: string
  userId: string
  productId: string
  email?: string
  name?: string
  billingCountry?: string | null
  billingState?: string | null
  billingZip?: string | null
  checkoutMode: 'overlay' | 'hosted'
}) {
  const isHosted = params.checkoutMode === 'hosted'
  const url = buildCheckoutUrl({ ...params, embed: !isHosted })
  if (isHosted) {
    window.open(url, '_blank', 'noopener')
  } else {
    openCheckout(url)
  }
}
