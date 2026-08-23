'use client'

import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { startCheckout } from '../lib/lemonsqueezy'
import { downloadFreePattern } from '../lib/downloads'
import type { Product } from '../lib/types'

export function PendingActionRunner() {
  const { user, profile, pendingAction, setPendingAction } = useAuth()

  useEffect(() => {
    if (!user || !pendingAction) return

    const run = async () => {
      if (pendingAction.type === 'wishlist') {
        await supabase.from('wishlist').upsert({ user_id: user.id, product_id: pendingAction.productId })
      }

      if (pendingAction.type === 'cart') {
        await supabase.from('cart_items').upsert({ user_id: user.id, product_id: pendingAction.productId })
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
            await downloadFreePattern(product.id, product.title, user.id)
          } else {
            startCheckout({
              variantId: product.lemon_variant_id,
              userId: user.id,
              productId: product.id,
              email: user.email,
              name: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || undefined,
              billingCountry: profile?.billing_country,
              billingState: profile?.billing_state,
              billingZip: profile?.billing_zip,
              checkoutMode: product.checkout_mode,
            })
          }
        }
      }

      setPendingAction(null)
    }

    run()
  }, [user, pendingAction, setPendingAction])

  return null
}
