import { buildMetadata } from '@/lib/seo'
import { Account } from '@/views/Account'

export const metadata = buildMetadata({
  title: 'Addresses',
  description: 'Manage your billing address.',
  path: '/account/addresses',
  noIndex: true,
})

export default function AccountAddressesPage() {
  return <Account />
}
