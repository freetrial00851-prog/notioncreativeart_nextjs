'use client'

import { useState } from 'react'
import { subscribeToNewsletter } from '../lib/newsletter'

/**
 * Responsive rule (single breakpoint pair — no sm:/lg: mid-state):
 *   < 768px  → stacked, centered
 *   ≥ 768px  → horizontal row, left text + form (tablet through desktop identical)
 */
export function NewsletterBanner(_props: { image?: string }) {
  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-16 py-5 md:py-7">
      <div
        className="rounded-2xl px-8 py-10 md:px-14 md:py-12 flex flex-col text-center gap-6 md:flex-row md:items-center md:justify-between md:text-left md:gap-8 text-white"
        style={{ background: 'var(--color-primary)' }}
      >
        <div className="min-w-0 md:flex-1">
          <p className="text-[10px] tracking-[0.2em] opacity-70 mb-2">JOIN OUR MAKER COMMUNITY</p>
          <h2 className="font-heading font-semibold text-2xl md:text-3xl mb-2 md:mb-3">Get 10% Off Your Next Order</h2>
          <p className="text-[13px] opacity-80 max-w-sm mx-auto md:mx-0">
            Get exclusive patterns, tips, new releases and special offers directly to your inbox.
          </p>
        </div>
        <NewsletterForm />
      </div>
    </section>
  )
}

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { ok, error } = await subscribeToNewsletter(email)
    if (!ok) { setError(error); return }
    setSubmitted(true)
  }

  if (submitted) {
    return <p className="text-[13px] font-medium shrink-0">You&apos;re on the list — thank you.</p>
  }

  return (
    <div className="w-full md:w-auto shrink-0 min-w-0">
      <form
        onSubmit={subscribe}
        className="flex flex-col gap-2.5 w-full md:flex-row md:items-stretch"
      >
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="w-full min-w-0 md:w-[240px] px-4 py-3 rounded-lg border-0 text-ink text-[13px] text-center md:text-left focus:outline-none focus:ring-2 focus:ring-ink"
          style={{ background: 'white' }}
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-lg text-[12px] font-semibold tracking-[0.06em] hover:opacity-90 transition-opacity shrink-0"
          style={{ background: 'var(--color-accent)', color: 'white' }}
        >
          SUBSCRIBE
        </button>
      </form>
      {error && <p className="text-[11px] text-white/90 mt-2">{error}</p>}
    </div>
  )
}
