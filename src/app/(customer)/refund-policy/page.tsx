import { buildMetadata } from '@/lib/seo'
import { getCheckoutProvider } from '@/lib/data/checkout'
import { RefundPolicy } from '@/views/RefundPolicy'

export const metadata = buildMetadata({
  title: 'Refund Policy',
  description: 'Refund policy for Notion Creative Art digital crochet pattern downloads.',
  path: '/refund-policy',
})

/** Re-read the payment provider setting every minute so the wording follows Admin → Payments. */
export const revalidate = 60

export default async function RefundPolicyPage() {
  return <RefundPolicy provider={await getCheckoutProvider()} />
}
