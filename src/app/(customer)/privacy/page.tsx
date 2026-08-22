import { buildMetadata } from '@/lib/seo'
import { Privacy } from '@/views/Privacy'

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'Privacy policy for Notion Creative Art — how we handle your data when you shop for crochet patterns.',
  path: '/privacy',
})

export default function PrivacyPage() {
  return <Privacy />
}
