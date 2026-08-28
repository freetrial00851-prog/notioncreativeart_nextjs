'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isPasswordValid } from '../components/PasswordStrength'
import { waitForGuestMerge } from './guestStorage'
import type { SignupSetupPhase } from '../components/SignupLoadingOverlay'

/** Let the bar reach 100% and all step checks render before dismissing. */
const FINISH_HOLD_MS = 550

type Options = {
  /** Called when signup creates an immediate session (autoconfirm on). */
  onSignedIn?: () => void
  redirectTo?: string
}

/**
 * State and handlers for create-account. Shared by /signup and AuthSheet.
 */
export function useSignUpForm(options: Options = {}) {
  const { signInWithGoogle, signUpWithEmail, resendVerification } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = options.redirectTo || searchParams?.get('redirect') || '/'

  const [screen, setScreen] = useState<'form' | 'verify-sent'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [setupPhase, setSetupPhase] = useState<SignupSetupPhase>('idle')
  const [attempted, setAttempted] = useState(false)
  const [emailTaken, setEmailTaken] = useState(false)

  const emailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordValid = isPasswordValid(password)

  const fieldErrors = {
    name: name.trim() === '' ? 'Name is required.' : null,
    email: email.trim() === '' ? 'Email address is required.' : (!emailFormatValid ? 'Enter a valid email address.' : null),
    password: !passwordValid ? 'Password doesn\u2019t meet the requirements above.' : null,
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    setError(null)
    if (Object.values(fieldErrors).some(Boolean)) return
    setSubmitting(true)
    setSetupPhase('creating')
    try {
      const { error, duplicateEmail, session } = await signUpWithEmail({
        name: name.trim(),
        email,
        password,
      })
      if (duplicateEmail) { setEmailTaken(true); return }
      if (error) { setError(error); return }
      if (session) {
        setSetupPhase('syncing')
        await waitForGuestMerge()
        setSetupPhase('finishing')
        await new Promise((resolve) => setTimeout(resolve, FINISH_HOLD_MS))
        setSetupPhase('idle')
        showToast('Account created! Check your email to verify your address.', 'success', undefined, 8000)
        options.onSignedIn?.()
        if (!options.onSignedIn) router.push(redirectTo)
        return
      }
      // Confirm-email still required on this project — fall back to verify screen.
      setScreen('verify-sent')
    } finally {
      setSubmitting(false)
      setSetupPhase('idle')
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 border rounded-lg bg-canvas text-[13px] focus:outline-none ${hasError ? 'border-madder focus:border-madder' : 'border-line focus:border-ink'}`

  return {
    signInWithGoogle,
    resendVerification,
    screen,
    name, setName,
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    error, submitting, setupPhase,
    attempted, emailTaken, setEmailTaken,
    fieldErrors,
    handleSignUp,
    inputClass,
  }
}
