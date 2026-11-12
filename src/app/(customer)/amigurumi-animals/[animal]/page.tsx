import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { ProductHub } from '@/components/ProductHub'
import { ANIMAL_SLUGS, getAnimalHub } from '@/content/pages/animals'

type Props = { params: Promise<{ animal: string }> }

/** New patterns reach these pages within five minutes without a deploy. */
export const revalidate = 300
export const dynamicParams = false

export function generateStaticParams() {
  return ANIMAL_SLUGS.map((animal) => ({ animal }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { animal } = await params
  const hub = getAnimalHub(animal)
  if (!hub) return {}
  return buildMetadata({ title: hub.title, description: hub.description, path: hub.path })
}

export default async function AnimalPage({ params }: Props) {
  const { animal } = await params
  const hub = getAnimalHub(animal)
  if (!hub) notFound()
  return <ProductHub hub={hub} />
}
