import { buildMetadata, SEO_KEYWORDS } from '@/lib/seo'
import { Faq } from '@/views/Faq'

export const metadata = buildMetadata({
  title: 'FAQ',
  description:
    'Frequently asked questions about Notion Creative Art crochet patterns — instant PDF downloads, refunds, account access, and pattern help.',
  path: '/faq',
  keywords: [...SEO_KEYWORDS, 'crochet pattern FAQ', 'digital pattern download help'],
})

export default function FaqPage() {
  return <Faq />
}
