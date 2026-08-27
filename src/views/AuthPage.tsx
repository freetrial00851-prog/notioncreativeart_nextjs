'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLoginForm } from '../lib/useLoginForm'
import { useSignUpForm } from '../lib/useSignUpForm'
import { MaterialIcon } from '../components/MaterialIcon'
import { GoogleIcon } from '../components/GoogleIcon'
import { AuthBrandPanel } from '../components/AuthBrandPanel'
import { AuthCloseButton } from '../components/AuthCloseButton'
import { PasswordStrength } from '../components/PasswordStrength'

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
  const [view, setView] = useState<'login' | 'signup'>(() => (pathname === '/signup' ? 'signup' : 'login'))

  const login = useLoginForm({ redirectTo, onSignedIn: () => router.push(redirectTo) })
  const signup = useSignUpForm({ redirectTo })

  const closeFallback = redirectTo !== '/account' ? redirectTo : '/'

  if (view === 'login' && login.forgotMode) {
    return (
      <div className="min-h-screen flex relative">
        <AuthCloseButton fallbackTo={closeFallback} />
        <AuthBrandPanel />
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-md">
            <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">RESET PASSWORD</p>
            <h1 className="font-display font-semibold text-3xl mb-8">Forgot your password?</h1>

            {login.resetSent ? (
              <div>
                <p className="text-[13px] text-ink-soft mb-8">
                  If an account exists for <span className="text-ink font-medium">{login.resetEmail}</span>, we've sent a link to reset your password. Check your inbox (and spam folder).
                </p>
                <button onClick={() => { login.setForgotMode(false); login.setResetSent(false) }} className="text-[12px] text-ink underline underline-offset-2">
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <p className="text-[13px] text-ink-soft mb-6">Enter the email on your account and we'll send you a link to reset your password.</p>
                <form onSubmit={login.handleResetRequest} className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-semibold mb-1.5">Email <span style={{ color: 'var(--color-madder)' }}>*</span></label>
                    <input required type="email" value={login.resetEmail} onChange={(e) => login.setResetEmail(e.target.value)} className="w-full px-4 py-3 border border-line rounded-lg bg-canvas text-[13px] focus:outline-none focus:border-ink" />
                  </div>
                  <button disabled={login.resetSubmitting} type="submit" className="w-full py-3.5 text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: 'var(--color-accent)' }}>
                    {login.resetSubmitting ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>
                <p className="text-[13px] text-ink-soft mt-8">
                  <button onClick={() => login.setForgotMode(false)} className="text-ink underline underline-offset-2">Back to sign in</button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (view === 'signup' && signup.screen === 'verify-sent') {
    return (
      <div className="min-h-screen flex relative">
        <AuthCloseButton fallbackTo={closeFallback} />
        <AuthBrandPanel />
        <div className="flex-1 flex items-center justify-center px-6 py-16 text-center">
          <div className="w-full max-w-md">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--color-accent)' }}>
              <MaterialIcon name="mark_email_read" size={28} color="#fff" />
            </div>
            <h1 className="font-display font-semibold text-2xl mb-3">Verify your email</h1>
            <p className="text-ink-soft text-[14px] mb-1">We've sent a verification link to</p>
            <p className="text-[14px] font-medium mb-6">{signup.email}</p>
            <p className="text-ink-soft text-[13px] mb-8">Please check your inbox and click the link to verify your account.</p>
            <a href="mailto:" className="block w-full py-3.5 text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity mb-3" style={{ background: 'var(--color-accent)' }}>
              Open Email App
            </a>
            <button onClick={() => signup.resendVerification(signup.email)} className="w-full py-3.5 border border-line rounded-lg text-[13px] font-semibold text-ink-soft hover:bg-surface transition-colors mb-3">
              Resend Email
            </button>
            <p className="text-[13px] text-ink-soft">
              Already have an account? <button onClick={() => setView('login')} className="font-semibold underline underline-offset-2" style={{ color: 'var(--color-accent)' }}>Sign in</button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex relative">
      <AuthCloseButton fallbackTo={closeFallback} />
      <AuthBrandPanel />
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {view === 'login' ? (
            <>
              <h1 className="font-display font-semibold text-3xl mb-8">Login Your Account</h1>

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
                  <button type="button" onClick={() => login.setForgotMode(true)} className="text-[13px] underline underline-offset-2" style={{ color: 'var(--color-accent)' }}>Forgot password? Reset Now</button>
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
                onClick={() => login.signInWithGoogle(redirectTo)}
                className="w-full py-3 border border-line rounded-lg flex items-center justify-center gap-3 text-[13px] font-medium hover:bg-surface transition-colors"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <p className="text-center text-[13px] text-ink-soft mt-8">
                Don't have an account? <button onClick={() => setView('signup')} className="font-semibold underline underline-offset-2" style={{ color: 'var(--color-accent)' }}>Register Now</button>
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display font-semibold text-3xl mb-8">Create Your Account</h1>

              <button
                type="button"
                onClick={() => signup.signInWithGoogle(redirectTo)}
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
                      <button type="button" onClick={() => setView('login')} className="underline underline-offset-2 font-semibold">sign in</button>.
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
                  {signup.submitting ? 'Creating Account…' : 'Create Account'}
                </button>
                <p className="text-[11px] text-ink-soft leading-relaxed text-center">
                  By clicking Create Account or continuing with Google, you agree to the{' '}
                  <Link href="/terms" className="underline underline-offset-2 hover:text-ink">Terms of Use</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link>.
                </p>
              </form>

              <p className="text-center text-[13px] text-ink-soft mt-8">
                Already have an account? <button onClick={() => setView('login')} className="font-semibold underline underline-offset-2" style={{ color: 'var(--color-accent)' }}>Sign in</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
