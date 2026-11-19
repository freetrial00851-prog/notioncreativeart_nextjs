import type { Metadata } from 'next'
import { CategoryShopPage, categoryMetadata } from '@/components/listing/CategoryShopPage'
import { getAllCategories } from '@/lib/data/products'

type Props = { params: Promise<{ categorySlug: string }> }

/** Category pages are prerendered and cached; filter and ?page= variants go through /q/shop/[categorySlug] (see src/middleware.ts). */
export const dynamic = 'force-static'
export const revalidate = 300

export async function generateStaticParams() {
  const cats = await getAllCategories()
  return [...cats.map((c) => c.slug), 'new', 'sale', 'bestsellers'].map((categorySlug) => ({ categorySlug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params
  return categoryMetadata(categorySlug, {})
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params
  return <CategoryShopPage categorySlug={categorySlug} sp={{}} />
}
