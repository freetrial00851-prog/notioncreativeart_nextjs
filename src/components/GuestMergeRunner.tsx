'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  clearGuestCart,
  clearGuestWishlist,
  consumePendingCheckout,
  emitGuestMergeDone,
  emitRunPendingCheckout,
  readGuestCart,
  readGuestWishlistIds,
} from '../lib/guestStorage'

/**
 * On login/signup (any path that sets a session), merge guest localStorage
 * wishlist + cart into the account. Only clear guest keys after DB writes succeed.
 */
export function GuestMergeRunner() {
  const { user } = useAuth()
  const mergedForUser = useRef<string | null>(null)

  useEffect(() => {
    if (!user) {
      mergedForUser.current = null
      return
    }
    if (mergedForUser.current === user.id) return

    let cancelled = false

    const run = async () => {
      const guestWishlist = readGuestWishlistIds()
      const guestCart = readGuestCart()
      const guestCartIds = guestCart.map((i) => i.productId)

      if (guestWishlist.length === 0 && guestCartIds.length === 0) {
        mergedForUser.current = user.id
        if (!cancelled) {
          emitGuestMergeDone()
          if (consumePendingCheckout()) emitRunPendingCheckout()
        }
        return
      }

      try {
        // --- Wishlist merge (set union via upsert) ---
        if (guestWishlist.length > 0) {
          const rows = guestWishlist.map((product_id) => ({
            user_id: user.id,
            product_id,
          }))
          const { error } = await supabase.from('wishlist').upsert(rows)
          if (error) throw new Error(`wishlist merge: ${error.message}`)
          if (cancelled) return
          clearGuestWishlist()
        }

        // --- Cart merge (set union; skip free / missing products) ---
        if (guestCartIds.length > 0) {
          const { data: products, error: prodErr } = await supabase
            .from('products')
            .select('id, price')
            .in('id', guestCartIds)
            .eq('active', true)
          if (prodErr) throw new Error(`cart product lookup: ${prodErr.message}`)

          const paidIds = (products ?? [])
            .filter((p) => Number(p.price) > 0)
            .map((p) => p.id as string)

          if (paidIds.length > 0) {
            const rows = paidIds.map((product_id) => ({
              user_id: user.id,
              product_id,
            }))
            const { error } = await supabase.from('cart_items').upsert(rows)
            if (error) throw new Error(`cart merge: ${error.message}`)
          }
          if (cancelled) return
          clearGuestCart()
        }

        if (cancelled) return
        mergedForUser.current = user.id
        emitGuestMergeDone()
        if (consumePendingCheckout()) emitRunPendingCheckout()
      } catch (err) {
        // Keep remaining guest localStorage intact — never clear on failure.
        console.error('[guest-merge] failed; guest data preserved', err)
        if (!cancelled) emitGuestMergeDone()
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [user])

  return null
}
