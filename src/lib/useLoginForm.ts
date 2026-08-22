'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from './supabase'

/**
 * All the state and handlers behind the sign-in form. Extracted so the
 * desktop full-page Login and the mobile bottom-sheet version render their
 * own chrome but share one implementation of validation and submission —
 * two copies of this logic would drift out of sync the next time either one
 * changes.
 */
export function useLoginForm({ redirectTo, onSignedIn }: { redirectTo: string; onSignedIn: () => void }) {
  const { signInWithGoogle, signInWithEmail } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signInWithEmail(email, password)
    setSubmitting(false)
    if (error) return setError(error)
    // "Remember me" unchecked — sign out again once the browser tab actually
    // closes, rather than staying signed in indefinitely on this device.
    if (!rememberMe) {
      window.addEventListener('beforeunload', () => { supabase.auth.signOut() })
    }
    onSignedIn()
  }

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: `${window.location.origin}/reset-password` })
    setResetSubmitting(false)
    if (error) { showToast("Couldn't send the reset email — please try again.", 'error'); return }
    setResetSent(true)
    showToast('If that email is registered, a reset link is on its way.', 'success')
  }

  return {
    signInWithGoogle,
    redirectTo,
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    rememberMe, setRememberMe,
    error, submitting,
    handleSignIn,
    forgotMode, setForgotMode,
    resetEmail, setResetEmail,
    resetSubmitting, resetSent, setResetSent,
    handleResetRequest,
  }
}
