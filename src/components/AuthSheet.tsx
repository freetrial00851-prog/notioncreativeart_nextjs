'use client'

import { Suspense, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useUI } from '../context/UIContext'
import { useLoginForm } from '../lib/useLoginForm'
import { useSignUpForm } from '../lib/useSignUpForm'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { useFocusTrap } from '../lib/useFocusTrap'
import { AuthPanel } from './auth/AuthPanel'
import { SignupLoadingOverlay } from './SignupLoadingOverlay'

/**
 * Auth overlay: full screen on mobile (<768), centered modal on tablet/desktop.
 * Shares validation/submission via useLoginForm / useSignUpForm with /login.
 * Closing returns the user to the page they were already on (no redirect).
 *
 * Suspense is required because useSignUpForm reads useSearchParams(); without a
 * boundary here, every CustomerShell page fails static prerender.
 */
export function AuthSheet() {
  return (
    <Suspense fallback={null}>
      <AuthSheetInner />
    </Suspense>
  )
}

function AuthSheetInner() {
  const { authSheetOpen, authSheetView, setAuthSheetView, closeAuthSheet } = useUI()
  const pathname = usePathname()
  const dialogRef = useRef<HTMLDivElement>(null)
  useBodyScrollLock(authSheetOpen)
  useFocusTrap(dialogRef, authSheetOpen, { onEscape: closeAuthSheet })

  // After Google OAuth, return to the current page — not /account.
  const returnTo =
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}` || pathname || '/'
      : pathname || '/'

  const login = useLoginForm({ redirectTo: returnTo, onSignedIn: closeAuthSheet })
  const signup = useSignUpForm({ onSignedIn: closeAuthSheet, redirectTo: returnTo })

  useEffect(() => {
    if (authSheetOpen) return
    const t = setTimeout(() => {
      login.setForgotMode(false)
      login.setResetSent(false)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSheetOpen])

  return (
    <>
      <SignupLoadingOverlay active={signup.submitting} />
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-50 hidden md:block bg-ink/40 backdrop-blur-[2px] transition-opacity duration-200 motion-reduce:transition-none ${
          authSheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <div
        className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain md:flex md:items-start md:justify-center md:px-6 md:py-10 ${
          authSheetOpen ? '' : 'invisible pointer-events-none'
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeAuthSheet()
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-sheet-title"
          aria-hidden={!authSheetOpen}
          inert={authSheetOpen ? undefined : true}
          tabIndex={-1}
          className={`min-h-full w-full bg-background outline-none transition-opacity duration-200 motion-reduce:transition-none
            md:my-auto md:min-h-0 md:max-w-[560px] md:rounded-[24px] md:border md:border-border md:shadow-[0_24px_64px_rgba(22,24,29,0.22)]
            ${authSheetOpen ? 'opacity-100' : 'opacity-0'}`}
        >
          <AuthPanel
            view={authSheetView}
            onViewChange={setAuthSheetView}
            login={login}
            signup={signup}
            oauthReturnTo={returnTo}
            titleId="auth-sheet-title"
            onClose={closeAuthSheet}
            onNavigate={closeAuthSheet}
          />
        </div>
      </div>
    </>
  )
}
