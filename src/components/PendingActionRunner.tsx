'use client'

import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { supabase } from '../lib/supabase'
import { startApiCheckout } from '../lib/lemonsqueezy'
import { downloadFreePattern } from '../lib/downloads'
import { profileDisplayName } from '../lib/profileName'
import type { Product } from '../lib/types'

export function PendingActionRunner() {
  const { user, profile, pendingAction, setPendingAction } = useAuth()
  const {
    beginCheckoutLoading,
    setCheckoutPhase,
    beginDownloadLoading,
    setDownloadPhase,
    endLoadingOverlay,
    maybeOpenNewsletterPrompt,
  } = useUI()

  useEffect(() => {
    if (!user || !pendingAction) return

    const run = async () => {
      if (pendingAction.type === 'wishlist') {
        await supabase.from('wishlist').upsert({ user_id: user.id, product_id: pendingAction.productId })
      }

      if (pendingAction.type === 'cart') {
        const { data } = await supabase
          .from('products')
          .select('id, title, price')
          .eq('id', pendingAction.productId)
          .maybeSingle()
        const product = data as Pick<Product, 'id' | 'title' | 'price'> | null
        if (product && Number(product.price) === 0) {
          beginDownloadLoading()
          const result = await downloadFreePattern(product.id, product.title, user.id, {
            onStarting: () => setDownloadPhase('starting'),
          })
          endLoadingOverlay()
          if (result.ok) maybeOpenNewsletterPrompt()
        } else if (product) {
          await supabase.from('cart_items').upsert(
            { user_id: user.id, product_id: pendingAction.productId, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,product_id' },
          )
        }
      }

      if (pendingAction.type === 'buy') {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('id', pendingAction.productId)
          .single()
        const product = data as Product | null
        if (product) {
          if (product.price === 0) {
            beginDownloadLoading()
            const result = await downloadFreePattern(product.id, product.title, user.id, {
              onStarting: () => setDownloadPhase('starting'),
            })
            endLoadingOverlay()
            if (result.ok) maybeOpenNewsletterPrompt()
          } else {
            beginCheckoutLoading({ source: 'buy', phase: 'preparing' })
            await startApiCheckout([product.id], {
              userId: user.id,
              email: user.email,
              name: profileDisplayName(profile) || undefined,
              billingCountry: profile?.billing_country,
              billingState: profile?.billing_state,
              billingZip: profile?.billing_zip,
            }, { onRedirecting: () => setCheckoutPhase('redirecting') })
            endLoadingOverlay()
          }
        }
      }

      setPendingAction(null)
    }

    run()
  }, [
    user,
    pendingAction,
    setPendingAction,
    profile,
    beginCheckoutLoading,
    setCheckoutPhase,
    beginDownloadLoading,
    setDownloadPhase,
    endLoadingOverlay,
    maybeOpenNewsletterPrompt,
  ])

  return null
}
