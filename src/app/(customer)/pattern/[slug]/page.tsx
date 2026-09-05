import type { Metadata } from 'next'
import { getImageProps } from 'next/image'
import { preload } from 'react-dom'
import { buildBreadcrumbListJsonLd, buildMetadata, buildProductJsonLd } from '@/lib/seo'
import { getCategoryById, getProductBySlug } from '@/lib/data/products'
import { getApprovedReviews, getProductReviewStats } from '@/lib/data/reviews'
import { deriveVariantUrl } from '@/lib/imageVariants'
import { getSiteSeoContext } from '@/lib/seoSettings'
import { ProductDetail } from '@/views/ProductDetail'

type Props = { params: Promise<{ slug: string }> }

/** Must match ProductDetail main gallery `sizes` (SSR-stable; no useIsMobile). */
const GALLERY_LCP_SIZES =
  '(max-width: 768px) 100vw, (max-width: 1024px) 62vw, 52vw'

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

/** High-priority preload for the gallery LCP image — in the first HTML, no client JS. */
function preloadProductLcpImage(cardUrl: string, alt: string) {
  // `large` (~1000px) — near-identical to `full` (~1024px) but smaller on the wire.
  const src = deriveVariantUrl(cardUrl, 'large')
  const { props } = getImageProps({
    src,
    alt,
    width: 1000,
    height: 1000,
    sizes: GALLERY_LCP_SIZES,
    priority: true,
  })
  preload(props.src, {
    as: 'image',
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    fetchPriority: 'high',
  })
}

/** Product detail page with JSON-LD structured data for rich search results. */
export default async function PatternPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  let productJsonLd: ReturnType<typeof buildProductJsonLd> | null = null
  let breadcrumbJsonLd: ReturnType<typeof buildBreadcrumbListJsonLd> | null = null

  if (product) {
    if (product.images?.[0]) {
      preloadProductLcpImage(product.images[0], product.title)
    }

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
