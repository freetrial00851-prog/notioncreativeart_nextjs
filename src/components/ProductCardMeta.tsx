import type { Product, ReviewStats } from '../lib/types'
import { StarRatingCardSummary } from './StarRating'

type ProductCardMetaProps = {
  product: Product
  reviewStats?: ReviewStats | null
  className?: string
}

/** Stars row for ProductCard / QuickView — renders only when real rating data exists. */
export function ProductCardMeta({ reviewStats, className = '' }: ProductCardMetaProps) {
  if (!reviewStats || reviewStats.reviewCount < 1) return null

  return (
    <div className={`h-3 flex items-center ${className}`}>
      <StarRatingCardSummary
        averageRating={reviewStats.averageRating}
        reviewCount={reviewStats.reviewCount}
      />
    </div>
  )
}
