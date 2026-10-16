'use client'

import { useState } from 'react'
import Link from 'next/link'
import { subscribeToNewsletter, useNewsletterSubscribed } from '@/lib/newsletter'

/** Newsletter band — pink, centered, underline field (reference). Remembers a successful signup. */
export function EmailSignup() {
  const [email, setEmail] = useState('')
  const subscribed = useNewsletterSubscribed()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { ok, error: err } = await subscribeToNewsletter(email)
    setSubmitting(false)
    if (!ok) setError(err)
  }

  return (
    <section className="bg-pink-soft text-ink">
      <div className="mx-auto max-w-site page-gutter py-14 text-center md:py-[70px]">
        <p className="eyebrow justify-center text-[#6220C5]">Notes from our creative corner</p>
        <h2 className="mx-auto my-4 max-w-3xl font-heading text-[clamp(35px,4vw,52px)] font-normal leading-[1.06] tracking-[-0.035em]">
          {subscribed ? "You're on the list." : 'A little inspiration in your inbox.'}
        </h2>
        <p className="mx-auto max-w-md text-[13px] leading-[1.8] text-muted">
          {subscribed
            ? 'Thanks for joining. New patterns and the occasional treat will land in your inbox.'
            : 'New patterns, creative ideas, and occasional treats. No clutter, just the good stuff.'}
        </p>

        {subscribed ? (
          <p role="status" className="mx-auto mt-6 inline-flex items-center gap-3 rounded-[3px] bg-ink px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
            <span aria-hidden>✓</span> Subscribed
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mx-auto mt-6 flex max-w-[470px] items-end border-b-2 border-ink focus-within:border-violet"
          >
            <label className="sr-only" htmlFor="email-signup">
              Email address
            </label>
            <input
              id="email-signup"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="min-h-12 min-w-0 flex-1 bg-transparent px-0.5 text-[16px] text-ink placeholder:text-muted !outline-none md:text-[13px]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 shrink-0 items-center px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink transition-colors hover:text-violet disabled:opacity-50"
            >
              {submitting ? 'Joining…' : 'Join the list ↗'}
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-3 text-[12px] font-medium text-sale">
            {error}
          </p>
        )}
        {!subscribed && (
          <p className="mt-4 text-[11px] text-muted">
            Unsubscribe anytime. Read our{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
              privacy policy
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  )
}
