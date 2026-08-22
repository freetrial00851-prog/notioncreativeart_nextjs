import { buildMetadata } from '@/lib/seo'
import { Account } from '@/views/Account'

export const metadata = buildMetadata({
  title: 'Account Settings',
  description: 'Update your Notion Creative Art account profile and billing details.',
  path: '/account/profile',
  noIndex: true,
})

export default function AccountProfilePage() {
  return <Account />
}
