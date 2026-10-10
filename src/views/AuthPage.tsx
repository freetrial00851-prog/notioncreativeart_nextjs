'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLoginForm } from '../lib/useLoginForm'
import { useSignUpForm } from '../lib/useSignUpForm'
import { AuthPanel, type AuthView } from '../components/auth/AuthPanel'
import { SignupLoadingOverlay } from '../components/SignupLoadingOverlay'

/**
 * Single page serving both /login and /signup. Which form shows first
 * depends on which route was entered, but switching between "Sign In" and
 * "Create Account" from within the page is local state only — never a
 * route navigation. That matters: if toggling pushed a real /login <-> /signup
 * navigation, the browser history would grow one entry per toggle, and the
 * close (X) button — which just steps back one history entry — would land
 * on whichever auth view you'd last toggled through instead of fully
 * exiting back to the page you started from. Keeping the toggle local means
 * there's exactly one history entry for the whole auth flow, so closing
 * always exits cleanly regardless of which view is showing.
 */
export function AuthPage() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') || '/account'
  const [view, setView] = useState<AuthView>(() => (pathname === '/signup' ? 'signup' : 'login'))

  const login = useLoginForm({ redirectTo, onSignedIn: () => router.push(redirectTo) })
  const signup = useSignUpForm({ redirectTo })

  const closeFallback = redirectTo !== '/account' ? redirectTo : '/'
  const handleClose = () => {
    if (window.history.state && window.history.state.idx > 0) router.back()
    else router.push(closeFallback)
  }

  return (
    <main className="min-h-dvh bg-background md:flex md:items-start md:justify-center md:bg-surface-warm md:px-6 md:py-12">
      <SignupLoadingOverlay active={view === 'signup' && signup.submitting} />
      <div className="w-full md:my-auto md:max-w-[560px] md:rounded-[24px] md:border md:border-border md:bg-background md:shadow-[0_12px_40px_rgba(22,24,29,0.08)]">
        <AuthPanel
          view={view}
          onViewChange={setView}
          login={login}
          signup={signup}
          oauthReturnTo={redirectTo}
          titleId="auth-page-title"
          headingLevel="h1"
          onClose={handleClose}
          notice={searchParams?.get('error') === 'auth' ? 'That sign-in link did not complete. Please try again.' : null}
        />
      </div>
    </main>
  )
}
