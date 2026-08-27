'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { isPasswordValid } from '../components/PasswordStrength'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = options.redirectTo || searchParams?.get('redirect') || '/account'

  const [screen, setScreen] = useState<'form' | 'verify-sent'>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [emailTaken, setEmailTaken] = useState(false)

  const emailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordValid = isPasswordValid(password)

  const fieldErrors = {
    email: email.trim() === '' ? 'Email address is required.' : (!emailFormatValid ? 'Enter a valid email address.' : null),
    password: !passwordValid ? 'Password doesn\u2019t meet the requirements above.' : null,
    agreed: !agreed ? 'You must agree to the Terms of Use and Privacy Policy.' : null,
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    setError(null)
    if (Object.values(fieldErrors).some(Boolean)) return
    setSubmitting(true)
    const { error, duplicateEmail, session } = await signUpWithEmail({
      name: name.trim() || undefined,
      email,
      password,
    })
    setSubmitting(false)
    if (duplicateEmail) { setEmailTaken(true); return }
    if (error) return setError(error)
    if (session) {
      options.onSignedIn?.()
      if (!options.onSignedIn) router.push(redirectTo)
      return
    }
    // Confirm-email still required on this project — fall back to verify screen.
    setScreen('verify-sent')
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
    agreed, setAgreed,
    showPassword, setShowPassword,
    error, submitting,
    attempted, emailTaken, setEmailTaken,
    fieldErrors,
    handleSignUp,
    inputClass,
  }
}
