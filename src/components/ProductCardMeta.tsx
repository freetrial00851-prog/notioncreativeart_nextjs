import type { Product, ReviewStats } from '../lib/types'
import { skillLevelTagLabel } from '../lib/productCardMeta'
import { StarRatingCardSummary } from './StarRating'
import { ProductTagPill } from './ProductTagPill'

type ProductCardMetaProps = {
  product: Product
  reviewStats?: ReviewStats | null
  className?: string
}

/** Stars + skill pill shared by ProductCard and QuickView. */
export function ProductCardMeta({ product, reviewStats, className = '' }: ProductCardMetaProps) {
  const showStars = reviewStats && reviewStats.reviewCount >= 1
  const skillLabel = skillLevelTagLabel(product.skill_level)

  if (!showStars && !skillLabel) return null

  return (
    <div className={`space-y-1 ${className}`}>
      {showStars && (
        <StarRatingCardSummary
          averageRating={reviewStats.averageRating}
          reviewCount={reviewStats.reviewCount}
        />
      )}
      {skillLabel && <ProductTagPill label={skillLabel} compact />}
    </div>
  )
}
