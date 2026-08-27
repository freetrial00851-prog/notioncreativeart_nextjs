'use client'

import { Suspense, useEffect, useRef, type RefObject } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUI } from '../context/UIContext'
import { useLoginForm } from '../lib/useLoginForm'
import { useSignUpForm } from '../lib/useSignUpForm'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { MaterialIcon } from './MaterialIcon'
import { CloseCircleIcon } from './icons'
import { GoogleIcon } from './GoogleIcon'
import { PasswordStrength } from './PasswordStrength'
import { SignupLoadingOverlay } from './SignupLoadingOverlay'

/**
 * Auth overlay: mobile (<768) bottom sheet, tablet/desktop (≥768) centered modal.
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
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const desktopCloseRef = useRef<HTMLButtonElement>(null)
  useBodyScrollLock(authSheetOpen)

  // After Google OAuth, return to the current page — not /account.
  const returnTo =
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}` || pathname || '/'
      : pathname || '/'

  const login = useLoginForm({ redirectTo: returnTo, onSignedIn: closeAuthSheet })
  const signup = useSignUpForm({ onSignedIn: closeAuthSheet, redirectTo: returnTo })

  useEffect(() => {
    if (!authSheetOpen) return
    const focusTarget = window.matchMedia('(min-width: 768px)').matches
      ? desktopCloseRef.current
      : closeButtonRef.current
    focusTarget?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAuthSheet()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [authSheetOpen, closeAuthSheet])

  useEffect(() => {
    if (authSheetOpen) return
    const t = setTimeout(() => {
      login.setForgotMode(false)
      login.setResetSent(false)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSheetOpen])

  const title = authSheetView === 'login'
    ? (login.forgotMode ? 'Reset Password' : 'Sign In')
    : (signup.screen === 'verify-sent' ? 'Verify Your Email' : 'Create Account')

  const showHeaderRegister = authSheetView === 'login' && !login.forgotMode

  const headerActions = (closeRef: RefObject<HTMLButtonElement | null>, closeClassName: string) => (
    <div className="flex items-center gap-1 shrink-0">
      {showHeaderRegister && (
        <button
          type="button"
          onClick={() => setAuthSheetView('signup')}
          className="text-[13px] font-semibold px-2.5 py-1.5 rounded-lg hover:bg-surface transition-colors"
          style={{ color: 'var(--color-accent)' }}
        >
          Register
        </button>
      )}
      <button ref={closeRef} type="button" onClick={closeAuthSheet} aria-label="Close" className={closeClassName}>
        <CloseCircleIcon size={28} />
      </button>
    </div>
  )

  const formBody = (
    <>
      {authSheetView === 'login' ? (
        login.forgotMode ? (
          login.resetSent ? (
            <div>
              <p className="text-[13px] text-ink-soft mb-6">
                If an account exists for <span className="text-ink font-medium">{login.resetEmail}</span>, we&apos;ve sent a link to reset your password. Check your inbox (and spam folder).
              </p>
              <button type="button" onClick={() => { login.setForgotMode(false); login.setResetSent(false) }} className="text-[13px] text-ink underline underline-offset-2">
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <p className="text-[13px] text-ink-soft mb-5">Enter the email on your account and we&apos;ll send you a link to reset your password.</p>
              <form onSubmit={login.handleResetRequest} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5">Email <span style={{ color: 'var(--color-madder)' }}>*</span></label>
                  <input required type="email" value={login.resetEmail} onChange={(e) => login.setResetEmail(e.target.value)} className="w-full px-4 py-3 border border-line rounded-lg bg-canvas text-[13px] focus:outline-none focus:border-ink" />
                </div>
                <button disabled={login.resetSubmitting} type="submit" className="w-full py-3.5 text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: 'var(--color-accent)' }}>
                  {login.resetSubmitting ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-[13px] text-ink-soft mt-6">
                <button type="button" onClick={() => login.setForgotMode(false)} className="text-ink underline underline-offset-2">Back to sign in</button>
              </p>
            </>
          )
        ) : (
          <>
            {login.error && <p style={{ color: 'var(--color-madder)' }} className="text-[13px] mb-4">{login.error}</p>}
            <form onSubmit={login.handleSignIn} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold mb-1.5">Email <span style={{ color: 'var(--color-madder)' }}>*</span></label>
                <input required type="email" placeholder="Enter Email" value={login.email} onChange={(e) => login.setEmail(e.target.value)} className="w-full px-4 py-3 border border-line rounded-lg bg-canvas text-[13px] focus:outline-none focus:border-ink" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold mb-1.5">Password <span style={{ color: 'var(--color-madder)' }}>*</span></label>
                <div className="relative">
                  <input required type={login.showPassword ? 'text' : 'password'} placeholder="Password" value={login.password} onChange={(e) => login.setPassword(e.target.value)} className="w-full px-4 py-3 pr-11 border border-line rounded-lg bg-canvas text-[13px] focus:outline-none focus:border-ink" />
                  <button type="button" onClick={() => login.setShowPassword((s) => !s)} aria-label={login.showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                    <MaterialIcon name={login.showPassword ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[13px] text-ink-soft cursor-pointer">
                  <input type="checkbox" checked={login.rememberMe} onChange={(e) => login.setRememberMe(e.target.checked)} className="accent-ink" />
                  Remember Me
                </label>
                <button type="button" onClick={() => login.setForgotMode(true)} className="text-[13px] underline underline-offset-2" style={{ color: 'var(--color-accent)' }}>Forgot?</button>
              </div>
              <button disabled={login.submitting} type="submit" className="w-full py-3.5 text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: 'var(--color-accent)' }}>
                {login.submitting ? 'Signing In…' : 'Login'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-line" />
              <span className="text-[12px] text-ink-soft">Or continue with</span>
              <div className="flex-1 h-px bg-line" />
            </div>

            <button
              type="button"
              onClick={() => login.signInWithGoogle(returnTo)}
              className="w-full py-3 border border-line rounded-lg flex items-center justify-center gap-3 text-[13px] font-medium hover:bg-surface transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="text-center text-[13px] text-ink-soft mt-8">
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => setAuthSheetView('signup')} className="font-semibold underline underline-offset-2" style={{ color: 'var(--color-accent)' }}>Register Now</button>
            </p>
          </>
        )
      ) : signup.screen === 'verify-sent' ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--color-accent)' }}>
            <MaterialIcon name="mark_email_read" size={28} color="#fff" />
          </div>
          <p className="text-ink-soft text-[14px] mb-1">We&apos;ve sent a verification link to</p>
          <p className="text-[14px] font-medium mb-6">{signup.email}</p>
          <p className="text-ink-soft text-[13px] mb-8">Please check your inbox and click the link to verify your account.</p>
          <a href="mailto:" className="block w-full py-3.5 text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity mb-3" style={{ background: 'var(--color-accent)' }}>
            Open Email App
          </a>
          <button type="button" onClick={() => signup.resendVerification(signup.email)} className="w-full py-3.5 border border-line rounded-lg text-[13px] font-semibold text-ink-soft hover:bg-surface transition-colors mb-3">
            Resend Email
          </button>
          <p className="text-[13px] text-ink-soft">
            Already have an account?{' '}
            <button type="button" onClick={() => setAuthSheetView('login')} className="font-semibold underline underline-offset-2" style={{ color: 'var(--color-accent)' }}>Sign in</button>
          </p>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => signup.signInWithGoogle(returnTo)}
            className="w-full py-3 border border-line rounded-lg flex items-center justify-center gap-3 text-[13px] font-medium hover:bg-surface transition-colors"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-line" />
            <span className="text-[12px] text-ink-soft">Or continue with email</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          {signup.error && <p style={{ color: 'var(--color-madder)' }} className="text-[13px] mb-4">{signup.error}</p>}
          <form onSubmit={signup.handleSignUp} noValidate className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5">Name <span style={{ color: 'var(--color-madder)' }}>*</span></label>
              <input placeholder="Your name" value={signup.name} onChange={(e) => signup.setName(e.target.value)} className={signup.inputClass(signup.attempted && !!signup.fieldErrors.name)} autoComplete="name" />
              {signup.attempted && signup.fieldErrors.name && <p className="text-[11px] text-madder mt-1.5">{signup.fieldErrors.name}</p>}
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-1.5">Email Address <span style={{ color: 'var(--color-madder)' }}>*</span></label>
              <input type="email" placeholder="Enter Email" value={signup.email} onChange={(e) => { signup.setEmail(e.target.value); signup.setEmailTaken(false) }} className={signup.inputClass((signup.attempted && !!signup.fieldErrors.email) || signup.emailTaken)} autoComplete="email" />
              {signup.emailTaken ? (
                <p className="text-[11px] text-madder mt-1.5">
                  An account with this email already exists — use another, or{' '}
                  <button type="button" onClick={() => setAuthSheetView('login')} className="underline underline-offset-2 font-semibold">sign in</button>.
                </p>
              ) : (signup.attempted && signup.fieldErrors.email && <p className="text-[11px] text-madder mt-1.5">{signup.fieldErrors.email}</p>)}
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-1.5">Password <span style={{ color: 'var(--color-madder)' }}>*</span></label>
              <div className="relative">
                <input type={signup.showPassword ? 'text' : 'password'} placeholder="Password" value={signup.password} onChange={(e) => signup.setPassword(e.target.value)} className={`${signup.inputClass(signup.attempted && !!signup.fieldErrors.password)} pr-11`} autoComplete="new-password" />
                <button type="button" onClick={() => signup.setShowPassword((s) => !s)} aria-label={signup.showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                  <MaterialIcon name={signup.showPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
              <PasswordStrength password={signup.password} />
              {signup.attempted && signup.fieldErrors.password && <p className="text-[11px] text-madder mt-1.5">{signup.fieldErrors.password}</p>}
            </div>
            <button disabled={signup.submitting} type="submit" className="w-full py-3.5 text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--color-accent)' }}>
              Create Account
            </button>
            <p className="text-[11px] text-ink-soft leading-relaxed text-center">
              By clicking Create Account or continuing with Google, you agree to the{' '}
              <Link href="/terms" onClick={closeAuthSheet} className="underline underline-offset-2 hover:text-ink">Terms of Use</Link>
              {' '}and{' '}
              <Link href="/privacy" onClick={closeAuthSheet} className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link>.
            </p>
          </form>

          <p className="text-center text-[13px] text-ink-soft mt-8">
            Already have an account?{' '}
            <button type="button" onClick={() => setAuthSheetView('login')} className="font-semibold underline underline-offset-2" style={{ color: 'var(--color-accent)' }}>Sign in</button>
          </p>
        </>
      )}
    </>
  )

  return (
    <>
      <SignupLoadingOverlay active={signup.submitting} />
      {/* ── Mobile <768: bottom sheet ── */}
      <div className="md:hidden">
        <div
          aria-hidden="true"
          onClick={closeAuthSheet}
          className={`fixed inset-0 z-50 bg-ink/30 transition-opacity duration-200 motion-reduce:transition-none ${authSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          aria-hidden={!authSheetOpen}
          inert={authSheetOpen ? undefined : true}
          className={`fixed z-50 inset-x-0 bottom-0 bg-canvas flex flex-col shadow-2xl rounded-t-2xl max-h-[92vh] transition-transform duration-300 ease-out motion-reduce:transition-none ${authSheetOpen ? 'translate-y-0' : 'translate-y-full invisible'}`}
        >
          <div className="flex items-center justify-center pt-2.5 pb-1 shrink-0">
            <div className="w-9 h-1 rounded-full bg-line" />
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-b border-line shrink-0 gap-3">
            <h2 className="font-display font-semibold text-lg min-w-0">{title}</h2>
            {headerActions(closeButtonRef, 'w-8 h-8 flex items-center justify-center hover:opacity-80')}
          </div>
          <div className="overflow-y-auto px-5 pt-5 pb-8">{formBody}</div>
        </div>
      </div>

      {/* ── Tablet + desktop ≥768: centered modal ── */}
      <div className="hidden md:block">
        <div
          aria-hidden="true"
          onClick={closeAuthSheet}
          className={`fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-200 motion-reduce:transition-none ${authSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        />
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none ${authSheetOpen ? '' : 'invisible'}`}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            aria-hidden={!authSheetOpen}
            inert={authSheetOpen ? undefined : true}
            onClick={(e) => e.stopPropagation()}
            className={`pointer-events-auto w-full max-w-md bg-canvas border border-line rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col max-h-[min(90vh,720px)] transition-opacity duration-200 motion-reduce:transition-none ${authSheetOpen ? 'opacity-100 animate-[fadeIn_0.15s_ease-out]' : 'opacity-0'}`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0 gap-3">
              <h2 className="font-display font-semibold text-xl min-w-0">{title}</h2>
              {headerActions(desktopCloseRef, 'w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface transition-colors')}
            </div>
            <div className="overflow-y-auto px-6 py-5">{formBody}</div>
          </div>
        </div>
      </div>
    </>
  )
}
