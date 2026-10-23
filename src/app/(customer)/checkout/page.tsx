import { Suspense } from 'react'
import { buildMetadata } from '@/lib/seo'
import { PaddleCheckout } from '@/views/PaddleCheckout'

export const metadata = buildMetadata({
  title: 'Checkout',
  description: 'Secure checkout for your crochet pattern.',
  path: '/checkout',
  noIndex: true,
})

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-5 py-14 text-[14px] text-muted">Loading checkout…</div>}>
      <PaddleCheckout />
    </Suspense>
  )
}
