'use server'

import { revalidatePath } from 'next/cache'

/**
 * Bust ISR caches for public storefront surfaces after an admin product mutation.
 * Call after create / update / publish / trash / restore so visitors see changes
 * without waiting for the 60s revalidate window.
 */
export async function revalidateStorefront(productSlug?: string | null) {
  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/shop', 'layout')

  if (productSlug) {
    revalidatePath(`/pattern/${productSlug}`)
  } else {
    // Bulk / unknown slug — invalidate the dynamic product page segment.
    revalidatePath('/pattern/[slug]', 'page')
  }
}
