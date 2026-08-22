'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useIsMobile } from '../lib/useIsMobile'

type RequireAuthAction = { type: 'buy' | 'wishlist' | 'cart'; productId: string }
type AuthSheetView = 'login' | 'signup'

type UIContextValue = {
  requireAuth: (action?: RequireAuthAction) => boolean // returns true if already authed
  openAuthModal: () => void
  // Mobile bottom-sheet auth
  authSheetOpen: boolean
  authSheetView: AuthSheetView
  openAuthSheet: (view?: AuthSheetView) => void
  closeAuthSheet: () => void
  setAuthSheetView: (view: AuthSheetView) => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const { user, setPendingAction } = useAuth()
  const isMobile = useIsMobile()
  const [authSheetOpen, setAuthSheetOpen] = useState(false)
  const [authSheetView, setAuthSheetView] = useState<AuthSheetView>('login')

  const goToLoginPage = () => {
    const redirect = window.location.pathname + window.location.search
    window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`
  }

  const openAuthSheet = (view: AuthSheetView = 'login') => {
    setAuthSheetView(view)
    setAuthSheetOpen(true)
  }
  const closeAuthSheet = () => setAuthSheetOpen(false)

  // Mobile gets an overlay sheet on top of whatever page they're on; desktop
  // keeps the dedicated split-screen /login page.
  const goToLogin = () => {
    if (isMobile) openAuthSheet('login')
    else goToLoginPage()
  }

  const requireAuth = (action?: RequireAuthAction) => {
    if (user) return true
    if (action) setPendingAction(action)
    goToLogin()
    return false
  }

  return (
    <UIContext.Provider
      value={{
        requireAuth,
        openAuthModal: goToLogin,
        authSheetOpen,
        authSheetView,
        openAuthSheet,
        closeAuthSheet,
        setAuthSheetView,
      }}
    >
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
