'use client'

import { useState } from 'react'
import Link from 'next/link'
import { subscribeToNewsletter } from '@/lib/newsletter'

/** Primary newsletter band — DESIGN_SPEC §3.12 */
export function EmailSignup() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
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
    setSubmitted(true)
  }

  return (
    <section className="bg-primary text-primary-contrast">
      <div className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-12 md:py-14 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="min-w-0 lg:max-w-md">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-2">Get 10% off your next order</h2>
          <p className="text-[14px] text-white/85 leading-relaxed">
            Join the maker community. New patterns, straight to your inbox.
          </p>
        </div>
        <div className="w-full lg:max-w-md">
          {submitted ? (
            <p className="text-[14px] font-medium">You&apos;re on the list — thank you!</p>
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
                className="flex-1 min-h-12 rounded-full border-0 px-5 text-[14px] text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              />
              <button
                type="submit"
                disabled={submitting}
                className="min-h-12 shrink-0 rounded-full bg-white px-6 text-[14px] font-semibold text-primary hover:bg-white/95 disabled:opacity-60"
              >
                {submitting ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
          )}
          {error && <p className="mt-2 text-[12px] text-white/90">{error}</p>}
          <p className="mt-3 text-[12px] text-white/70">
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
