import { buildMetadata } from '@/lib/seo'
import { isVercelProduction } from '@/lib/env'
import { Contact } from '@/views/Contact'

export const metadata = buildMetadata({
  title: 'Contact Us for Pattern Help',
  description: 'Contact Notion Creative Art for crochet pattern help, order issues, or general questions. We respond within 1–2 days.',
  path: '/contact',
})

export default function ContactPage() {
  return <Contact hideOwnerCopyPlaceholders={isVercelProduction()} />
}
