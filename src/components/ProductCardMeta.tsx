import type { Product, ReviewStats } from '../lib/types'
import { StarRatingCardSummary } from './StarRating'

type ProductCardMetaProps = {
  product: Product
  reviewStats?: ReviewStats | null
  className?: string
}

/** Reserved stars row shared by ProductCard and QuickView (skill pill renders above the title). */
export function ProductCardMeta({ reviewStats, className = '' }: ProductCardMetaProps) {
  const showStars = reviewStats && reviewStats.reviewCount >= 1

  return (
    <div className={`h-3 flex items-center ${className}`}>
      {showStars && (
        <StarRatingCardSummary
          averageRating={reviewStats.averageRating}
          reviewCount={reviewStats.reviewCount}
        />
      )}
    </div>
  )
}
