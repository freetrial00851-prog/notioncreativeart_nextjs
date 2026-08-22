import { buildMetadata } from '@/lib/seo'
import { Account } from '@/views/Account'

export const metadata = buildMetadata({
  title: 'My Account',
  description: 'Manage your Notion Creative Art account, orders, and downloads.',
  path: '/account',
  noIndex: true,
})

/** Account dashboard and sub-pages — tab routing handled inside Account component. */
export default function AccountPage() {
  return <Account />
}
