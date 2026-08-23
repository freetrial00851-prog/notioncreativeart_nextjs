'use client'

import { useRouter } from 'next/navigation'
import { CloseCircleIcon } from './icons'

/**
 * Sits top-right on every auth screen (login, signup, reset-password) so a
 * user who opened this page mid-task can back out without a browser-back
 * gesture. Prefers returning to wherever they were (redirectTo / in-app
 * history); falls back to the homepage if there's no safe place to return to
 * (e.g. auth page opened directly or in a new tab).
 */
export function AuthCloseButton({ fallbackTo = '/' }: { fallbackTo?: string }) {
  const router = useRouter()

  const handleClose = () => {
    if (window.history.state && window.history.state.idx > 0) {
      router.back()
    } else {
      router.push(fallbackTo)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClose}
      aria-label="Close"
      className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
    >
      <CloseCircleIcon size={32} />
    </button>
  )
}
