'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { formatReviewDate } from '../lib/reviews'
import { StarRating } from '../components/StarRating'
import { MaterialIcon } from '../components/MaterialIcon'
import type { Review } from '../lib/types'

type ReviewRow = Review & {
  product?: { title: string; slug: string } | null
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all'

export function AdminReviews() {
  const [filter, setFilter] = useState<StatusFilter>('pending')
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('reviews')
      .select('*, product:products(title, slug)')
      .order('created_at', { ascending: false })

    if (filter !== 'all') query = query.eq('status', filter)

    const { data } = await query
    setReviews((data ?? []) as ReviewRow[])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    void load()
  }, [load])

  const moderate = async (id: string, status: 'approved' | 'rejected') => {
    setWorkingId(id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('reviews')
      .update({
        status,
        moderated_at: new Date().toISOString(),
        moderated_by: user?.id ?? null,
      })
      .eq('id', id)
    setWorkingId(null)
    await load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return
    setWorkingId(id)
    await supabase.from('reviews').delete().eq('id', id)
    setWorkingId(null)
    await load()
  }

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-2xl mb-1">Reviews</h1>
        <p className="text-[13px] text-ink-soft">Approve or reject customer reviews before they appear on product pages.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-[12px] tracking-[0.06em] border transition-colors ${
              filter === f.key
                ? 'border-ink bg-ink text-canvas'
                : 'border-line text-ink-soft hover:border-ink hover:text-ink'
            }`}
          >
            {f.label.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[14px] text-ink-soft py-12 text-center">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="text-[14px] text-ink-soft py-12 text-center border border-line rounded-xl">
          No {filter === 'all' ? '' : filter} reviews.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border border-line rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-start gap-2 justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StarRating value={r.rating} size={14} />
                    <span className="text-[13px] font-medium text-ink">{r.reviewer_name}</span>
                    <span className="text-[10px] tracking-[0.08em] uppercase px-2 py-0.5 rounded-full border border-line text-ink-soft">
                      {r.is_verified ? 'Verified Purchase' : 'Maker'}
                    </span>
                    <span
                      className="text-[10px] tracking-[0.08em] uppercase px-2 py-0.5 rounded-full"
                      style={{
                        background: r.status === 'approved' ? 'var(--color-surface)' : r.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: r.status === 'approved' ? 'var(--color-ink-soft)' : r.status === 'pending' ? '#92400e' : '#991b1b',
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                  {r.product && (
                    <Link
                      href={`/pattern/${r.product.slug}`}
                      className="text-[12px] text-ink-soft hover:text-ink underline underline-offset-2"
                      target="_blank"
                    >
                      {r.product.title}
                    </Link>
                  )}
                  <p className="text-[11px] text-ink-soft">{formatReviewDate(r.created_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {r.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={workingId === r.id}
                      onClick={() => moderate(r.id, 'approved')}
                      className="px-3 py-1.5 text-[11px] tracking-[0.08em] rounded-full border border-line hover:bg-surface disabled:opacity-50 flex items-center gap-1"
                    >
                      <MaterialIcon name="check" size={14} /> APPROVE
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      type="button"
                      disabled={workingId === r.id}
                      onClick={() => moderate(r.id, 'rejected')}
                      className="px-3 py-1.5 text-[11px] tracking-[0.08em] rounded-full border border-line hover:bg-surface disabled:opacity-50"
                    >
                      REJECT
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={workingId === r.id}
                    onClick={() => remove(r.id)}
                    className="px-3 py-1.5 text-[11px] tracking-[0.08em] rounded-full border border-line hover:bg-surface disabled:opacity-50"
                    style={{ color: 'var(--color-madder)' }}
                  >
                    DELETE
                  </button>
                </div>
              </div>
              <p className="text-[14px] text-ink-soft leading-relaxed whitespace-pre-wrap">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
