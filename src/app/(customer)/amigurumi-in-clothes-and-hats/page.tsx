import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { ProductHub } from '@/components/ProductHub'
import { DRESSED_HUB } from '@/content/pages/hubs'

export const metadata: Metadata = buildMetadata({ title: DRESSED_HUB.title, description: DRESSED_HUB.description, path: DRESSED_HUB.path })

/** New patterns reach the hub within five minutes without a deploy. */
export const revalidate = 300

export default function DressedAmigurumiPage() {
  return <ProductHub hub={DRESSED_HUB} />
}
