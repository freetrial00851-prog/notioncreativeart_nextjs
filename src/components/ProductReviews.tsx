'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StarRating, StarRatingSummary } from './StarRating'
import {
  fetchApprovedReviews,
  fetchProductReviewStats,
  fetchUserReview,
  formatReviewDate,
  submitReview,
} from '../lib/reviews'
import { profileDisplayName } from '../lib/profileName'
import type { Profile, Review, ReviewStats } from '../lib/types'

function ReviewBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className="text-[10px] tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border border-line text-ink-soft"
    >
      {verified ? 'Verified Purchase' : 'Maker'}
    </span>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="border-b border-line pb-6 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <StarRating value={review.rating} size={14} />
        <span className="text-[13px] font-medium text-ink">{review.reviewer_name}</span>
        <ReviewBadge verified={review.is_verified} />
        <span className="text-[11px] text-ink-soft ml-auto">{formatReviewDate(review.created_at)}</span>
      </div>
      <p className="text-[14px] text-ink-soft leading-relaxed whitespace-pre-wrap">{review.body}</p>
    </article>
  )
}

type ProductReviewsProps = {
  productId: string
  userId: string | null
  profile: Profile | null
  owned: boolean
  /** When true, scroll/focus the write form (e.g. from buy box CTA). */
  showForm?: boolean
}

export function ProductReviews({ productId, userId, profile, owned, showForm = false }: ProductReviewsProps) {
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, reviewCount: 0 })
  const [reviews, setReviews] = useState<Review[]>([])
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)

  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState(false)

  const defaultName = profileDisplayName(profile, '')

  useEffect(() => {
    setReviewerName(defaultName)
  }, [defaultName])

  const reload = async () => {
    setLoading(true)
    const [nextStats, approved, mine] = await Promise.all([
      fetchProductReviewStats(productId),
      fetchApprovedReviews(productId),
      userId ? fetchUserReview(productId, userId) : Promise.resolve(null),
    ])
    setStats(nextStats)
    setReviews(approved)
    setUserReview(mine)
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [productId, userId])

  const canSubmit = owned && userId && !userReview && !formSuccess
  const showWriteForm = canSubmit || showForm

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
    await reload()
  }

  if (loading) {
    return <p className="text-[14px] text-ink-soft py-4">Loading reviews…</p>
  }

  return (
    <div className="max-w-2xl space-y-8">
      {stats.reviewCount > 0 && (
        <div className="flex items-center gap-3 pb-2 border-b border-line">
          <StarRatingSummary averageRating={stats.averageRating} reviewCount={stats.reviewCount} size={16} />
          <span className="text-[12px] text-ink-soft">
            {stats.reviewCount} review{stats.reviewCount === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      ) : (
        !userReview && (
          <p className="text-[14px] text-ink-soft leading-relaxed">
            No reviews yet — be the first to share your experience with this pattern.
          </p>
        )
      )}

      {userReview && (
        <div className="rounded-xl border border-line p-4 space-y-2" style={{ background: 'var(--color-surface)' }}>
          <p className="text-[11px] tracking-[0.12em] text-ink-soft">YOUR REVIEW</p>
          <ReviewCard review={userReview} />
          {userReview.status === 'pending' && (
            <p className="text-[12px] text-ink-soft">Pending approval — it will appear here once moderated.</p>
          )}
          {userReview.status === 'rejected' && (
            <p className="text-[12px]" style={{ color: 'var(--color-madder)' }}>
              This review was not approved for publication.
            </p>
          )}
        </div>
      )}

      {showWriteForm && canSubmit && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-line p-5 space-y-4" id="write-review">
          <p className="text-[11px] tracking-[0.12em] text-ink-soft">WRITE A REVIEW</p>
          <div>
            <label className="block text-[12px] text-ink-soft mb-2">Your rating</label>
            <StarRating value={rating} size={22} onChange={setRating} />
          </div>
          <div>
            <label htmlFor="reviewer-name" className="block text-[12px] text-ink-soft mb-1.5">Display name</label>
            <input
              id="reviewer-name"
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              maxLength={80}
              required
              className="w-full border border-line rounded-lg px-3 py-2 text-[14px] bg-canvas"
            />
          </div>
          <div>
            <label htmlFor="review-body" className="block text-[12px] text-ink-soft mb-1.5">Your review</label>
            <textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              minLength={10}
              maxLength={2000}
              required
              rows={4}
              placeholder="What did you make? Was the pattern clear and enjoyable?"
              className="w-full border border-line rounded-lg px-3 py-2 text-[14px] bg-canvas resize-y min-h-[100px]"
            />
            <p className="text-[11px] text-ink-soft mt-1">{body.length}/2000</p>
          </div>
          {formError && <p className="text-[13px]" style={{ color: 'var(--color-madder)' }}>{formError}</p>}
          {formSuccess && (
            <p className="text-[13px] text-ink-soft">
              Thanks! Your review is pending approval and will appear here shortly.
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || body.trim().length < 10}
            className="px-5 py-2.5 text-[12px] tracking-[0.1em] font-semibold rounded-full text-canvas disabled:opacity-50"
            style={{ background: 'var(--color-accent)' }}
          >
            {submitting ? 'SUBMITTING…' : 'SUBMIT REVIEW'}
          </button>
        </form>
      )}

      {!userId && (
        <p className="text-[14px] text-ink-soft">
          <Link href="/login" className="underline underline-offset-2 hover:text-ink">Sign in</Link>
          {' '}to leave a review after downloading this pattern.
        </p>
      )}

      {userId && !owned && (
        <p className="text-[14px] text-ink-soft">
          Download or purchase this pattern to leave a review.
        </p>
      )}
    </div>
  )
}
