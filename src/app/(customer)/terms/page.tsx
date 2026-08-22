import { buildMetadata } from '@/lib/seo'
import { Terms } from '@/views/Terms'

export const metadata = buildMetadata({
  title: 'Terms of Service',
  description: 'Terms of service for Notion Creative Art crochet pattern shop.',
  path: '/terms',
})

export default function TermsPage() {
  return <Terms />
}
