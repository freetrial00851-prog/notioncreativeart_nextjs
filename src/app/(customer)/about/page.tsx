import { buildMetadata } from '@/lib/seo'
import { About } from '@/views/About'

export const metadata = buildMetadata({
  title: 'About Our Crochet Pattern Studio',
  description:
    'About Notion Creative Art — a small, one-person crochet pattern studio designing amigurumi, wearables and home decor PDF patterns.',
  path: '/about',
})

export default function AboutPage() {
  return <About />
}
