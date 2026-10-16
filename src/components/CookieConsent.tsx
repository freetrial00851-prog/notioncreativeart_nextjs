'use client'

import { useEffect, useState } from 'react'

export const COOKIE_CONSENT_KEY = 'nca_cookie_consent'
export const COOKIE_CONSENT_EVENT = 'nca-cookie-consent-changed'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!stored) setVisible(true)
  }, [])

  const choose = (value: 'accepted' | 'rejected') => {
    localStorage.setItem(COOKIE_CONSENT_KEY, value)
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-canvas border-t border-line px-5 py-4 md:px-8">
      <div className="max-w-site w-full mx-auto flex flex-col md:flex-row items-center gap-4">
        <p className="text-[12px] text-ink-soft flex-1 leading-relaxed">
          We use cookies to understand how visitors use this site and improve it. See our{' '}
          <a href="/privacy" className="inline-block py-2 underline underline-offset-2 hover:text-ink">Privacy Policy</a> for details.
        </p>
        <div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto md:shrink-0">
          <button
            onClick={() => choose('rejected')}
            className="min-h-11 px-6 border border-ink text-[12px] tracking-[0.1em] rounded-full hover:bg-surface transition-colors"
          >
            REJECT
          </button>
          <button
            onClick={() => choose('accepted')}
            className="min-h-11 px-6 bg-ink text-canvas text-[12px] tracking-[0.1em] rounded-full hover:opacity-85 transition-opacity"
          >
            ACCEPT
          </button>
        </div>
      </div>
    </div>
  )
}
