import { buildMetadata } from '@/lib/seo'
import { Contact } from '@/views/Contact'

export const metadata = buildMetadata({
  title: 'Contact',
  description: 'Contact Notion Creative Art for crochet pattern help, order issues, or general questions. We respond within 24 hours.',
  path: '/contact',
})

export default function ContactPage() {
  return <Contact />
}
