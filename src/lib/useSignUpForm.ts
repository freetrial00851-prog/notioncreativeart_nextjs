'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isPasswordValid } from '../components/PasswordStrength'

/**
 * All the state and handlers behind the create-account form. Extracted so
 * the desktop full-page SignUp and the mobile bottom-sheet version share one
 * implementation of validation, duplicate-email detection, and submission.
 */
export function useSignUpForm() {
  const { signInWithGoogle, signUpWithEmail, resendVerification } = useAuth()
  const [screen, setScreen] = useState<'form' | 'verify-sent'>('form')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [emailTaken, setEmailTaken] = useState(false)

  const emailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordsTyped = password.length > 0 && confirmPassword.length > 0
  const passwordsMatch = password === confirmPassword
  const passwordValid = isPasswordValid(password)

  const fieldErrors = {
    firstName: firstName.trim() === '' ? 'First name is required.' : null,
    lastName: lastName.trim() === '' ? 'Last name is required.' : null,
    email: email.trim() === '' ? 'Email address is required.' : (!emailFormatValid ? 'Enter a valid email address.' : null),
    password: !passwordValid ? 'Password doesn\u2019t meet the requirements above.' : null,
    confirmPassword: confirmPassword === '' ? 'Please confirm your password.' : (!passwordsMatch ? 'Passwords don\u2019t match.' : null),
    agreed: !agreed ? 'You must agree to the Terms of Use and Privacy Policy.' : null,
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    setError(null)
    if (Object.values(fieldErrors).some(Boolean)) return
    setSubmitting(true)
    const { error, duplicateEmail } = await signUpWithEmail({ firstName, lastName, email, password })
    setSubmitting(false)
    if (duplicateEmail) { setEmailTaken(true); return }
    if (error) return setError(error)
    setScreen('verify-sent')
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 border rounded-lg bg-canvas text-[13px] focus:outline-none ${hasError ? 'border-madder focus:border-madder' : 'border-line focus:border-ink'}`

  return {
    signInWithGoogle,
    resendVerification,
    screen,
    firstName, setFirstName,
    lastName, setLastName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    agreed, setAgreed,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    error, submitting,
    attempted, emailTaken, setEmailTaken,
    passwordsTyped, passwordsMatch,
    fieldErrors,
    handleSignUp,
    inputClass,
  }
}
