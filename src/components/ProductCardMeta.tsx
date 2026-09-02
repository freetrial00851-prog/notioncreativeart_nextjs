import type { Product, ReviewStats } from '../lib/types'
import { skillLevelTagLabel } from '../lib/productCardMeta'
import { StarRatingCardSummary } from './StarRating'
import { ProductTagPill } from './ProductTagPill'

type ProductCardMetaProps = {
  product: Product
  reviewStats?: ReviewStats | null
  className?: string
}

/** Skill pill + stars shared by ProductCard and QuickView. */
export function ProductCardMeta({ product, reviewStats, className = '' }: ProductCardMetaProps) {
  const showStars = reviewStats && reviewStats.reviewCount >= 1
  const skillLabel = skillLevelTagLabel(product.skill_level)

  if (!showStars && !skillLabel) return null

  return (
    <div className={`flex flex-col items-start gap-0.5 ${className}`}>
      {skillLabel && (
        <ProductTagPill label={skillLabel} skillLevel={product.skill_level} compact />
      )}
      <div className="h-3 flex items-center">
        {showStars && (
          <StarRatingCardSummary
            averageRating={reviewStats.averageRating}
            reviewCount={reviewStats.reviewCount}
          />
        )}
      </div>
    </div>
  )
}
