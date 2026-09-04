import type { Metadata } from 'next'
import { buildBreadcrumbListJsonLd, buildMetadata, buildProductJsonLd } from '@/lib/seo'
import { getCategoryById, getProductBySlug } from '@/lib/data/products'
import { getApprovedReviews, getProductReviewStats } from '@/lib/data/reviews'
import { deriveVariantUrl } from '@/lib/imageVariants'
import { getSiteSeoContext } from '@/lib/seoSettings'
import { ProductDetail } from '@/views/ProductDetail'

type Props = { params: Promise<{ slug: string }> }

/** Allow product pages added after the last deploy (not only build-time slugs). */
export const dynamicParams = true

/** Revalidate product pages so newly listed patterns appear without a full redeploy. */
export const revalidate = 60

/** Server-rendered product metadata — indexable without JavaScript execution. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) {
    return buildMetadata({
      title: 'Pattern Not Found',
      description: 'This crochet pattern could not be found.',
      path: `/pattern/${slug}`,
      noIndex: true,
    })
  }

  const description =
    product.meta_description?.trim() ||
    product.subtitle?.trim() ||
    (product.description ? product.description.slice(0, 155) : '') ||
    'A crochet PDF pattern from Notion Creative Art — instant download.'

  const { siteOgImage } = await getSiteSeoContext()
  const image = product.images?.[0]
    ? deriveVariantUrl(product.images[0], 'large')
    : siteOgImage

  return buildMetadata({
    title: product.meta_title || product.title,
    description,
    path: `/pattern/${slug}`,
    image,
    type: 'product',
  })
}

/** Pre-generate static pages for all active products at build time. */
export async function generateStaticParams() {
  const { getAllProductSlugs } = await import('@/lib/data/products')
  const slugs = await getAllProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

/** Product detail page with JSON-LD structured data for rich search results. */
export default async function PatternPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  let productJsonLd: ReturnType<typeof buildProductJsonLd> | null = null
  let breadcrumbJsonLd: ReturnType<typeof buildBreadcrumbListJsonLd> | null = null

  if (product) {
    const [reviewStats, reviews, category] = await Promise.all([
      getProductReviewStats(product.id),
      getApprovedReviews(product.id),
      product.category_id ? getCategoryById(product.category_id) : Promise.resolve(null),
    ])
    productJsonLd = buildProductJsonLd(product, {
      averageRating: reviewStats.averageRating,
      reviewCount: reviewStats.reviewCount,
      reviews,
    })

    // Mirror visible breadcrumb: Home › [Category ›] Product
    const crumbItems: { name: string; path: string }[] = [{ name: 'Home', path: '/' }]
    if (category) {
      crumbItems.push({ name: category.name, path: `/shop/${category.slug}` })
    }
    crumbItems.push({ name: product.title, path: `/pattern/${product.slug}` })
    breadcrumbJsonLd = buildBreadcrumbListJsonLd(crumbItems)
  }

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <ProductDetail initialProduct={product} />
    </>
  )
}
