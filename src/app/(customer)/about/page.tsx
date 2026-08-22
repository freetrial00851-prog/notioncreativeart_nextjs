import { buildMetadata, SEO_KEYWORDS } from '@/lib/seo'
import { About } from '@/views/About'

export const metadata = buildMetadata({
  title: 'About',
  description:
    'About Notion Creative Art — a small crochet pattern studio writing and testing amigurumi, wearables, and home decor designs. Every pattern tested twice before listing.',
  path: '/about',
  keywords: [...SEO_KEYWORDS, 'about Notion Creative Art', 'crochet pattern designer'],
})

export default function AboutPage() {
  return <About />
}
