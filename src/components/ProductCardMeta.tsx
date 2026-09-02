import type { Product, ReviewStats } from '../lib/types'
import { formatProductSkillFormat } from '../lib/productCardMeta'
import { StarRatingCardSummary } from './StarRating'

type ProductCardMetaProps = {
  product: Product
  reviewStats?: ReviewStats | null
  className?: string
}

/** Stars + skill/format lines shared by ProductCard and QuickView. */
export function ProductCardMeta({ product, reviewStats, className = '' }: ProductCardMetaProps) {
  const showStars = reviewStats && reviewStats.reviewCount >= 1

  return (
    <div className={`space-y-1 ${className}`}>
      {showStars && (
        <StarRatingCardSummary
          averageRating={reviewStats.averageRating}
          reviewCount={reviewStats.reviewCount}
        />
      )}
      <p className="text-[11px] text-ink-soft leading-snug">
        {formatProductSkillFormat(product.skill_level)}
      </p>
    </div>
  )
}
