import { buildMetadata } from '@/lib/seo'
import { Cart } from '@/views/Cart'

export const metadata = buildMetadata({
  title: 'Cart',
  description: 'Review your crochet pattern cart before checkout.',
  path: '/cart',
  noIndex: true,
})

export default function CartPage() {
  return <Cart />
}
