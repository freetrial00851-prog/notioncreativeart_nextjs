import { createStaticClient } from '@/lib/supabase/static'
import type { Review, ReviewStats } from '@/lib/types'
import { PUBLIC_REVIEW_COLUMNS } from '@/lib/reviews'

/** Server-side review stats for JSON-LD and static generation (no cookies). */
export async function getProductReviewStats(productId: string): Promise<ReviewStats> {
  const supabase = createStaticClient()
  const { data, error } = await supabase.rpc('get_product_review_stats', { p_product_id: productId })
  if (error || !data?.length) return { averageRating: 0, reviewCount: 0 }
  const row = data[0] as { average_rating: number; review_count: number }
  return {
    averageRating: Number(row.average_rating) || 0,
    reviewCount: Number(row.review_count) || 0,
  }
}

/** Approved reviews for JSON-LD — newest first, capped for payload size. */
export async function getApprovedReviews(productId: string, limit = 5): Promise<Review[]> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('reviews')
    .select(PUBLIC_REVIEW_COLUMNS)
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []) as Review[]
}
