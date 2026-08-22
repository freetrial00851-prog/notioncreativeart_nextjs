import { buildMetadata } from '@/lib/seo'
import { Account } from '@/views/Account'

export const metadata = buildMetadata({
  title: 'My Orders',
  description: 'View your crochet pattern order history.',
  path: '/account/orders',
  noIndex: true,
})

export default function AccountOrdersPage() {
  return <Account />
}
