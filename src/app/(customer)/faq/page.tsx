import { buildMetadata } from '@/lib/seo'
import { Faq } from '@/views/Faq'

export const metadata = buildMetadata({
  title: 'FAQ',
  description:
    'Frequently asked questions about Notion Creative Art crochet patterns — instant PDF downloads, refunds, account access, and pattern help.',
  path: '/faq',
})

export default function FaqPage() {
  return <Faq />
}
