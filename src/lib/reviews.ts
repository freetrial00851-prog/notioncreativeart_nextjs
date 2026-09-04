import { supabase } from './supabase'
import type { Review, ReviewStats } from './types'

/** Columns safe for public / product-page review reads — never includes reviewer_email. */
export const PUBLIC_REVIEW_COLUMNS =
  'id, product_id, reviewer_name, rating, body, created_at, is_verified, status' as const

export async function fetchProductReviewStats(productId: string): Promise<ReviewStats> {
  const { data, error } = await supabase.rpc('get_product_review_stats', { p_product_id: productId })
  if (error || !data?.length) return { averageRating: 0, reviewCount: 0 }
  const row = data[0] as { average_rating: number; review_count: number }
  return {
    averageRating: Number(row.average_rating) || 0,
    reviewCount: Number(row.review_count) || 0,
  }
}

/** One query for all visible product IDs — returns only products with ≥1 approved review. */
export async function fetchReviewStatsBatch(productIds: string[]): Promise<Map<string, ReviewStats>> {
  const map = new Map<string, ReviewStats>()
  if (productIds.length === 0) return map
  const { data, error } = await supabase.rpc('get_product_review_stats_batch', { p_product_ids: productIds })
  if (error || !data) return map
  for (const row of data as { product_id: string; average_rating: number; review_count: number }[]) {
    map.set(row.product_id, {
      averageRating: Number(row.average_rating) || 0,
      reviewCount: Number(row.review_count) || 0,
    })
  }
  return map
}

export async function fetchApprovedReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(PUBLIC_REVIEW_COLUMNS)
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as Review[]
}

/** Own review for the signed-in user — still omits reviewer_email from the client payload. */
export async function fetchUserReview(productId: string, userId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select(PUBLIC_REVIEW_COLUMNS)
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data as Review
}

export async function submitReview(input: {
  productId: string
  rating: number
  body: string
  reviewerName: string
}): Promise<{ ok: true; reviewId: string } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc('submit_review', {
    p_product_id: input.productId,
    p_rating: input.rating,
    p_body: input.body.trim(),
    p_reviewer_name: input.reviewerName.trim(),
  })
  if (error) {
    const msg = error.message.includes('already reviewed')
      ? 'You have already reviewed this pattern.'
      : error.message.includes('must own')
        ? 'You must own this pattern to leave a review.'
        : error.message.includes('Not authenticated')
          ? 'Please sign in to leave a review.'
          : error.message.includes('between 10 and 2000')
            ? 'Review must be between 10 and 2,000 characters.'
            : "Couldn't submit your review — please try again."
    return { ok: false, error: msg }
  }
  return { ok: true, reviewId: data as string }
}

export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
