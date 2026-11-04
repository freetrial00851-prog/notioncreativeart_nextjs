import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { ProductHub } from '@/components/ProductHub'
import { ANIMALS_HUB } from '@/content/pages/hubs'

export const metadata: Metadata = buildMetadata({ title: ANIMALS_HUB.title, description: ANIMALS_HUB.description, path: ANIMALS_HUB.path })

/** New patterns reach the hub within five minutes without a deploy. */
export const revalidate = 300

export default function AmigurumiAnimalsPage() {
  return <ProductHub hub={ANIMALS_HUB} />
}
