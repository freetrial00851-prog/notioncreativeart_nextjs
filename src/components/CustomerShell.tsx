'use client'

import { useEffect } from 'react'
import { AnnouncementBar } from '@/components/AnnouncementBar'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { GlobalAccountBanners } from '@/components/GlobalAccountBanners'
import { AdminAreaGuard } from '@/components/AdminAreaGuard'
import { CheckoutOverlay } from '@/components/CheckoutOverlay'
import dynamic from 'next/dynamic'
import { Deferred } from '@/components/Deferred'
import { useCart } from '@/context/CartContext'
// Loaded after the page is usable (or when opened), so the first visit does not download or run them up front.
import { importCartDrawer, importAuthSheet } from '@/lib/overlayChunks'
const CartDrawer = dynamic(() => importCartDrawer().then((m) => m.CartDrawer), { ssr: false })
const AuthSheet = dynamic(() => importAuthSheet().then((m) => m.AuthSheet), { ssr: false })
const SupportChat = dynamic(() => import('@/components/SupportChat').then((m) => m.SupportChat), { ssr: false })
const NewsletterPromptModal = dynamic(() => import('@/components/NewsletterPromptModal').then((m) => m.NewsletterPromptModal), { ssr: false })
import { useUI } from '@/context/UIContext'
import { ScrollToTop } from '@/components/ScrollToTop'
import { StorefrontPageViewTracker } from '@/components/StorefrontPageViewTracker'

/**
 * Customer-facing shell — header, footer, cart drawer, auth sheet.
 * Admin routes use their own layout without this shell.
 */
function NewsletterPromptHost() {
  const { newsletterPromptOpen, closeNewsletterPrompt } = useUI()
  if (!newsletterPromptOpen) return null
  return <NewsletterPromptModal open={newsletterPromptOpen} onClose={closeNewsletterPrompt} />
}

/** Cart drawer and sign-in sheet are only downloaded when opened (or when the visitor reaches for the button); the chat after the page is idle. */
function DeferredOverlays() {
  const { drawerOpen } = useCart()
  const { authSheetOpen } = useUI()
  return (
    <>
      <Deferred now={drawerOpen} whenIdle={false}>
        <CartDrawer />
      </Deferred>
      <Deferred now={authSheetOpen} whenIdle={false}>
        <AuthSheet />
      </Deferred>
      <Deferred>
        <SupportChat />
      </Deferred>
    </>
  )
}

export function CustomerShell({ children }: { children: React.ReactNode }) {
  // Lemon Squeezy checkout overlay — same as the Vite app's useEffect in App.tsx
  useEffect(() => {
    window.createLemonSqueezy?.()
  }, [])

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <ScrollToTop />
      <StorefrontPageViewTracker />
      <AdminAreaGuard />
      <DeferredOverlays />
      <CheckoutOverlay />
      <NewsletterPromptHost />
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <Header />
        <GlobalAccountBanners />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
        <Footer />
      </div>
    </>
  )
}
