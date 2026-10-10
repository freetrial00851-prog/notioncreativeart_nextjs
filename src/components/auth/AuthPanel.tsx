'use client'

import { useId, type ReactNode } from 'react'
import Link from 'next/link'
import { useCart } from '../../context/CartContext'
import type { useLoginForm } from '../../lib/useLoginForm'
import type { useSignUpForm } from '../../lib/useSignUpForm'
import { MaterialIcon } from '../MaterialIcon'
import { GoogleIcon } from '../GoogleIcon'
import { PasswordStrength } from '../PasswordStrength'

export type AuthView = 'login' | 'signup'

/** Set NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true once the Google provider is configured in Supabase. */
export const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'

const PASSWORD_HINT = 'At least 8 characters, with an uppercase letter, a lowercase letter and a special character.'

const INPUT =
  'block w-full min-h-[52px] rounded-xl border bg-surface px-4 text-[16px] md:text-[15px] text-ink placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-primary/25'

function inputClass(hasError: boolean) {
  return `${INPUT} ${hasError ? 'border-error focus:border-error' : 'border-border focus:border-primary'}`
}

type Props = {
  view: AuthView
  onViewChange: (view: AuthView) => void
  login: ReturnType<typeof useLoginForm>
  signup: ReturnType<typeof useSignUpForm>
  /** Where Google OAuth should land after /auth/callback. */
  oauthReturnTo: string
  titleId: string
  headingLevel?: 'h1' | 'h2'
  onClose?: () => void
  /** Called before following in-panel links (Terms, Privacy) so an overlay can close. */
  onNavigate?: () => void
  notice?: string | null
}

/**
 * Sign in / Create account UI shared by the AuthSheet overlay and the
 * /login + /signup pages. State and submission live in useLoginForm /
 * useSignUpForm; this only renders them.
 */
export function AuthPanel({
  view,
  onViewChange,
  login,
  signup,
  oauthReturnTo,
  titleId,
  headingLevel = 'h2',
  onClose,
  onNavigate,
  notice,
}: Props) {
  const { items } = useCart()
  const cartLines = items.filter((i) => i.product)
  const cartTotal = cartLines.reduce((sum, i) => sum + (i.product?.price ?? 0), 0)

  const forgot = view === 'login' && login.forgotMode
  const verifySent = view === 'signup' && signup.screen === 'verify-sent'
  const main = !forgot && !verifySent

  let title: string
  let subtitle: string
  if (forgot) {
    title = login.resetSent ? 'Check your email' : 'Reset your password'
    subtitle = login.resetSent
      ? 'If an account exists for that email, a reset link is on its way.'
      : 'Enter the email on your account and we will send you a link to reset your password.'
  } else if (verifySent) {
    title = 'Verify your email'
    subtitle = 'We sent a verification link to your inbox.'
  } else if (view === 'login') {
    title = 'Welcome back'
    subtitle = 'Sign in to check out and get your downloads.'
  } else {
    title = 'Create your account'
    subtitle = 'Free, takes a minute. Your downloads will always be here.'
  }

  const Heading = headingLevel

  return (
    <div className="relative px-5 pt-8 pb-8 md:px-10 md:pt-10 md:pb-9">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-2 top-2 md:right-4 md:top-4 touch-target inline-flex items-center justify-center rounded-full text-ink hover:bg-surface-warm"
        >
          <MaterialIcon name="close" size={24} />
        </button>
      )}

      <p className="text-center text-[22px] md:text-[24px] font-bold leading-none text-primary" style={{ fontFamily: 'var(--font-logo)' }}>
        Notion Creative Art
      </p>
      <Heading id={titleId} className="mt-5 text-center font-heading text-[32px] md:text-[38px] font-bold leading-tight text-ink">
        {title}
      </Heading>
      <p className="mx-auto mt-2 max-w-[400px] text-center text-[15px] md:text-[16px] leading-snug text-muted">{subtitle}</p>

      {main && (
        <div role="group" aria-label="Choose sign in or create account" className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-surface-warm p-1.5">
          {(['login', 'signup'] as const).map((v) => {
            const selected = view === v
            return (
              <button
                key={v}
                type="button"
                aria-pressed={selected}
                onClick={() => onViewChange(v)}
                className={`min-h-11 rounded-full px-3 text-[15px] md:text-[16px] font-semibold transition-colors ${
                  selected ? 'bg-surface text-primary shadow-[0_1px_3px_rgba(22,24,29,0.12)]' : 'text-muted hover:text-ink'
                }`}
              >
                {v === 'login' ? 'Sign in' : 'Create account'}
              </button>
            )
          })}
        </div>
      )}

      {main && cartLines.length > 0 && (
        <p className="mt-4 flex items-center gap-2.5 rounded-xl bg-primary-soft px-4 py-3 text-[14px] md:text-[15px] font-semibold text-primary">
          <MaterialIcon name="shopping_bag" size={18} className="shrink-0" />
          <span>
            Your cart is saved: {cartLines.length} {cartLines.length === 1 ? 'pattern' : 'patterns'} · ${cartTotal.toFixed(2)}
          </span>
        </p>
      )}

      {main && notice && (
        <p role="alert" className="mt-4 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-[14px] text-error">
          {notice}
        </p>
      )}

      <div className="mt-5">
        {forgot ? (
          <ForgotPassword login={login} />
        ) : verifySent ? (
          <VerifySent signup={signup} onSignIn={() => onViewChange('login')} />
        ) : (
          <>
            {GOOGLE_AUTH_ENABLED && (
              <>
                <button
                  type="button"
                  onClick={() => void login.signInWithGoogle(oauthReturnTo)}
                  className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-full border border-border bg-surface px-5 text-[16px] md:text-[17px] font-semibold text-ink hover:bg-surface-warm transition-colors"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>
                <div className="my-5 flex items-center gap-3" aria-hidden>
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-[14px] text-muted">or use your email</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}
            {view === 'login' ? (
              <SignInForm login={login} />
            ) : (
              <SignUpForm signup={signup} onSignIn={() => onViewChange('login')} onNavigate={onNavigate} />
            )}
          </>
        )}
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-[14px] text-muted">
        <MaterialIcon name="lock" size={15} color="var(--color-free)" className="shrink-0" />
        Your downloads are saved to your account.
      </p>
    </div>
  )
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: ReactNode
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[15px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-[13px] font-medium text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] text-error">
          {error}
        </p>
      )}
    </div>
  )
}

function PasswordInput({
  id,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
  hasError,
  describedBy,
  required,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder: string
  autoComplete: 'current-password' | 'new-password'
  hasError: boolean
  describedBy?: string
  required?: boolean
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className={`${inputClass(hasError)} pr-14`}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className="absolute right-1 top-1/2 -translate-y-1/2 touch-target inline-flex items-center justify-center rounded-full text-muted hover:text-ink"
      >
        <MaterialIcon name={show ? 'visibility_off' : 'visibility'} size={20} />
      </button>
    </div>
  )
}

function SubmitButton({ busy, children, busyLabel }: { busy: boolean; children: ReactNode; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy || undefined}
      className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-primary px-6 text-[17px] font-semibold text-primary-contrast hover:bg-primary-hover disabled:opacity-60 disabled:cursor-wait transition-colors"
    >
      {busy ? busyLabel : children}
    </button>
  )
}

function SignInForm({ login }: { login: ReturnType<typeof useLoginForm> }) {
  const uid = useId()
  const emailId = `${uid}-email`
  const passwordId = `${uid}-password`
  const errorId = `${uid}-error`
  return (
    <form onSubmit={login.handleSignIn} className="space-y-4" aria-describedby={login.error ? errorId : undefined}>
      {login.error && (
        <p id={errorId} role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-[14px] text-error">
          {login.error}
        </p>
      )}
      <Field id={emailId} label="Email">
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={login.email}
          onChange={(e) => login.setEmail(e.target.value)}
          className={inputClass(false)}
        />
      </Field>
      <Field id={passwordId} label="Password">
        <PasswordInput
          id={passwordId}
          value={login.password}
          onChange={login.setPassword}
          show={login.showPassword}
          onToggle={() => login.setShowPassword((s) => !s)}
          placeholder="Your password"
          autoComplete="current-password"
          hasError={false}
          required
        />
      </Field>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            login.setResetEmail(login.email)
            login.setForgotMode(true)
          }}
          className="inline-flex min-h-11 items-center px-1 text-[15px] font-semibold text-primary hover:underline underline-offset-2"
        >
          Forgot password?
        </button>
      </div>
      <SubmitButton busy={login.submitting} busyLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  )
}

function SignUpForm({
  signup,
  onSignIn,
  onNavigate,
}: {
  signup: ReturnType<typeof useSignUpForm>
  onSignIn: () => void
  onNavigate?: () => void
}) {
  const uid = useId()
  const nameId = `${uid}-name`
  const emailId = `${uid}-email`
  const passwordId = `${uid}-password`
  const newsletterId = `${uid}-newsletter`
  const errorId = `${uid}-error`
  const emailError = signup.emailTaken ? (
    <>
      An account with this email already exists. Use another email, or{' '}
      <button type="button" onClick={onSignIn} className="font-semibold underline underline-offset-2">
        sign in
      </button>
      .
    </>
  ) : signup.attempted ? signup.fieldErrors.email : null
  const passwordError = signup.attempted ? signup.fieldErrors.password : null

  return (
    <form onSubmit={signup.handleSignUp} noValidate className="space-y-4" aria-describedby={signup.error ? errorId : undefined}>
      {signup.error && (
        <p id={errorId} role="alert" className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-[14px] text-error">
          {signup.error}
        </p>
      )}
      <Field id={nameId} label="Name (optional)">
        <input
          id={nameId}
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={signup.name}
          onChange={(e) => signup.setName(e.target.value)}
          className={inputClass(false)}
        />
      </Field>
      <Field id={emailId} label="Email" error={emailError}>
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={signup.email}
          onChange={(e) => {
            signup.setEmail(e.target.value)
            signup.setEmailTaken(false)
          }}
          aria-invalid={!!emailError || undefined}
          aria-describedby={emailError ? `${emailId}-error` : undefined}
          className={inputClass(!!emailError)}
        />
      </Field>
      <Field id={passwordId} label="Password" hint={PASSWORD_HINT} error={passwordError}>
        <PasswordInput
          id={passwordId}
          value={signup.password}
          onChange={signup.setPassword}
          show={signup.showPassword}
          onToggle={() => signup.setShowPassword((s) => !s)}
          placeholder="Create a password"
          autoComplete="new-password"
          hasError={!!passwordError}
          describedBy={`${passwordId}-hint${passwordError ? ` ${passwordId}-error` : ''}`}
          required
        />
        <PasswordStrength password={signup.password} />
      </Field>
      <label htmlFor={newsletterId} className="flex min-h-11 cursor-pointer items-start gap-3 text-[15px] leading-snug text-muted">
        <input
          id={newsletterId}
          type="checkbox"
          checked={signup.newsletterOptIn}
          onChange={(e) => signup.setNewsletterOptIn(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border accent-primary"
        />
        <span>Send me news about new patterns and offers (optional)</span>
      </label>
      <SubmitButton busy={signup.submitting} busyLabel="Creating account…">
        Create account
      </SubmitButton>
      <p className="text-center text-[13px] leading-relaxed text-muted">
        By creating an account you agree to our{' '}
        <Link href="/terms" onClick={onNavigate} className="text-primary underline underline-offset-2">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" onClick={onNavigate} className="text-primary underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  )
}

function ForgotPassword({ login }: { login: ReturnType<typeof useLoginForm> }) {
  const uid = useId()
  const emailId = `${uid}-reset-email`
  const back = (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={() => {
          login.setForgotMode(false)
          login.setResetSent(false)
        }}
        className="inline-flex min-h-11 items-center px-2 text-[15px] font-semibold text-primary hover:underline underline-offset-2"
      >
        Back to sign in
      </button>
    </div>
  )

  if (login.resetSent) {
    return (
      <div>
        <p className="rounded-xl bg-success-bg px-4 py-3 text-[14px] text-ink">
          If an account exists for <span className="font-semibold">{login.resetEmail}</span>, we have sent a link to reset your
          password. Check your inbox and spam folder.
        </p>
        {back}
      </div>
    )
  }

  return (
    <form onSubmit={login.handleResetRequest} className="space-y-4">
      <Field id={emailId} label="Email">
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={login.resetEmail}
          onChange={(e) => login.setResetEmail(e.target.value)}
          className={inputClass(false)}
        />
      </Field>
      <SubmitButton busy={login.resetSubmitting} busyLabel="Sending…">
        Send reset link
      </SubmitButton>
      {back}
    </form>
  )
}

function VerifySent({ signup, onSignIn }: { signup: ReturnType<typeof useSignUpForm>; onSignIn: () => void }) {
  return (
    <div className="text-center">
      <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft" aria-hidden>
        <MaterialIcon name="mark_email_read" size={28} color="var(--color-primary)" />
      </span>
      <p className="text-[15px] text-muted">We sent a verification link to</p>
      <p className="mt-1 text-[15px] font-semibold text-ink break-all">{signup.email}</p>
      <p className="mt-4 text-[14px] text-muted">Open the link in that email to verify your account.</p>
      <div className="mt-6 space-y-3">
        <a
          href="mailto:"
          className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-primary px-6 text-[16px] font-semibold text-primary-contrast hover:bg-primary-hover"
        >
          Open email app
        </a>
        <button
          type="button"
          onClick={() => void signup.resendVerification(signup.email)}
          className="flex min-h-[52px] w-full items-center justify-center rounded-full border border-border bg-surface px-6 text-[16px] font-semibold text-ink hover:bg-surface-warm"
        >
          Resend email
        </button>
      </div>
      <p className="mt-5 text-[14px] text-muted">
        Already verified?{' '}
        <button type="button" onClick={onSignIn} className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-2">
          Sign in
        </button>
      </p>
    </div>
  )
}
