'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { MaterialIcon } from '../components/MaterialIcon'
import { AuthBrandPanel } from '../components/AuthBrandPanel'
import { AuthCloseButton } from '../components/AuthCloseButton'
import { PasswordStrength, isPasswordValid } from '../components/PasswordStrength'
import { friendlyAuthError } from '../lib/authErrors'

export function ResetPassword() {
const router = useRouter()
  const { showToast } = useToast()
  // null = still checking the reset link
  const [ready, setReady] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase reads the recovery token out of the URL hash and creates a temporary session on its own. That can
    // take a moment, so a missing session is only called "expired" after a short wait.
    let timer: ReturnType<typeof setTimeout> | undefined
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      else timer = setTimeout(() => setReady((r) => (r === null ? false : r)), 2500)
    })
    return () => {
      sub.subscription.unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [])

  const passwordValid = isPasswordValid(password)
  const passwordsMatch = password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!passwordValid) { setError('Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a special character.'); return }
    if (password !== confirmPassword) { setError("Passwords don't match."); return }
    setSubmitting(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (err) { setError(friendlyAuthError(err.message)); return }
    setDone(true)
    showToast('Password updated — you can sign in with it now.', 'success')
    setTimeout(() => router.push('/login'), 2000)
  }

  if (ready === null) {
    return (
      <div className="min-h-screen flex relative">
        <AuthBrandPanel />
        <div className="flex-1 flex items-center justify-center px-6 py-16 text-center">
          <p role="status" className="text-[14px] text-ink-soft max-w-sm">Checking your reset link…</p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex relative">
        <AuthCloseButton fallbackTo="/login" />
        <AuthBrandPanel />
        <div className="flex-1 flex items-center justify-center px-6 py-16 text-center">
          <div className="max-w-sm">
            <h1 className="type-h2 text-ink mb-2">This link has expired</h1>
            <p className="text-[14px] text-ink-soft">Reset links work once and for a short time. Request a new one and we will email it right away.</p>
            <Link href="/login" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[3px] bg-primary px-6 text-[15px] font-semibold text-primary-contrast hover:bg-primary-hover">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex relative">
        <AuthCloseButton fallbackTo="/login" />
        <AuthBrandPanel />
        <div className="flex-1 flex items-center justify-center px-6 py-16 text-center">
          <p className="text-[13px] text-ink-soft max-w-sm">Your password has been updated. Taking you to sign in…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex relative">
      <AuthCloseButton fallbackTo="/login" />
      <AuthBrandPanel />
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="text-[12px] tracking-[0.15em] text-ink-soft mb-3">RESET PASSWORD</p>
          <h1 className="type-h1 text-ink mb-6">Set a new password</h1>

          {error && <p role="alert" className="text-madder text-[14px] mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-[14px] font-semibold mb-1.5">New password</label>
              <div className="relative">
                <input id="new-password" name="new-password" autoComplete="new-password" required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full min-h-11 px-4 pr-11 border border-line rounded-xl bg-canvas text-[16px] md:text-[15px] focus:outline-none focus:border-ink" />
                <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                  <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-[14px] font-semibold mb-1.5">Confirm new password</label>
              <input id="confirm-password" name="confirm-password" autoComplete="new-password" required type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full min-h-11 px-4 border border-line rounded-xl bg-canvas text-[16px] md:text-[15px] focus:outline-none focus:border-ink" />
              {confirmPassword.length > 0 && (
                <p className="text-[12px] mt-1.5" style={{ color: passwordsMatch ? 'var(--color-sale-green)' : 'var(--color-madder)' }}>
                  {passwordsMatch ? '✓ Passwords match' : "Passwords don't match"}
                </p>
              )}
            </div>
            <button disabled={submitting || !passwordValid || !passwordsMatch} type="submit" className="w-full min-h-11 text-white text-[15px] md:text-[14px] font-semibold rounded-[3px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--color-accent)' }}>
              {submitting ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
