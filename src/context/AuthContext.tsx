'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { authCallbackUrl } from '../lib/authCallbackUrl'
import { checkAuthRateLimit } from '../lib/authRateLimit'
import type { Profile } from '../lib/types'

type PendingAction = { type: 'buy' | 'wishlist' | 'cart'; productId: string } | null

type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  pendingAction: PendingAction
  setPendingAction: (a: PendingAction) => void
  signInWithGoogle: (redirectPath?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (params: { firstName: string; lastName: string; email: string; password: string }) => Promise<{ error: string | null; duplicateEmail?: boolean }>
  resendVerification: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingActionState] = useState<PendingAction>(() => {
    try {
      const raw = sessionStorage.getItem('nca_pending_action')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const setPendingAction = (a: PendingAction) => {
    setPendingActionState(a)
    try {
      if (a) sessionStorage.setItem('nca_pending_action', JSON.stringify(a))
      else sessionStorage.removeItem('nca_pending_action')
    } catch {
      // sessionStorage unavailable (private browsing etc) — pendingAction still works for the current tab via state
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data as Profile)
  }

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }
    fetchProfile(session.user.id)
  }, [session?.user?.id])

  const refreshProfile = async () => {
    if (session?.user) await fetchProfile(session.user.id)
  }

  const signInWithGoogle = async (redirectPath?: string) => {
    sessionStorage.setItem('nca_signin_intent', '1')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: authCallbackUrl(redirectPath || '/account'),
        queryParams: { prompt: 'select_account' },
      },
    })
  }

  const signInWithEmail = async (email: string, password: string) => {
    const limited = await checkAuthRateLimit('login', email)
    if (limited) return { error: limited }
    sessionStorage.setItem('nca_signin_intent', '1')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) sessionStorage.removeItem('nca_signin_intent')
    return { error: error?.message ?? null }
  }

  const signUpWithEmail = async ({ firstName, lastName, email, password }: { firstName: string; lastName: string; email: string; password: string }) => {
    const limited = await checkAuthRateLimit('signup', email)
    if (limited) return { error: limited }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) return { error: error.message }
    // Supabase deliberately doesn't return an error for an email that's already
    // registered and confirmed — it responds as if signup succeeded but with an
    // empty identities array, to stop attackers from probing which emails exist.
    // An empty array here is how we detect that case client-side.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: null, duplicateEmail: true }
    }
    return { error: null }
  }

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        pendingAction,
        setPendingAction,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resendVerification,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
