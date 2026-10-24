'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

type Item = { id: string; title: string; pages: number | null }
type State =
  | { kind: 'loading' }
  | { kind: 'pending' }
  | { kind: 'ready'; orderNumber: string | null; items: Item[] }
  | { kind: 'expired' }
  | { kind: 'refunded' }
  | { kind: 'error' }

const POLL_MS = 2000
const POLL_MAX = 25 // ~50 s: the payment confirmation normally arrives within a few seconds

const BTN =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] bg-primary px-6 text-[15px] font-semibold text-primary-contrast transition-colors hover:bg-primary-hover disabled:opacity-60'

/** Download page for a buyer who paid without an account. `token` is the private link from checkout or email. */
export function GuestDownload({ token, justPaid = false }: { token: string; justPaid?: boolean }) {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [giveUp, setGiveUp] = useState(false)
  const attempts = useRef(0)

  const load = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('download-guest-order', { body: { token } })
    let body = data as { status?: string; orderNumber?: string | null; items?: Item[] } | null
    if (error) {
      try {
        body = await (error as { context?: Response }).context?.json()
      } catch {
        body = null
      }
    }
    switch (body?.status) {
      case 'ready':
        setState({ kind: 'ready', orderNumber: body.orderNumber ?? null, items: body.items ?? [] })
        return true
      case 'expired':
        setState({ kind: 'expired' })
        return true
      case 'refunded':
        setState({ kind: 'refunded' })
        return true
      case 'pending':
        setState({ kind: 'pending' })
        return false
      default:
        setState({ kind: 'error' })
        return true
    }
  }, [token])

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      const done = await load()
      if (!alive || done) return
      attempts.current += 1
      if (attempts.current < POLL_MAX) timer = setTimeout(tick, POLL_MS)
      else setGiveUp(true)
    }
    void tick()
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [load])

  const download = async (item: Item) => {
    setBusyId(item.id)
    setMessage(null)
    const { data, error } = await supabase.functions.invoke('download-guest-order', { body: { token, productId: item.id } })
    let body = data as { signedUrl?: string; filename?: string; error?: string } | null
    if (error) {
      try {
        body = await (error as { context?: Response }).context?.json()
      } catch {
        body = null
      }
    }
    setBusyId(null)
    if (!body?.signedUrl) {
      setMessage(body?.error ?? 'We could not start the download. Please try again.')
      return
    }
    const a = document.createElement('a')
    a.href = body.signedUrl
    a.download = body.filename ?? 'pattern.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setStarted(true)
  }

  const timedOut = state.kind === 'pending' && giveUp

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:py-14">
      <h1 className="type-h1 mb-2 text-ink">
        {state.kind === 'ready' ? (justPaid ? 'Thank you, your order is confirmed' : 'Your patterns') : 'Your download'}
      </h1>

      {(state.kind === 'loading' || (state.kind === 'pending' && !timedOut)) && (
        <p className="text-[15px] text-muted" role="status" aria-live="polite">Confirming your payment… this usually takes a few seconds.</p>
      )}

      {timedOut && (
        <p className="text-[15px] text-muted" role="status">
          Your payment is still being confirmed. Your download link is also on its way to your email. If it does not arrive in a few minutes,{' '}
          <Link href="/resend-download" className="underline">send it again</Link> or <Link href="/contact" className="underline">contact us</Link>.
        </p>
      )}

      {state.kind === 'ready' && (
        <section aria-label="Your patterns" className="mt-4 rounded-[10px] border border-border bg-surface p-4 md:p-6">
          {state.orderNumber && <p className="mb-3 text-[13px] text-muted">Order #{state.orderNumber}</p>}
          <ul className="divide-y divide-border">
            {state.items.map((it) => (
              <li key={it.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium text-ink">{it.title}</span>
                  <span className="block text-[13px] text-muted">PDF{it.pages ? ` · ${it.pages} pages` : ''}</span>
                </span>
                <button type="button" className={`${BTN} w-full sm:w-auto`} disabled={busyId === it.id} onClick={() => void download(it)}>
                  {busyId === it.id ? 'Preparing…' : 'Download PDF'}
                </button>
              </li>
            ))}
          </ul>
          {message && <p role="alert" className="mt-3 text-[14px] text-sale">{message}</p>}
          {started && !message && (
            <p role="status" className="mt-3 text-[14px] text-ink">
              Your download has started. Can&apos;t find it? Check your Downloads folder, or tap Download PDF again.
            </p>
          )}
          <p className="mt-4 text-[14px] text-muted">
            <strong className="font-semibold text-ink">Bookmark this page or check your email.</strong> We&apos;ve also emailed this link to you. It works for 30 days. Please don&apos;t share it, because anyone with the link can download your patterns.
          </p>
        </section>
      )}

      {state.kind === 'ready' && (
        <section aria-labelledby="keep-safe" className="mt-5 rounded-[5px] border border-border bg-surface-warm p-4 md:p-5">
          <h2 id="keep-safe" className="text-[16px] font-bold text-ink">Keep your patterns safe</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-muted md:text-[14px]">
            Make a free account with the email you paid with. Your patterns will always be in one place, with no link to lose.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/signup" className="inline-flex min-h-11 items-center justify-center rounded-[3px] border-[1.5px] border-primary bg-white px-6 text-[15px] font-semibold text-primary hover:bg-primary-soft">Create a free account</Link>
            <Link href="/login" className="inline-flex min-h-11 items-center px-1 text-[15px] font-semibold text-primary hover:underline">I already have one</Link>
          </div>
        </section>
      )}

      {state.kind === 'expired' && (
        <p className="text-[15px] text-muted">
          This link has expired. No problem, we&apos;ll email you a new one.
        </p>
      )}
      {state.kind === 'expired' && (
        <Link href="/resend-download" className={`${BTN} mt-4`}>Email me a new link</Link>
      )}
      {state.kind === 'refunded' && (
        <p className="text-[15px] text-muted">
          This order was refunded, so its download is no longer available. Questions? <Link href="/contact" className="underline">Contact us</Link>.
        </p>
      )}
      {state.kind === 'error' && (
        <>
          <p className="text-[15px] text-muted">This link didn&apos;t work. It may be incomplete. Try the button below, or contact us.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/resend-download" className={BTN}>Email me a new link</Link>
            <Link href="/contact" className="inline-flex min-h-11 items-center px-1 text-[15px] font-semibold text-primary hover:underline">Contact us</Link>
          </div>
        </>
      )}

      <p className="mt-8 flex flex-wrap items-center gap-x-4 text-[14px] text-muted">
        {state.kind === 'ready' ? (
          <>
            <span className="font-medium text-ink">Want more?</span>
            <Link href="/shop" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">Browse new patterns</Link>
            <Link href="/shop?price=free" className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">Free patterns</Link>
          </>
        ) : (
          <>
            <Link href="/shop" className="inline-flex min-h-11 items-center underline">Continue shopping</Link>
            <Link href="/resend-download" className="inline-flex min-h-11 items-center underline">Lost your link? Send it again</Link>
          </>
        )}
        <Link href="/contact" className="inline-flex min-h-11 items-center underline">Need help?</Link>
      </p>
    </div>
  )
}
