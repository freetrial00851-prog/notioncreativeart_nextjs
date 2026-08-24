'use client'

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { MaterialIcon } from './MaterialIcon'
import { CloseCircleIcon } from './icons'

type Role = 'user' | 'assistant'
type ChatMsg = { id: string; role: Role; content: string }
type DownloadLink = { title: string; signedUrl: string; filename: string }

const WELCOME =
  "Hi — I'm the NCA support assistant. Ask about downloads, accounts, or refunds. Need a fresh download link? Send your order number and the email used at checkout."

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function SupportChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME },
  ])
  const [downloadsByMsg, setDownloadsByMsg] = useState<Record<string, DownloadLink[]>>({})
  const [lockPage, setLockPage] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
  }, [open, messages, sending, downloadsByMsg])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const send = async (e?: FormEvent) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const userMsg: ChatMsg = { id: uid(), role: 'user', content: text }
    const historyForApi = [...messages.filter((m) => m.id !== 'welcome'), userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }))

    setInput('')
    setMessages((prev) => [...prev, userMsg])
    setSending(true)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('chat-support', {
        body: { messages: historyForApi },
      })

      let reply = typeof data?.reply === 'string' ? data.reply : null
      if (fnError || !reply) {
        reply = "Couldn't reach support chat — please try again, or use the Contact page."
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
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: "Couldn't reach support chat — please try again, or use the Contact page.",
        },
      ])
    } finally {
      setSending(false)
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
      {/* Floating launcher */}
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

      {/* Panel */}
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
            <div className="min-w-0">
              <p className="font-heading font-semibold text-[17px] leading-tight">NCA Support</p>
              <p className="text-[11px] text-white/80 mt-0.5">FAQ answers · order download help</p>
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
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-[12px] text-ink-soft pl-1">
                <span
                  className="h-3.5 w-3.5 rounded-full border-2 border-ink-soft/30 border-t-[var(--color-accent)] animate-spin"
                  aria-hidden
                />
                Thinking…
              </div>
            )}
          </div>

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
            <p className="text-[10px] text-ink-soft mt-2 px-0.5 leading-snug">
              For order downloads, include both your order number and checkout email.
            </p>
          </form>
        </div>
      )}
    </>
  )
}
