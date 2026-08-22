import { buildMetadata } from '@/lib/seo'
import { Account } from '@/views/Account'

export const metadata = buildMetadata({
  title: 'Newsletter',
  description: 'Manage your newsletter preferences.',
  path: '/account/newsletter',
  noIndex: true,
})

export default function AccountNewsletterPage() {
  return <Account />
}
