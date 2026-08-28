'use client'

import { useUI } from '../context/UIContext'
import { CheckoutLoadingOverlay } from './CheckoutLoadingOverlay'

/** Branded step-by-step overlay for cart checkout, Buy Now, and free downloads. */
export function CheckoutOverlay() {
  const { loadingOverlay } = useUI()
  return <CheckoutLoadingOverlay overlay={loadingOverlay} />
}
