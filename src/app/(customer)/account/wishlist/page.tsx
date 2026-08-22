import { buildMetadata } from '@/lib/seo'
import { Account } from '@/views/Account'

export const metadata = buildMetadata({
  title: 'Wishlist',
  description: 'Your saved crochet patterns.',
  path: '/account/wishlist',
  noIndex: true,
})

export default function AccountWishlistPage() {
  return <Account />
}
