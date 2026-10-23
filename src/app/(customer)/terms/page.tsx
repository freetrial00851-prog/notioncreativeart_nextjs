import { buildMetadata } from '@/lib/seo'
import { getCheckoutProvider } from '@/lib/data/checkout'
import { Terms } from '@/views/Terms'

export const metadata = buildMetadata({
  title: 'Terms of Service',
  description: 'Terms of service for Notion Creative Art crochet pattern shop.',
  path: '/terms',
})

/** Re-read the payment provider setting every minute so the wording follows Admin → Payments. */
export const revalidate = 60

export default async function TermsPage() {
  return <Terms provider={await getCheckoutProvider()} />
}
