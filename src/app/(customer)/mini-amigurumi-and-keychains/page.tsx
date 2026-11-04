import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { ProductHub } from '@/components/ProductHub'
import { MINI_HUB } from '@/content/pages/hubs'

export const metadata: Metadata = buildMetadata({ title: MINI_HUB.title, description: MINI_HUB.description, path: MINI_HUB.path })

/** New patterns reach the hub within five minutes without a deploy. */
export const revalidate = 300

export default function MiniAmigurumiPage() {
  return <ProductHub hub={MINI_HUB} />
}
