import { buildMetadata } from '@/lib/seo'
import { isVercelProduction } from '@/lib/env'
import { Account } from '@/views/Account'

export const metadata = buildMetadata({
  title: 'Downloads',
  description: 'Download your purchased crochet patterns.',
  path: '/account/downloads',
  noIndex: true,
})

export default function AccountDownloadsPage() {
  return <Account hideOwnerCopyPlaceholders={isVercelProduction()} />
}
