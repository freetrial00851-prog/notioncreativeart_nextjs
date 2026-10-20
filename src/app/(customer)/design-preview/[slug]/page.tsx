import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetail } from '@/views/ProductDetail'
import { DesignPreviewGuard } from '@/components/DesignPreviewGuard'
import { DESIGN_PREVIEW_PRODUCTS } from '@/lib/designPreviewData'

/** Hidden design preview: the full product page with a mock listing. Not indexed. */
export const metadata: Metadata = {
  title: 'Design preview',
  robots: { index: false, follow: false, nocache: true },
}

export default async function DesignPreviewPdp({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = DESIGN_PREVIEW_PRODUCTS.find((p) => p.slug === slug)
  if (!product) notFound()
  return (
    <>
      <DesignPreviewGuard />
      <ProductDetail key={product.slug} initialProduct={product} />
    </>
  )
}
