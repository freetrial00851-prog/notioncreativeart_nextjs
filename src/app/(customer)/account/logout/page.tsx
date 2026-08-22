import { buildMetadata } from '@/lib/seo'
import { Account } from '@/views/Account'

export const metadata = buildMetadata({
  title: 'Log Out',
  description: 'Sign out of your Notion Creative Art account.',
  path: '/account/logout',
  noIndex: true,
})

export default function AccountLogoutPage() {
  return <Account />
}
