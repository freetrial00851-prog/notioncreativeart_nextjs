'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const field =
  'w-full min-h-12 rounded-[6px] border bg-white px-4 py-3 text-[16px] text-ink md:text-[15px]'

/** Contact form: sends the message to the support mailbox through the contact-message function. */
export function ContactForm() {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // hidden trap for bots
  const [phase, setPhase] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phase === 'sending') return
    setPhase('sending')
    setError(null)
    const { error: fnError } = await supabase.functions.invoke('contact-message', {
      body: { name, email: email || user?.email || '', order, message, website },
    })
    if (fnError) {
      let text = 'We could not send your message. Please try again, or email us directly.'
      try {
        const body = await (fnError as { context?: Response }).context?.json()
        if (body?.error) text = body.error
      } catch {
        /* keep generic */
      }
      setError(text)
      setPhase('error')
      return
    }
    setPhase('sent')
  }

  if (phase === 'sent') {
    return (
      <p role="status" className="rounded-[10px] border border-border bg-surface p-4 text-[15px] text-ink">
        Thank you. Your message has been sent and we will reply to {email || user?.email} within 1 to 2 days. Check your spam folder if you do not hear back.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate={false}>
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-[14px] font-semibold text-ink">Your name</label>
        <input id="contact-name" name="name" required autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-[14px] font-semibold text-ink">Your email</label>
        <input id="contact-email" name="email" type="email" required autoComplete="email" value={email || user?.email || ''} onChange={(e) => setEmail(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="contact-order" className="mb-1.5 block text-[14px] font-semibold text-ink">
          Order number <span className="font-normal text-muted">(optional)</span>
        </label>
        <input id="contact-order" name="order" maxLength={60} value={order} onChange={(e) => setOrder(e.target.value)} className={field} />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-[14px] font-semibold text-ink">How can we help?</label>
        <textarea id="contact-message" name="message" required minLength={10} maxLength={4000} rows={6} value={message} onChange={(e) => setMessage(e.target.value)} className={field} />
      </div>
      {/* Real visitors never see or fill this. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>
      {error && <p role="alert" className="text-[14px] text-sale">{error}</p>}
      <button
        type="submit"
        disabled={phase === 'sending'}
        className="inline-flex min-h-11 items-center justify-center rounded-[3px] bg-primary px-6 text-[15px] font-semibold text-primary-contrast transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {phase === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
