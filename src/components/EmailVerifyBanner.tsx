'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { MaterialIcon } from '@/components/MaterialIcon'

const DISMISS_KEY = 'nca_email_verify_banner_dismissed'
const HINT_KEY = 'nca_verify_hint_email'

const NAVY = '#243B5A'

type EmailVerifyBannerProps = {
  /** `global` = full-width top bar in CustomerShell; omit for legacy inline (unused). */
  variant?: 'global'
}

/**
 * Soft, dismissible nudge when email is still unconfirmed (or right after signup).
 * Rendered sitewide via CustomerShell — never blocks checkout or other actions.
 */
export function EmailVerifyBanner({ variant = 'global' }: EmailVerifyBannerProps) {
  const { user, resendVerification } = useAuth()
  const [visible, setVisible] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!user?.email) {
      setVisible(false)
      return
    }
    const email = user.email.toLowerCase()
    const hasEmailIdentity = (user.identities ?? []).some((i) => i.provider === 'email')
    const unconfirmed = !user.email_confirmed_at
    let dismissed = false
    let hintMatch = false
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === user.id
      hintMatch = sessionStorage.getItem(HINT_KEY) === email
    } catch {
      // ignore
    }
    setVisible(Boolean(hasEmailIdentity && !dismissed && (unconfirmed || hintMatch)))
  }, [user])

  if (!visible || !user?.email) return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, user.id)
      sessionStorage.removeItem(HINT_KEY)
    } catch {
      // ignore
    }
    setVisible(false)
  }

  const resend = async () => {
    setSending(true)
    await resendVerification(user.email!)
    setSending(false)
    setSent(true)
  }

  const message = sent
    ? `Verification email sent to ${user.email}.`
    : `Verify your email (${user.email}) — optional, and never required for shopping.`

  if (variant === 'global') {
    return (
      <div
        className="border-b border-line text-[12px] tracking-[0.02em] text-white"
        style={{ background: NAVY }}
        role="status"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 max-w-site w-full mx-auto">
          <MaterialIcon name="mark_email_unread" size={16} color="rgba(255,255,255,0.85)" className="shrink-0" />
          <p className="flex-1 min-w-[12rem] text-white/90">{message}</p>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {!sent && (
              <button
                type="button"
                onClick={resend}
                disabled={sending}
                className="text-[12px] font-semibold underline underline-offset-2 text-white disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Resend'}
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="text-white/70 hover:text-white p-1"
            >
              <MaterialIcon name="close" size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-[13px]"
      role="status"
    >
      <MaterialIcon name="mark_email_unread" size={18} className="text-ink-soft shrink-0" />
      <p className="flex-1 min-w-[12rem] text-ink-soft">{message}</p>
      <div className="flex items-center gap-2 shrink-0">
        {!sent && (
          <button
            type="button"
            onClick={resend}
            disabled={sending}
            className="text-[12px] font-semibold underline underline-offset-2 disabled:opacity-50"
            style={{ color: 'var(--color-accent)' }}
          >
            {sending ? 'Sending…' : 'Resend'}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-ink-soft hover:text-ink p-1"
        >
          <MaterialIcon name="close" size={16} />
        </button>
      </div>
    </div>
  )
}
