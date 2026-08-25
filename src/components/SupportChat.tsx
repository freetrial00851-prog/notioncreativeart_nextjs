'use client'

import Link from 'next/link'
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { MaterialIcon } from './MaterialIcon'
import { LogoIcon } from './Logo'
import { CloseCircleIcon } from './icons'

type Role = 'user' | 'assistant'
type ChatMsg = { id: string; role: Role; content: string }
type DownloadLink = { title: string; signedUrl: string; filename: string }

const WELCOME = 'Hi! How can I help you today?'

const QUICK_REPLIES = ['Order/download issue', 'Refund policy', 'How does delivery work?']

const ASKED_HUMAN_RE =
  /\b(talk to (a )?(human|person|agent)|human|agent|customer service|support)\b/i

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function isBotFailure(reply: string) {
  return /trouble answering|couldn't reach support|couldn't form a reply|isn't fully configured/i.test(reply)
}

export function SupportChat() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME },
  ])
  const [downloadsByMsg, setDownloadsByMsg] = useState<Record<string, DownloadLink[]>>({})
  const [authRequiredByMsg, setAuthRequiredByMsg] = useState<Record<string, boolean>>({})
  const [showHumanBtnFor, setShowHumanBtnFor] = useState<Record<string, boolean>>({})
  const [followUpsFor, setFollowUpsFor] = useState<string | null>(null)
  const [escalateOpen, setEscalateOpen] = useState(false)
  const [escalateEmail, setEscalateEmail] = useState('')
  const [escalateMessage, setEscalateMessage] = useState('')
  const [escalateSending, setEscalateSending] = useState(false)
  const [escalateError, setEscalateError] = useState<string | null>(null)
  const [lockPage, setLockPage] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const userTurnCount = messages.filter((m) => m.role === 'user').length
  const showWelcomeChips = userTurnCount === 0 && !sending && !escalateOpen

  useBodyScrollLock(lockPage)

  useEffect(() => {
    if (!open) {
      setLockPage(false)
      return
    }
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => setLockPage(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [open])

  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [open, messages, sending, downloadsByMsg, escalateOpen, showHumanBtnFor, followUpsFor])

  useEffect(() => {
    if (!open) return
    if (!escalateOpen) inputRef.current?.focus()
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (escalateOpen) setEscalateOpen(false)
        else setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, escalateOpen])

  const openEscalate = (seedMessage?: string) => {
    setEscalateError(null)
    setEscalateEmail(user?.email ?? escalateEmail)
    if (seedMessage) setEscalateMessage(seedMessage)
    else if (!escalateMessage.trim()) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user')
      if (lastUser) setEscalateMessage(lastUser.content)
    }
    setEscalateOpen(true)
  }

  const sendText = async (raw: string) => {
    const text = raw.trim()
    if (!text || sending || escalateOpen) return

    const userMsg: ChatMsg = { id: uid(), role: 'user', content: text }
    const historyForApi = [...messages.filter((m) => m.id !== 'welcome'), userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }))
    const nextUserCount = userTurnCount + 1

    setInput('')
    setFollowUpsFor(null)
    setMessages((prev) => [...prev, userMsg])
    setSending(true)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('chat-support', {
        body: { messages: historyForApi },
      })

      let reply = typeof data?.reply === 'string' ? data.reply : null
      if (fnError || !reply) {
        reply = "Couldn't reach support chat — please try again."
        try {
          const context = (fnError as { context?: Response })?.context
          if (context && typeof context.json === 'function') {
            const body = await context.json()
            if (body?.error) reply = body.error
          } else if (data?.error) {
            reply = data.error
          }
        } catch {
          /* keep generic */
        }
      }

      const assistantId = uid()
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: reply! }])
      if (Array.isArray(data?.downloads) && data.downloads.length > 0) {
        setDownloadsByMsg((prev) => ({ ...prev, [assistantId]: data.downloads as DownloadLink[] }))
      }
      if (data?.authRequired) {
        setAuthRequiredByMsg((prev) => ({ ...prev, [assistantId]: true }))
      }

      const offer =
        data?.offerHuman === true ||
        ASKED_HUMAN_RE.test(text) ||
        Boolean(fnError) ||
        isBotFailure(reply!) ||
        nextUserCount >= 3
      if (offer) {
        setShowHumanBtnFor((prev) => ({ ...prev, [assistantId]: true }))
      } else if (nextUserCount === 1) {
        setFollowUpsFor(assistantId)
      }
    } catch {
      const assistantId = uid()
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: "Couldn't reach support chat — please try again.",
        },
      ])
      setShowHumanBtnFor((prev) => ({ ...prev, [assistantId]: true }))
    } finally {
      setSending(false)
    }
  }

  const send = async (e?: FormEvent) => {
    e?.preventDefault()
    await sendText(input)
  }

  const submitEscalate = async (e: FormEvent) => {
    e.preventDefault()
    if (escalateSending) return
    setEscalateError(null)
    setEscalateSending(true)

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }))

      const { data, error: fnError } = await supabase.functions.invoke('chat-escalate', {
        body: {
          email: escalateEmail.trim(),
          message: escalateMessage.trim(),
          history,
        },
      })

      if (fnError || !data?.ok) {
        let msg = "Couldn't send your message — please try again."
        try {
          const context = (fnError as { context?: Response })?.context
          if (context && typeof context.json === 'function') {
            const body = await context.json()
            if (body?.error) msg = body.error
          } else if (data?.error) {
            msg = data.error
          }
        } catch {
          /* keep generic */
        }
        setEscalateError(msg)
        return
      }

      const email = (data.email as string) || escalateEmail.trim()
      setEscalateOpen(false)
      setEscalateMessage('')
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: `Thanks — we've received your message and will get back to you at ${email}.`,
        },
      ])
    } catch {
      setEscalateError("Couldn't send your message — please try again.")
    } finally {
      setEscalateSending(false)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open support chat"
        className={`fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full pl-3.5 pr-4 py-3 text-white shadow-lg hover:opacity-95 transition-opacity ${open ? 'invisible pointer-events-none' : ''}`}
        style={{ background: 'var(--color-accent)' }}
      >
        <MaterialIcon name="chat" size={20} />
        <span className="text-[13px] font-semibold tracking-wide">Help</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Support chat"
          className="fixed z-[60] flex flex-col bg-canvas border border-line shadow-2xl overflow-hidden
            inset-x-3 bottom-3 top-auto max-h-[min(640px,calc(100vh-1.5rem))] rounded-2xl
            sm:inset-auto sm:right-5 sm:bottom-5 sm:w-[380px] sm:h-[560px] sm:max-h-[calc(100vh-2.5rem)]"
        >
          <div
            className="flex items-center justify-between px-4 py-3.5 shrink-0 text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <LogoIcon size={36} onAccent />
              <div className="min-w-0">
                <p className="font-heading font-semibold text-[17px] leading-tight">NCA Support</p>
                <p className="text-[11px] text-white/80 mt-0.5">We're here to help</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support chat"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors"
            >
              <CloseCircleIcon size={28} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface/40">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'text-white rounded-br-md'
                      : 'bg-white border border-line text-ink rounded-bl-md'
                  }`}
                  style={m.role === 'user' ? { background: 'var(--color-accent)' } : undefined}
                >
                  {m.content}
                </div>
                {m.id === 'welcome' && showWelcomeChips && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                    {QUICK_REPLIES.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => void sendText(label)}
                        className="px-3 py-1.5 rounded-full text-[12px] font-medium border border-line bg-white text-ink hover:bg-surface transition-colors"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {downloadsByMsg[m.id]?.map((d) => (
                  <a
                    key={d.signedUrl}
                    href={d.signedUrl}
                    download={d.filename}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white hover:opacity-90"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    <MaterialIcon name="download" size={15} />
                    Download {d.title}
                  </a>
                ))}
                {followUpsFor === m.id && !escalateOpen && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => void sendText('Anything else I should know?')}
                      className="px-3 py-1.5 rounded-full text-[12px] font-medium border border-line bg-white text-ink hover:bg-surface transition-colors"
                    >
                      Anything else?
                    </button>
                  </div>
                )}
                {authRequiredByMsg[m.id] && !user && (
                  <Link
                    href="/login"
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold text-white hover:opacity-90"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    Sign in for download links
                  </Link>
                )}
                {showHumanBtnFor[m.id] && !escalateOpen && (
                  <button
                    type="button"
                    onClick={() => openEscalate()}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold border border-line bg-white text-ink hover:bg-surface transition-colors"
                  >
                    <MaterialIcon name="person" size={15} />
                    Talk to a human
                  </button>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-[12px] text-ink-soft pl-1">
                <span
                  className="h-3.5 w-3.5 rounded-full border-2 border-ink-soft/30 border-t-[var(--color-accent)] animate-spin motion-reduce:animate-none"
                  aria-hidden
                />
                Sending…
              </div>
            )}

            {escalateOpen && (
              <form
                onSubmit={submitEscalate}
                className="rounded-2xl border border-line bg-white p-3.5 space-y-2.5 shadow-sm"
              >
                <p className="text-[13px] font-semibold text-ink">Talk to a human</p>
                <p className="text-[11px] text-ink-soft leading-snug">
                  Leave your email and a short note — we'll reply by email.
                </p>
                <label className="block">
                  <span className="sr-only">Your email</span>
                  <input
                    type="email"
                    required
                    value={escalateEmail}
                    onChange={(e) => setEscalateEmail(e.target.value)}
                    placeholder="Your email"
                    disabled={escalateSending}
                    className="w-full px-3 py-2 text-[13px] border border-line rounded-xl bg-canvas focus:outline-none focus:border-ink disabled:opacity-60"
                  />
                </label>
                <label className="block">
                  <span className="sr-only">Your message</span>
                  <textarea
                    required
                    rows={3}
                    value={escalateMessage}
                    onChange={(e) => setEscalateMessage(e.target.value)}
                    placeholder="How can we help?"
                    disabled={escalateSending}
                    className="w-full resize-none px-3 py-2 text-[13px] border border-line rounded-xl bg-canvas focus:outline-none focus:border-ink disabled:opacity-60"
                  />
                </label>
                {escalateError && (
                  <p className="text-[12px] text-red-700 leading-snug">{escalateError}</p>
                )}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="submit"
                    disabled={escalateSending || !escalateEmail.trim() || escalateMessage.trim().length < 5}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 hover:opacity-90"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    {escalateSending ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <span
                          className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin motion-reduce:animate-none"
                          aria-hidden
                        />
                        Sending…
                      </span>
                    ) : (
                      'Send message'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEscalateOpen(false)}
                    disabled={escalateSending}
                    className="px-3 py-2.5 rounded-xl text-[13px] font-medium text-ink-soft hover:bg-surface"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {!escalateOpen ? (
            <form onSubmit={send} className="shrink-0 border-t border-line bg-white p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder="Ask a question…"
                  disabled={sending}
                  className="flex-1 resize-none max-h-28 min-h-[42px] px-3.5 py-2.5 text-[13px] border border-line rounded-xl bg-canvas focus:outline-none focus:border-ink disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  aria-label="Send message"
                  className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--color-accent)' }}
                >
                  <MaterialIcon name="send" size={18} />
                </button>
              </div>
            </form>
          ) : (
            <div className="shrink-0 border-t border-line bg-white px-4 py-3">
              <p className="text-[11px] text-ink-soft">Fill in the form above to reach support by email.</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
