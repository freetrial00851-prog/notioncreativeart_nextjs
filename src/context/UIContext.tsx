'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { hasBeenNewsletterPrompted, markNewsletterPrompted } from '../lib/newsletterPrompt'
import { useToast } from './ToastContext'

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
  const { showToast } = useToast()
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

  // After a free download: a quiet offer in a toast instead of a modal that interrupts the moment.
  // Asked at most once per visit; the form only opens if the visitor taps the button.
  const maybeOpenNewsletterPrompt = useCallback(() => {
    if (hasBeenNewsletterPrompted()) return
    markNewsletterPrompted()
    showToast(
      'Want the next free pattern by email?',
      'info',
      { label: 'Yes, email me', onClick: () => setNewsletterPromptOpen(true) },
      9000,
    )
  }, [showToast])

  const closeNewsletterPrompt = useCallback(() => setNewsletterPromptOpen(false), [])

  const busyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideBusyOverlay = useCallback(() => {
    if (busyTimer.current) clearTimeout(busyTimer.current)
    busyTimer.current = null
    setBusyOverlay(null)
  }, [])
  // Safety net: if something hangs, the screen unlocks after 40 seconds instead of staying blocked.
  const showBusyOverlay = useCallback((kind: BusyOverlayKind) => {
    if (busyTimer.current) clearTimeout(busyTimer.current)
    setBusyOverlay(kind)
    busyTimer.current = setTimeout(() => setBusyOverlay(null), 40000)
  }, [])
  // Coming back with the browser's back button must not show a stuck overlay.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) hideBusyOverlay()
    }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [hideBusyOverlay])

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
