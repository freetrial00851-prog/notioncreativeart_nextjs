import { buildMetadata } from '@/lib/seo'
import { OrderDetail } from '@/views/OrderDetail'

type Props = { params: Promise<{ orderId: string }> }

export async function generateMetadata({ params }: Props) {
  const { orderId } = await params
  return buildMetadata({
    title: `Order ${orderId}`,
    description: 'View your order details and download your crochet patterns.',
    path: `/account/orders/${orderId}`,
    noIndex: true,
  })
}

export default function OrderDetailPage() {
  return <OrderDetail />
}
