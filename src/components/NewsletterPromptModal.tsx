'use client'

import { useCallback, useEffect, useState } from 'react'
import { subscribeToNewsletter } from '../lib/newsletter'
import { markNewsletterPrompted } from '../lib/newsletterPrompt'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { CloseCircleIcon } from './icons'

type Props = {
  open: boolean
  onClose: () => void
}

export function NewsletterPromptModal({ open, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useBodyScrollLock(open)

  const dismiss = useCallback(() => {
    markNewsletterPrompted()
    setEmail('')
    setError(null)
    setSubmitted(false)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismiss()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismiss])

  const subscribe = async (e: React.FormEvent) => {
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
    markNewsletterPrompted()
    setTimeout(dismiss, 1800)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/45 backdrop-blur-[2px] px-4"
      onClick={(e) => e.target === e.currentTarget && dismiss()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-prompt-title"
    >
      <div className="relative w-full max-w-md bg-canvas border border-line rounded-2xl shadow-xl p-8">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 p-1 rounded-full hover:opacity-80 transition-opacity"
          aria-label="Skip newsletter signup"
        >
          <CloseCircleIcon size={28} />
        </button>

        {submitted ? (
          <div className="pt-2 pr-8">
            <p className="text-[10px] tracking-[0.2em] text-ink-soft mb-2">JOIN OUR MAKER COMMUNITY</p>
            <h2 id="newsletter-prompt-title" className="font-heading font-semibold text-xl mb-2">You're on the list!</h2>
            <p className="text-[13px] text-ink-soft">Thanks — your download is already on its way.</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] tracking-[0.2em] text-ink-soft mb-2 pr-8">JOIN OUR MAKER COMMUNITY</p>
            <h2 id="newsletter-prompt-title" className="font-heading font-semibold text-xl mb-2 pr-8">
              Get new patterns in your inbox
            </h2>
            <p className="text-[13px] text-ink-soft mb-6">
              Exclusive releases, tips, and special offers — optional, and your download won't wait.
            </p>

            <form onSubmit={subscribe} className="space-y-3">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 rounded-lg border border-line text-ink text-[13px] focus:outline-none focus:ring-2 focus:ring-ink/20 bg-white"
                autoFocus
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 rounded-full text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: 'var(--color-accent)', color: 'white' }}
              >
                {submitting ? 'Subscribing…' : 'Subscribe'}
              </button>
              {error && <p className="text-[11px] text-red-600">{error}</p>}
            </form>

            <button
              type="button"
              onClick={dismiss}
              className="mt-4 w-full text-center text-[12px] text-ink-soft hover:text-ink underline underline-offset-2"
            >
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  )
}
