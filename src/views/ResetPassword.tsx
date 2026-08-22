'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { MaterialIcon } from '../components/MaterialIcon'
import { AuthBrandPanel } from '../components/AuthBrandPanel'
import { AuthCloseButton } from '../components/AuthCloseButton'
import { PasswordStrength, isPasswordValid } from '../components/PasswordStrength'

export function ResetPassword() {
const router = useRouter()
  const { showToast } = useToast()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase reads the recovery token out of the URL hash and creates a
    // temporary session automatically — this just confirms one exists before
    // showing the form, since a stale/expired link would leave no session.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session))
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
    if (err) { setError(err.message); return }
    setDone(true)
    showToast('Password updated — you can sign in with it now.', 'success')
    setTimeout(() => router.push('/login'), 2000)
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex relative">
        <AuthCloseButton fallbackTo="/login" />
        <AuthBrandPanel />
        <div className="flex-1 flex items-center justify-center px-6 py-16 text-center">
          <p className="text-[13px] text-ink-soft max-w-sm">This reset link is invalid or has expired — request a new one from the sign-in page.</p>
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
          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">RESET PASSWORD</p>
          <h1 className="font-display font-semibold text-3xl mb-8">Set a new password</h1>

          {error && <p className="text-madder text-[13px] mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5">New Password</label>
              <div className="relative">
                <input required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 pr-11 border border-line rounded-lg bg-canvas text-[13px] focus:outline-none focus:border-ink" />
                <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                  <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-1.5">Confirm New Password</label>
              <input required type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border border-line rounded-lg bg-canvas text-[13px] focus:outline-none focus:border-ink" />
              {confirmPassword.length > 0 && (
                <p className="text-[11px] mt-1.5" style={{ color: passwordsMatch ? 'var(--color-sale-green)' : 'var(--color-madder)' }}>
                  {passwordsMatch ? '✓ Passwords match' : "Passwords don't match"}
                </p>
              )}
            </div>
            <button disabled={submitting || !passwordValid || !passwordsMatch} type="submit" className="w-full py-3.5 text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--color-accent)' }}>
              {submitting ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
