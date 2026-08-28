'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { hasBeenNewsletterPrompted } from '../lib/newsletterPrompt'
import type { CheckoutPhase, DownloadPhase, LoadingOverlayState } from '../lib/checkoutLoading'

type RequireAuthAction = { type: 'buy' | 'wishlist' | 'cart'; productId: string }
type AuthSheetView = 'login' | 'signup'

type UIContextValue = {
  requireAuth: (action?: RequireAuthAction) => boolean
  openAuthModal: () => void
  authSheetOpen: boolean
  authSheetView: AuthSheetView
  openAuthSheet: (view?: AuthSheetView) => void
  closeAuthSheet: () => void
  setAuthSheetView: (view: AuthSheetView) => void
  newsletterPromptOpen: boolean
  maybeOpenNewsletterPrompt: () => void
  closeNewsletterPrompt: () => void
  loadingOverlay: LoadingOverlayState
  beginCheckoutLoading: (opts: { source: 'cart' | 'buy'; phase?: CheckoutPhase }) => void
  setCheckoutPhase: (phase: CheckoutPhase) => void
  beginDownloadLoading: () => void
  setDownloadPhase: (phase: DownloadPhase) => void
  endLoadingOverlay: () => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const { user, setPendingAction } = useAuth()
  const [authSheetOpen, setAuthSheetOpen] = useState(false)
  const [authSheetView, setAuthSheetView] = useState<AuthSheetView>('login')
  const [newsletterPromptOpen, setNewsletterPromptOpen] = useState(false)
  const [loadingOverlay, setLoadingOverlay] = useState<LoadingOverlayState>(null)

  const openAuthSheet = (view: AuthSheetView = 'login') => {
    setAuthSheetView(view)
    setAuthSheetOpen(true)
  }
  const closeAuthSheet = () => setAuthSheetOpen(false)
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

  const beginCheckoutLoading = useCallback((opts: { source: 'cart' | 'buy'; phase?: CheckoutPhase }) => {
    setLoadingOverlay({
      kind: 'checkout',
      source: opts.source,
      phase: opts.phase ?? (opts.source === 'cart' ? 'validating' : 'preparing'),
    })
  }, [])

  const setCheckoutPhase = useCallback((phase: CheckoutPhase) => {
    setLoadingOverlay((prev) => (prev?.kind === 'checkout' ? { ...prev, phase } : prev))
  }, [])

  const beginDownloadLoading = useCallback(() => {
    setLoadingOverlay({ kind: 'download', phase: 'preparing' })
  }, [])

  const setDownloadPhase = useCallback((phase: DownloadPhase) => {
    setLoadingOverlay((prev) => (prev?.kind === 'download' ? { ...prev, phase } : prev))
  }, [])

  const endLoadingOverlay = useCallback(() => setLoadingOverlay(null), [])

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
        loadingOverlay,
        beginCheckoutLoading,
        setCheckoutPhase,
        beginDownloadLoading,
        setDownloadPhase,
        endLoadingOverlay,
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
