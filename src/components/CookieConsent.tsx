'use client'

import { useEffect, useRef, useState } from 'react'

export const COOKIE_CONSENT_KEY = 'nca_cookie_consent'
export const COOKIE_CONSENT_EVENT = 'nca-cookie-consent-changed'
export const COOKIE_CONSENT_REOPEN_EVENT = 'nca-cookie-consent-reopen'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!stored) setVisible(true)
    const reopen = () => setVisible(true)
    window.addEventListener(COOKIE_CONSENT_REOPEN_EVENT, reopen)
    return () => window.removeEventListener(COOKIE_CONSENT_REOPEN_EVENT, reopen)
  }, [])

  // Publish the banner height as --cookie-h so fixed UI (mobile buy bar, chat button) sits above it
  // instead of being covered while the visitor has not chosen yet.
  useEffect(() => {
    const root = document.documentElement
    const el = barRef.current
    if (!visible || !el) {
      root.style.removeProperty('--cookie-h')
      return
    }
    const sync = () => root.style.setProperty('--cookie-h', `${el.offsetHeight}px`)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.removeProperty('--cookie-h')
    }
  }, [visible])

  const choose = (value: 'accepted' | 'rejected') => {
    localStorage.setItem(COOKIE_CONSENT_KEY, value)
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      ref={barRef}
      role="region"
      aria-label="Cookie preferences"
      className="fixed bottom-0 left-0 right-0 z-[60] bg-canvas border-t border-line px-4 py-2 md:px-8 md:py-4"
    >
      <div className="max-w-site w-full mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4">
        <p className="text-[13px] text-ink-soft flex-1 leading-snug md:leading-relaxed">
          We use cookies for site analytics and to measure Pinterest ads, only if you accept. Declining does not affect shopping.{' '}
          <a href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</a>
        </p>
        <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:shrink-0 md:gap-3">
          <button
            onClick={() => choose('rejected')}
            className="min-h-11 px-6 bg-ink text-canvas text-[12px] tracking-[0.1em] rounded-[3px] hover:opacity-85 transition-opacity"
          >
            REJECT
          </button>
          <button
            onClick={() => choose('accepted')}
            className="min-h-11 px-6 bg-ink text-canvas text-[12px] tracking-[0.1em] rounded-[3px] hover:opacity-85 transition-opacity"
          >
            ACCEPT
          </button>
        </div>
      </div>
    </div>
  )
}
