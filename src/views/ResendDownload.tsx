'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

/** "Send my download again": the buyer enters the email they paid with. The answer never reveals if it has orders. */
export function ResendDownload() {
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phase === 'sending') return
    setPhase('sending')
    setMessage(null)
    const { error } = await supabase.functions.invoke('resend-guest-download', { body: { email } })
    if (error) {
      let text = 'Something went wrong. Please try again in a moment.'
      try {
        const body = await (error as { context?: Response }).context?.json()
        if (body?.error) text = body.error
      } catch {
        /* keep generic */
      }
      setMessage(text)
      setPhase('error')
      return
    }
    setPhase('sent')
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-10 md:py-14">
      <h1 className="type-h1 mb-2 text-ink">Send my download again</h1>
      <p className="mb-6 text-[15px] text-muted">
        Paid without an account? Enter the email you used at checkout and we will send you a fresh download link.
      </p>

      {phase === 'sent' ? (
        <div role="status" className="space-y-4 rounded-[10px] border border-border bg-surface p-4 text-[15px] text-ink">
          <p>
            <strong className="font-semibold">Check your inbox.</strong> If we found an order for {email.trim()}, a new link is on its way. It can take a few minutes. Look in spam or promotions too.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={() => setPhase('idle')} className="inline-flex min-h-11 items-center justify-center rounded-[3px] border-[1.5px] border-primary bg-white px-6 text-[15px] font-semibold text-primary hover:bg-primary-soft">
              Send to a different email
            </button>
            <Link href="/signup" className="inline-flex min-h-11 items-center px-1 font-semibold text-primary hover:underline">Create a free account</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="resend-email" className="block text-[14px] font-medium text-ink">Email used at checkout</label>
          <input
            id="resend-email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[6px] border border-border bg-white px-4 py-3 text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@example.com"
          />
          {message && <p role="alert" className="text-[14px] text-sale">{message}</p>}
          <button
            type="submit"
            disabled={phase === 'sending'}
            className="inline-flex min-h-11 items-center justify-center rounded-[3px] bg-primary px-6 text-[15px] font-semibold text-primary-contrast transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {phase === 'sending' ? 'Sending…' : 'Email me my download link'}
          </button>
          <p className="text-[14px] text-muted">
            Have an account? <Link href="/login" className="underline">Sign in</Link> to see all your orders. Still stuck? <Link href="/contact" className="underline">Contact us</Link>.
          </p>
        </form>
      )}
    </div>
  )
}
