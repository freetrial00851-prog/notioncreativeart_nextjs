import { createStaticClient } from '@/lib/supabase/static'

export type CheckoutProviderName = 'lemonsqueezy' | 'paddle'

/**
 * Which payment provider the shop uses by default (Admin → Payments), read on the server so the legal pages
 * name the right merchant of record in the HTML itself. Any failure means Lemon Squeezy, the safe default.
 */
export async function getCheckoutProvider(): Promise<CheckoutProviderName> {
  try {
    const { data } = await createStaticClient().from('site_settings').select('value').eq('key', 'checkout').maybeSingle()
    return (data?.value as { default_provider?: string } | null)?.default_provider === 'paddle' ? 'paddle' : 'lemonsqueezy'
  } catch {
    return 'lemonsqueezy'
  }
}
