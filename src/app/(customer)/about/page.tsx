import { buildMetadata } from '@/lib/seo'
import { About } from '@/views/About'

export const metadata = buildMetadata({
  title: 'About',
  description:
    'About Notion Creative Art — a small crochet pattern studio writing and testing amigurumi, wearables, and home decor designs. Every pattern tested twice before listing.',
  path: '/about',
})

export default function AboutPage() {
  return <About />
}
