'use client'

import { useState } from 'react'
import { subscribeToNewsletter } from '../lib/newsletter'

/**
 * Breakpoints (project defaults — md: 768px, lg: 1024px):
 *   < 768px       → stacked, centered
 *   768–1023 (md) → stacked, left-aligned: text block on top, full-width email+button row below
 *   ≥ 1024 (lg)   → side-by-side: text left, email+button right
 *
 * Homepage wraps this in SectionBand for alternating bg + padding.
 * Elsewhere, pass `standalone` for its own max-width + vertical padding.
 */
export function NewsletterBanner(_props: { image?: string; standalone?: boolean }) {
  const card = (
    <div
      className="rounded-xl px-6 py-8 md:px-10 md:py-10 flex flex-col text-center gap-5 md:text-left md:gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 text-white"
      style={{ background: 'var(--color-primary)' }}
    >
      <div className="min-w-0 w-full lg:flex-1">
        <p className="text-caption tracking-[0.14em] uppercase opacity-70 mb-2">Join our maker community</p>
        <h2 className="font-heading font-semibold text-h2 md:text-[1.75rem] mb-2 tracking-tight">Get 10% Off Your Next Order</h2>
        <p className="text-body opacity-80 leading-relaxed max-w-sm mx-auto md:mx-0 md:max-w-none lg:max-w-sm">
          Get exclusive patterns, tips, new releases and special offers directly to your inbox.
        </p>
      </div>
      <NewsletterForm />
    </div>
  )

  if (_props.standalone) {
    return (
      <section className="max-w-site px-4 md:px-16 py-10 md:py-14">
        {card}
      </section>
    )
  }

  return card
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
    return (
      <p className="text-[13px] font-medium w-full lg:w-auto shrink-0 text-center md:text-left">
        You&apos;re on the list — thank you.
      </p>
    )
  }

  return (
    <div className="w-full min-w-0 lg:w-auto lg:shrink-0">
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
          className="w-full min-w-0 md:flex-1 lg:flex-none lg:w-[240px] px-4 py-3 rounded-lg border-0 text-ink text-[13px] text-center md:text-left focus:outline-none focus:ring-2 focus:ring-ink"
          style={{ background: 'white' }}
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-full text-[13px] font-semibold hover:opacity-90 transition-opacity shrink-0"
          style={{ background: 'var(--color-accent)', color: 'white' }}
        >
          Subscribe
        </button>
      </form>
      {error && <p className="text-[11px] text-white/90 mt-2 text-center md:text-left">{error}</p>}
    </div>
  )
}
