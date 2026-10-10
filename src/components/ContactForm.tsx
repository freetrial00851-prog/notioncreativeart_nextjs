'use client'

import { useId, useState, type FormEvent } from 'react'
import { CONTACT_TOPICS, sendContactMessage, type ContactTopic } from '@/lib/contact'
import { PRIMARY_PILL } from '@/components/account/AccountUI'

const FIELD =
  'block w-full min-h-11 rounded-full border border-border bg-white px-4 text-[16px] md:text-[15px] text-ink placeholder:text-muted-light focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30'
const TEXTAREA =
  'block w-full min-h-[140px] rounded-[20px] border border-border bg-white px-4 py-3 text-[16px] md:text-[15px] text-ink placeholder:text-muted-light focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 resize-y'

export function ContactForm() {
  const uid = useId()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState<ContactTopic>(CONTACT_TOPICS[0])
  const [orderNumber, setOrderNumber] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const result = await sendContactMessage({
      name,
      email,
      topic,
      order_number: orderNumber,
      message,
      company,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? "Couldn't send your message — please try again.")
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="rounded-[24px] border border-border bg-white p-6 md:p-8" role="status">
        <h2 className="font-heading text-[22px] font-bold text-ink">Message sent</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Thanks — I read every message myself and will reply to {email || 'your email'} as soon as I can.
        </p>
      </div>
    )
  }

  const errorId = `${uid}-error`

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative rounded-[24px] border border-border bg-white p-5 md:p-8"
      aria-describedby={error ? errorId : undefined}
    >
      {error && (
        <p id={errorId} role="alert" className="mb-5 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-[14px] text-error">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink">Name</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            maxLength={80}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={FIELD}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink">Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={FIELD}
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-[13px] font-semibold text-ink">Topic</span>
        <select
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value as ContactTopic)}
          className={`${FIELD} appearance-none pr-10`}
        >
          {CONTACT_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-[13px] font-semibold text-ink">Order number (optional)</span>
        <input
          type="text"
          name="order_number"
          autoComplete="off"
          maxLength={40}
          placeholder="#"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className={FIELD}
        />
        <span className="mt-1.5 block text-[13px] text-muted">Helps us find your purchase faster</span>
      </label>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-[13px] font-semibold text-ink">Message</span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={4000}
          placeholder="Tell us what happened"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={TEXTAREA}
        />
      </label>

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </label>
      </div>

      <button type="submit" disabled={busy} className={`${PRIMARY_PILL} mt-6 min-h-12 w-full`} aria-busy={busy || undefined}>
        {busy ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
