'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { hasBeenNewsletterPrompted } from '../lib/newsletterPrompt'

type RequireAuthAction = { type: 'buy' | 'wishlist' | 'cart'; productId: string }
type AuthSheetView = 'login' | 'signup'

type UIContextValue = {
  requireAuth: (action?: RequireAuthAction) => boolean // returns true if already authed
  openAuthModal: () => void
  // Auth overlay (mobile sheet / desktop-tablet modal)
  authSheetOpen: boolean
  authSheetView: AuthSheetView
  openAuthSheet: (view?: AuthSheetView) => void
  closeAuthSheet: () => void
  setAuthSheetView: (view: AuthSheetView) => void
  // Newsletter prompt after free download
  newsletterPromptOpen: boolean
  maybeOpenNewsletterPrompt: () => void
  closeNewsletterPrompt: () => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const { user, setPendingAction } = useAuth()
  const [authSheetOpen, setAuthSheetOpen] = useState(false)
  const [authSheetView, setAuthSheetView] = useState<AuthSheetView>('login')
  const [newsletterPromptOpen, setNewsletterPromptOpen] = useState(false)

  const openAuthSheet = (view: AuthSheetView = 'login') => {
    setAuthSheetView(view)
    setAuthSheetOpen(true)
  }
  const closeAuthSheet = () => setAuthSheetOpen(false)

  /** Opens auth overlay on the current page — sheet on mobile, modal on ≥768. */
  const goToLogin = () => openAuthSheet('login')

  const requireAuth = (action?: RequireAuthAction) => {
    if (user) return true
    if (action) setPendingAction(action)
    goToLogin()
    return false
  }

  const maybeOpenNewsletterPrompt = useCallback(() => {
    if (hasBeenNewsletterPrompted()) return
    setNewsletterPromptOpen(true)
  }, [])

  const closeNewsletterPrompt = useCallback(() => setNewsletterPromptOpen(false), [])

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
        newsletterPromptOpen,
        maybeOpenNewsletterPrompt,
        closeNewsletterPrompt,
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
