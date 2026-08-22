import { buildMetadata } from '@/lib/seo'
import { Wishlist } from '@/views/Wishlist'

export const metadata = buildMetadata({
  title: 'Wishlist',
  description: 'Your saved crochet patterns.',
  path: '/wishlist',
  noIndex: true,
})

export default function WishlistPage() {
  return <Wishlist />
}
