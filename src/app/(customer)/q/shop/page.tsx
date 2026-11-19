import type { Metadata } from 'next'
import { ShopIndexPage, shopIndexMetadata } from '@/components/listing/ShopIndexPage'
import { requireListingRewrite } from '@/components/listing/requireListingRewrite'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  await requireListingRewrite()
  return shopIndexMetadata(await searchParams)
}

export default async function ShopQueryPage({ searchParams }: Props) {
  await requireListingRewrite()
  return <ShopIndexPage sp={await searchParams} />
}
