'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { hasBeenNewsletterPrompted } from '../lib/newsletterPrompt'

type RequireAuthAction = { type: 'buy' | 'wishlist' | 'cart'; productId: string }
type AuthSheetView = 'login' | 'signup'
export type BusyOverlayKind = 'checkout' | 'download'

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
  /** Full-screen blur spinner for Buy Now / Download Free (cart uses CartContext.checkingOut). */
  busyOverlay: BusyOverlayKind | null
  showBusyOverlay: (kind: BusyOverlayKind) => void
  hideBusyOverlay: () => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const { user, setPendingAction } = useAuth()
  const [authSheetOpen, setAuthSheetOpen] = useState(false)
  const [authSheetView, setAuthSheetView] = useState<AuthSheetView>('login')
  const [newsletterPromptOpen, setNewsletterPromptOpen] = useState(false)
  const [busyOverlay, setBusyOverlay] = useState<BusyOverlayKind | null>(null)

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

  const showBusyOverlay = useCallback((kind: BusyOverlayKind) => setBusyOverlay(kind), [])
  const hideBusyOverlay = useCallback(() => setBusyOverlay(null), [])

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
        busyOverlay,
        showBusyOverlay,
        hideBusyOverlay,
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
