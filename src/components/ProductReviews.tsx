'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StarRating } from './StarRating'
import {
  fetchApprovedReviews,
  fetchProductReviewStats,
  fetchUserReview,
  formatReviewDate,
  submitReview,
} from '../lib/reviews'
import { profileDisplayName } from '../lib/profileName'
import type { Profile, Review, ReviewStats } from '../lib/types'

const INITIAL_VISIBLE = 3

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'Maker'
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="rounded-[18px] border border-border bg-surface px-5 py-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <StarRating value={review.rating} size={16} />
        <time dateTime={review.created_at} className="text-[13px] text-muted">
          {formatReviewDate(review.created_at)}
        </time>
      </div>
      <p className="text-[15px] leading-relaxed text-ink whitespace-pre-wrap">{review.body}</p>
      <p className="mt-3 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink">
        {firstName(review.reviewer_name)}
        {review.is_verified && (
          <span className="font-normal text-muted">· Verified purchase</span>
        )}
      </p>
    </article>
  )
}

function RatingSummary({ stats, reviews }: { stats: ReviewStats; reviews: Review[] }) {
  const total = reviews.length
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }))
  const reviewCount = stats.reviewCount || total
  return (
    <div className="rounded-[18px] border border-border bg-surface px-5 py-6 md:px-6">
      <p className="flex items-baseline gap-2">
        <span className="font-heading text-[52px] font-bold leading-none text-ink tabular-nums">
          {stats.averageRating.toFixed(1)}
        </span>
        <span className="text-[14px] text-muted">out of 5</span>
      </p>
      <StarRating value={stats.averageRating} size={20} className="mt-3" />
      <p className="mt-3 text-[14px] text-muted">
        Based on {reviewCount} review{reviewCount === 1 ? '' : 's'}
      </p>
      <ul className="mt-4 space-y-2">
        {counts.map(({ star, count }) => (
          <li key={star} className="flex items-center gap-3 text-[13px] text-muted">
            <span className="w-12 shrink-0">{star} star</span>
            <span
              className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-skeleton"
              role="img"
              aria-label={`${count} of ${total} reviews are ${star} star`}
            >
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-gold"
                style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
              />
            </span>
            <span className="w-8 shrink-0 text-right tabular-nums">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type ProductReviewsProps = {
  productId: string
  userId: string | null
  profile: Profile | null
  owned: boolean
  /** Write-review panel visibility — owned by the parent so buy-box CTAs can open it. */
  formOpen: boolean
  onFormOpenChange: (open: boolean) => void
}

export function ProductReviews({ productId, userId, profile, owned, formOpen, onFormOpenChange }: ProductReviewsProps) {
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, reviewCount: 0 })
  const [reviews, setReviews] = useState<Review[]>([])
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [nameDraft, setNameDraft] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)

  const defaultName = profileDisplayName(profile, '')
  const reviewerName = nameDraft ?? defaultName

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchProductReviewStats(productId),
      fetchApprovedReviews(productId),
      userId ? fetchUserReview(productId, userId) : Promise.resolve(null),
    ]).then(([nextStats, approved, mine]) => {
      if (cancelled) return
      setStats(nextStats)
      setReviews(approved)
      setUserReview(mine)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [productId, userId, reloadKey])

  const canSubmit = owned && !!userId && !userReview && !formSuccess

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !canSubmit) return
    setFormError(null)
    setSubmitting(true)
    const result = await submitReview({
      productId,
      rating,
      body,
      reviewerName: reviewerName.trim() || defaultName,
    })
    setSubmitting(false)
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    setFormSuccess(true)
    setReloadKey((k) => k + 1)
  }

  const visible = showAll ? reviews : reviews.slice(0, INITIAL_VISIBLE)

  const writeButton = (className: string) => (
    <button
      type="button"
      onClick={() => onFormOpenChange(!formOpen)}
      aria-expanded={formOpen}
      aria-controls="write-review"
      className={`inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-primary bg-white px-6 text-[14px] font-semibold text-primary transition-colors hover:bg-primary-soft ${className}`}
    >
      Write a review
    </button>
  )

  return (
    <div>
      <div className="mb-6 md:mb-8 flex items-center justify-between gap-4">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-ink">Customer reviews</h2>
        {writeButton('hidden md:inline-flex shrink-0')}
      </div>

      {loading ? (
        <p className="text-[15px] text-muted py-4" aria-live="polite">Loading reviews…</p>
      ) : (
        <>
          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-6 items-start">
              <RatingSummary stats={stats} reviews={reviews} />
              <div className="space-y-4">
                {visible.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </div>
          ) : (
            !userReview && (
              <p className="text-[15px] text-muted leading-relaxed">
                No reviews yet. Be the first to share your experience with this pattern.
              </p>
            )
          )}

          {writeButton('mt-6 w-full md:hidden min-h-[52px]')}

          {reviews.length > INITIAL_VISIBLE && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                aria-expanded={showAll}
                className="inline-flex min-h-11 items-center gap-1.5 px-4 text-[15px] font-bold text-primary hover:underline"
              >
                {showAll ? 'Show fewer reviews' : 'Read all reviews'}
                <span aria-hidden>{showAll ? '↑' : '→'}</span>
              </button>
            </div>
          )}

          {userReview && (
            <div className="mt-6 rounded-[18px] border border-border bg-surface p-5 space-y-3">
              <p className="text-[12px] font-bold tracking-[0.12em] text-muted">YOUR REVIEW</p>
              <ReviewCard review={userReview} />
              {userReview.status === 'pending' && (
                <p className="text-[13px] text-muted">Pending approval. It will appear here once moderated.</p>
              )}
              {userReview.status === 'rejected' && (
                <p className="text-[13px] text-error">This review was not approved for publication.</p>
              )}
            </div>
          )}

          {formOpen && (
            <div id="write-review" className="mt-6 max-w-2xl">
              {canSubmit ? (
                <form onSubmit={handleSubmit} className="rounded-[18px] border border-border bg-surface p-5 md:p-6 space-y-4">
                  <h3 className="text-[18px] font-bold text-ink">Write a review</h3>
                  <div>
                    <p id="review-rating-label" className="mb-2 text-[13px] text-muted">Your rating</p>
                    <StarRating value={rating} size={28} onChange={setRating} />
                  </div>
                  <div>
                    <label htmlFor="reviewer-name" className="mb-1.5 block text-[13px] text-muted">Display name</label>
                    <input
                      id="reviewer-name"
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setNameDraft(e.target.value)}
                      maxLength={80}
                      required
                      className="min-h-11 w-full rounded-xl border border-border bg-bg px-3 text-[15px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="review-body" className="mb-1.5 block text-[13px] text-muted">Your review</label>
                    <textarea
                      id="review-body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      minLength={10}
                      maxLength={2000}
                      required
                      rows={4}
                      placeholder="What did you make? Was the pattern clear and enjoyable?"
                      className="min-h-[110px] w-full resize-y rounded-xl border border-border bg-bg px-3 py-2 text-[15px]"
                    />
                    <p className="mt-1 text-[12px] text-muted">{body.length}/2000</p>
                  </div>
                  {formError && <p className="text-[14px] text-error" role="alert">{formError}</p>}
                  <button
                    type="submit"
                    disabled={submitting || body.trim().length < 10}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-[14px] font-semibold text-primary-contrast transition-colors hover:bg-primary-hover disabled:opacity-50"
                  >
                    {submitting ? 'Submitting…' : 'Submit review'}
                  </button>
                </form>
              ) : formSuccess ? (
                <p className="text-[15px] text-muted" role="status">
                  Thanks! Your review is pending approval and will appear here shortly.
                </p>
              ) : !userId ? (
                <p className="text-[15px] text-muted">
                  <Link href="/login" className="font-semibold text-primary underline underline-offset-2">Sign in</Link>
                  {' '}to leave a review after downloading this pattern.
                </p>
              ) : !owned ? (
                <p className="text-[15px] text-muted">Download or purchase this pattern to leave a review.</p>
              ) : (
                <p className="text-[15px] text-muted">You have already reviewed this pattern.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
