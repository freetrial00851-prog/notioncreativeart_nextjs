import { buildMetadata } from '@/lib/seo'
import { RefundPolicy } from '@/views/RefundPolicy'

export const metadata = buildMetadata({
  title: 'Refund Policy',
  description: 'Refund policy for Notion Creative Art digital crochet pattern downloads.',
  path: '/refund-policy',
})

export default function RefundPolicyPage() {
  return <RefundPolicy />
}
