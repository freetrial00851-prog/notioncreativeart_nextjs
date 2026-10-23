import { buildMetadata } from '@/lib/seo'
import { getCheckoutProvider } from '@/lib/data/checkout'
import { Privacy } from '@/views/Privacy'

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'Privacy policy for Notion Creative Art — how we handle your data when you shop for crochet patterns.',
  path: '/privacy',
})

/** Re-read the payment provider setting every minute so the wording follows Admin → Payments. */
export const revalidate = 60

export default async function PrivacyPage() {
  return <Privacy provider={await getCheckoutProvider()} />
}
