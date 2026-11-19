import type { Metadata } from 'next'
import { FreePatternsPage, freeMetadata } from '@/components/listing/FreePatternsPage'
import { requireListingRewrite } from '@/components/listing/requireListingRewrite'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  await requireListingRewrite()
  return freeMetadata(await searchParams)
}

export default async function FreeQueryPage({ searchParams }: Props) {
  await requireListingRewrite()
  return <FreePatternsPage sp={await searchParams} />
}
