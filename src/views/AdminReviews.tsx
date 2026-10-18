'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { formatReviewDate } from '../lib/reviews'
import { StarRating } from '../components/StarRating'
import type { Review } from '../lib/types'
import { Btn, Chip, Empty, PageHeader, Tabs, useAdminUi } from '../components/adminUi'

type ReviewRow = Review & { product?: { title: string; slug: string } | null }
type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all'

const SPAMMY = /https?:\/\/|www\.|\.com\b|buy now|casino|crypto|viagra|whatsapp|telegram/i

export function AdminReviews() {
  const { confirm, toast } = useAdminUi()
  const [filter, setFilter] = useState<StatusFilter>('pending')
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [cursor, setCursor] = useState(0)

  const loadCounts = useCallback(async () => {
    const head = (s?: string) => {
      const q = supabase.from('reviews').select('id', { count: 'exact', head: true })
      return s ? q.eq('status', s) : q
    }
    const [p, a, r, all] = await Promise.all([head('pending'), head('approved'), head('rejected'), head()])
    setCounts({ pending: p.count ?? 0, approved: a.count ?? 0, rejected: r.count ?? 0, all: all.count ?? 0 })
  }, [])

  const load = useCallback(async () => {
    let q = supabase.from('reviews').select('*, product:products(title, slug)').order('created_at', { ascending: false }).limit(200)
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setReviews((data ?? []) as unknown as ReviewRow[])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    load()
    loadCounts()
  }, [load, loadCounts])

  const moderate = useCallback(
    async (r: ReviewRow, status: 'approved' | 'rejected') => {
      setBusy(r.id)
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('reviews').update({ status, moderated_at: new Date().toISOString(), moderated_by: user?.id ?? null }).eq('id', r.id)
      setBusy(null)
      if (error) return toast('Couldn’t update: ' + error.message, 'error')
      toast(status === 'approved' ? 'Approved — it’s on the product page' : 'Rejected')
      setReviews((prev) => (filter === 'all' ? prev.map((x) => (x.id === r.id ? { ...x, status } : x)) : prev.filter((x) => x.id !== r.id)))
      loadCounts()
    },
    [filter, loadCounts, toast],
  )

  const remove = async (r: ReviewRow) => {
    if (!(await confirm({ title: 'Delete this review?', body: `${r.reviewer_name}’s review is removed permanently.`, confirmLabel: 'Delete', tone: 'danger' }))) return
    setBusy(r.id)
    await supabase.from('reviews').delete().eq('id', r.id)
    setBusy(null)
    setReviews((prev) => prev.filter((x) => x.id !== r.id))
    loadCounts()
  }

  const approveEasy = async () => {
    const easy = reviews.filter((r) => r.status === 'pending' && r.is_verified && r.rating >= 4 && !SPAMMY.test(r.body ?? ''))
    if (easy.length === 0) return toast('No verified 4–5★ reviews waiting.')
    if (!(await confirm({ title: `Approve ${easy.length} review${easy.length === 1 ? '' : 's'}?`, body: 'Only verified buyers with 4 or 5 stars and nothing that looks like spam.', confirmLabel: 'Approve all' }))) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('reviews').update({ status: 'approved', moderated_at: new Date().toISOString(), moderated_by: user?.id ?? null }).in('id', easy.map((r) => r.id))
    toast(`${easy.length} approved`)
    load()
    loadCounts()
  }

  // Keyboard: J/K move, A approve, R reject (ignored while typing).
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [role=dialog]') || e.metaKey || e.ctrlKey) return
      const key = e.key.toLowerCase()
      const cur = reviews[cursor]
      if (key === 'j') setCursor((c) => Math.min(c + 1, reviews.length - 1))
      else if (key === 'k') setCursor((c) => Math.max(c - 1, 0))
      else if (key === 'a' && cur && cur.status !== 'approved') moderate(cur, 'approved')
      else if (key === 'r' && cur && cur.status !== 'rejected') moderate(cur, 'rejected')
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [reviews, cursor, moderate])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCursor((c) => Math.min(c, Math.max(reviews.length - 1, 0)))
  }, [reviews.length])

  const emptyCopy: Record<StatusFilter, string> = {
    pending: 'You’re all caught up. New reviews will show up here.',
    approved: 'No approved reviews yet.',
    rejected: 'Nothing has been rejected.',
    all: 'No reviews yet.',
  }

  return (
    <div>
      <PageHeader
        title="Reviews"
        desc="Customer reviews wait here until you approve them. Press A to approve, R to reject, J/K to move."
        actions={filter === 'pending' && reviews.length > 1 ? <Btn onClick={approveEasy}>Approve all verified 4–5★</Btn> : undefined}
      />
      <div className="mb-4">
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { id: 'pending', label: 'To review', count: counts.pending },
            { id: 'approved', label: 'Approved', count: counts.approved },
            { id: 'rejected', label: 'Rejected', count: counts.rejected },
            { id: 'all', label: 'All', count: counts.all },
          ]}
        />
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[#ECEEF0]" />
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white"><Empty icon="rate_review" title={emptyCopy[filter]} /></div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r, i) => {
            const flagged = SPAMMY.test(r.body ?? '')
            return (
              <li
                key={r.id}
                onClick={() => setCursor(i)}
                className={`rounded-2xl border bg-white p-4 transition-shadow sm:p-5 ${i === cursor ? 'border-ink shadow-[0_0_0_3px_rgba(0,0,0,0.06)]' : 'border-[#E5E7EB]'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating value={r.rating} size={15} />
                  <span className="text-[14px] font-semibold">{r.reviewer_name}</span>
                  {r.is_verified ? <Chip tone="green">Bought this</Chip> : <Chip>Not a buyer</Chip>}
                  {r.status === 'pending' && <Chip tone="amber">Waiting</Chip>}
                  {r.status === 'rejected' && <Chip tone="red">Rejected</Chip>}
                  {flagged && <Chip tone="red">Looks like spam</Chip>}
                  <span className="ml-auto text-[12px] text-[#6b7280]">{formatReviewDate(r.created_at)}</span>
                </div>
                {r.product && (
                  <Link href={`/pattern/${r.product.slug}`} target="_blank" className="mt-1.5 inline-block text-[13px] text-[#6b7280] underline underline-offset-2 hover:text-ink">
                    on {r.product.title}
                  </Link>
                )}
                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{r.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.status !== 'approved' && <Btn size="sm" variant="primary" disabled={busy === r.id} onClick={() => moderate(r, 'approved')}>Approve</Btn>}
                  {r.status !== 'rejected' && <Btn size="sm" disabled={busy === r.id} onClick={() => moderate(r, 'rejected')}>Reject</Btn>}
                  <Btn size="sm" variant="ghost" disabled={busy === r.id} onClick={() => remove(r)}>Delete</Btn>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
