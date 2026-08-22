import { buildMetadata } from '@/lib/seo'
import { OrderSuccess } from '@/views/OrderSuccess'

export const metadata = buildMetadata({
  title: 'Order Successful',
  description: 'Your crochet pattern order was successful. Download your patterns from your account.',
  path: '/order-success',
  noIndex: true,
})

export default function OrderSuccessPage() {
  return <OrderSuccess />
}
