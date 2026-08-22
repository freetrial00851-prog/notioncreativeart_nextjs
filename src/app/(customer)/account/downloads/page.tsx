import { buildMetadata } from '@/lib/seo'
import { Account } from '@/views/Account'

export const metadata = buildMetadata({
  title: 'Downloads',
  description: 'Download your purchased crochet patterns.',
  path: '/account/downloads',
  noIndex: true,
})

export default function AccountDownloadsPage() {
  return <Account />
}
