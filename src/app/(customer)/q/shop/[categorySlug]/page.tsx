import type { Metadata } from 'next'
import { CategoryShopPage, categoryMetadata } from '@/components/listing/CategoryShopPage'
import { requireListingRewrite } from '@/components/listing/requireListingRewrite'

type Props = {
  params: Promise<{ categorySlug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  await requireListingRewrite()
  const { categorySlug } = await params
  return categoryMetadata(categorySlug, await searchParams)
}

export default async function CategoryQueryPage({ params, searchParams }: Props) {
  await requireListingRewrite()
  const { categorySlug } = await params
  return <CategoryShopPage categorySlug={categorySlug} sp={await searchParams} />
}
