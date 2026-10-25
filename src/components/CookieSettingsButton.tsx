'use client'

import { COOKIE_CONSENT_REOPEN_EVENT } from './CookieConsent'

/** Footer link that opens the cookie choice again, so a visitor can change their mind at any time. */
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(COOKIE_CONSENT_REOPEN_EVENT))}
      className="inline-flex min-h-11 items-center px-1 hover:text-coral md:min-h-0"
    >
      Cookie settings
    </button>
  )
}
