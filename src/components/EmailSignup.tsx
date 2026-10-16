'use client'

import { useState } from 'react'
import Link from 'next/link'
import { subscribeToNewsletter, useNewsletterSubscribed } from '@/lib/newsletter'

/** Primary newsletter band — DESIGN_SPEC §3.12 */
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
    if (!ok) {
      setError(err)
      return
    }
  }

  return (
    <section className="bg-primary text-primary-contrast">
      <div className="max-w-site mx-auto page-gutter section-y flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="min-w-0 lg:max-w-md">
          <h2 className="type-h2 mb-2">{subscribed ? "You're on the list" : 'Get 10% off your next order'}</h2>
          <p className="text-[15px] text-white/85 leading-relaxed">
            {subscribed
              ? 'Thanks for joining the maker community. New patterns will land straight in your inbox.'
              : 'Join the maker community. New patterns, straight to your inbox.'}
          </p>
        </div>
        <div className="w-full lg:max-w-md">
          {subscribed ? (
            <p role="status" className="inline-flex items-center gap-3 rounded-full bg-white/10 px-5 py-3 text-[15px] font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-primary" aria-hidden>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Subscribed
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
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
                className="flex-1 min-h-12 rounded-full border-0 bg-white px-5 text-[16px] md:text-[15px] text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              />
              <button
                type="submit"
                disabled={submitting}
                className="min-h-12 shrink-0 rounded-full bg-white px-6 text-[14px] font-semibold text-primary hover:bg-white/90 disabled:opacity-60"
              >
                {submitting ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
          )}
          {error && <p className="mt-2 text-[12px] text-white/90">{error}</p>}
          <p className={`mt-3 text-[12px] text-white/70 ${subscribed ? "hidden" : ""}`}>
            Unsubscribe anytime. Read our{' '}
            <Link href="/privacy" className="underline underline-offset-2">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
