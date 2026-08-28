'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useBodyScrollLock } from '../../lib/useBodyScrollLock'
import { checkAuthRateLimit } from '../../lib/authRateLimit'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'
import { MaterialIcon } from '../MaterialIcon'

type Props = {
  open: boolean
  onClose: () => void
}

type Tab = 'signin' | 'signup'
type Screen = 'form' | 'verify-sent' | 'forgot' | 'forgot-sent'

export function AuthModal({ open, onClose }: Props) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resendVerification } = useAuth()
  const { showToast } = useToast()
  useBodyScrollLock(open)
  const [tab, setTab] = useState<Tab>('signin')
  const [screen, setScreen] = useState<Screen>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const passwordsTyped = password.length > 0 && confirmPassword.length > 0
  const passwordsMatch = password === confirmPassword

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const resetAndClose = () => {
    setScreen('form')
    setError(null)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setName('')
    setAgreed(false)
    setShowPassword(false)
    setShowConfirmPassword(false)
    setResetEmail('')
    onClose()
  }

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetSubmitting(true)
    const limited = await checkAuthRateLimit('reset', resetEmail)
    if (limited) {
      setResetSubmitting(false)
      showToast(limited, 'error')
      return
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: `${window.location.origin}/reset-password` })
    setResetSubmitting(false)
    if (err) { showToast("Couldn't send the reset email — please try again.", 'error'); return }
    setScreen('forgot-sent')
    showToast('If that email is registered, a reset link is on its way.', 'success')
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signInWithEmail(email, password)
    setSubmitting(false)
    if (error) return setError(error)
    resetAndClose()
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) return setError('Passwords do not match.')
    if (!agreed) return setError('Please agree to the Terms & Privacy Policy.')
    setSubmitting(true)
    const { error } = await signUpWithEmail({ name: name.trim(), email, password })
    setSubmitting(false)
    if (error) return setError(error)
    setScreen('verify-sent')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && resetAndClose()}
    >
      <div className="w-full max-w-md bg-canvas border border-line  shadow-2xl animate-[fadeIn_0.15s_ease-out]">
        {screen === 'verify-sent' ? (
          <div className="p-8 text-center">
            <p className="font-mono text-xs tracking-widest text-moss uppercase mb-3">Almost there</p>
            <h2 className="font-subheading text-2xl mb-3">Check your inbox to verify your email.</h2>
            <p className="text-ink-soft text-sm mb-6">We sent a link to {email}. Click it to activate your account.</p>
            <button
              onClick={() => resendVerification(email)}
              className="w-full py-3 border border-ink text-sm tracking-wide hover:bg-ink hover:text-canvas transition-colors mb-2"
            >
              Resend verification email
            </button>
            <button
              onClick={() => setScreen('form')}
              className="w-full py-3 text-sm text-ink-soft hover:text-ink transition-colors"
            >
              Change email
            </button>
          </div>
        ) : screen === 'forgot-sent' ? (
          <div className="p-8 text-center">
            <p className="font-mono text-xs tracking-widest text-moss uppercase mb-3">Check your inbox</p>
            <h2 className="font-subheading text-2xl mb-3">Reset link sent</h2>
            <p className="text-ink-soft text-sm mb-6">If an account exists for {resetEmail}, we've sent a link to reset your password. Check your inbox (and spam folder).</p>
            <button
              onClick={() => setScreen('form')}
              className="w-full py-3 border border-ink text-sm tracking-wide hover:bg-ink hover:text-canvas transition-colors"
            >
              Back to sign in
            </button>
          </div>
        ) : screen === 'forgot' ? (
          <div className="p-8">
            <p className="font-mono text-xs tracking-widest text-moss uppercase mb-3">Reset password</p>
            <h2 className="font-subheading text-2xl mb-3">Forgot your password?</h2>
            <p className="text-ink-soft text-sm mb-6">Enter the email on your account and we'll send you a link to reset your password.</p>
            <form onSubmit={handleResetRequest} className="space-y-3">
              <input required type="email" placeholder="Email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full px-4 py-3 border border-line bg-canvas text-sm focus:outline-none focus:border-ink" />
              <button disabled={resetSubmitting} type="submit" className="w-full py-3 bg-ink text-canvas text-sm tracking-wide hover:opacity-85 transition-opacity disabled:opacity-50 rounded-full">
                {resetSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
              <button type="button" onClick={() => setScreen('form')} className="w-full py-3 text-sm text-ink-soft hover:text-ink transition-colors">
                Back to sign in
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex border-b border-line">
              <button
                className={`flex-1 py-4 text-sm tracking-wide transition-colors ${tab === 'signin' ? 'text-ink border-b-2 border-ink font-medium' : 'text-ink-soft'}`}
                onClick={() => { setTab('signin'); setError(null) }}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-4 text-sm tracking-wide transition-colors ${tab === 'signup' ? 'text-ink border-b-2 border-ink font-medium' : 'text-ink-soft'}`}
                onClick={() => { setTab('signup'); setError(null) }}
              >
                Create Account
              </button>
              <button onClick={resetAndClose} className="px-4 text-ink-soft hover:text-ink" aria-label="Close">✕</button>
            </div>

            <div className="p-8">
              <button
                onClick={() => signInWithGoogle()}
                className="w-full py-3 border border-ink flex items-center justify-center gap-3 text-sm font-medium hover:bg-linen transition-colors mb-5"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-line" />
                <span className="text-xs text-ink-soft uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-line" />
              </div>

              {error && <p className="text-madder text-sm mb-4">{error}</p>}

              {tab === 'signin' ? (
                <form onSubmit={handleSignIn} className="space-y-3">
                  <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-line bg-canvas text-sm focus:outline-none focus:border-ink" />
                  <div className="relative">
                    <input required type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 pr-11 border border-line bg-canvas text-sm focus:outline-none focus:border-ink" />
                    <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                      <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-ink-soft">
                      <input type="checkbox" className="accent-ink" /> Remember me
                    </label>
                    <button type="button" onClick={() => setScreen('forgot')} className="text-ink-soft hover:opacity-70">Forgot password?</button>
                  </div>
                  <button disabled={submitting} type="submit" className="w-full py-3 bg-ink text-canvas text-sm tracking-wide hover:opacity-85 transition-opacity disabled:opacity-50 rounded-full">
                    {submitting ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} className="px-4 py-3 border border-line bg-canvas text-sm focus:outline-none focus:border-ink" />
                  </div>
                  <input required type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-line bg-canvas text-sm focus:outline-none focus:border-ink" />
                  <div>
                    <div className="relative">
                      <input required minLength={8} type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 pr-11 border border-line bg-canvas text-sm focus:outline-none focus:border-ink" />
                      <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                        <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                      </button>
                    </div>
                    <p className="text-[11px] text-ink-soft mt-1.5">At least 8 characters, including a number.</p>
                  </div>
                  <div>
                    <div className="relative">
                      <input required type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 pr-11 border border-line bg-canvas text-sm focus:outline-none focus:border-ink" />
                      <button type="button" onClick={() => setShowConfirmPassword((s) => !s)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink">
                        <MaterialIcon name={showConfirmPassword ? 'visibility_off' : 'visibility'} size={18} />
                      </button>
                    </div>
                    {passwordsTyped && (
                      <p className={`text-[11px] mt-1.5 ${passwordsMatch ? 'text-ink-soft' : 'text-madder'}`}>
                        {passwordsMatch ? '✓ Passwords match' : "Passwords don't match"}
                      </p>
                    )}
                  </div>
                  <label className="flex items-start gap-2 text-xs text-ink-soft">
                    <input required type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-ink mt-0.5" />
                    I agree to the Terms & Privacy Policy
                  </label>
                  <button disabled={submitting} type="submit" className="w-full py-3 bg-ink text-canvas text-sm tracking-wide hover:opacity-85 transition-opacity disabled:opacity-50 rounded-full">
                    {submitting ? 'Creating account…' : 'Create Account'}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  )
}
