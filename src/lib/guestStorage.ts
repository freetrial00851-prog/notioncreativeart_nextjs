/**
 * Guest (logged-out) wishlist + cart persistence.
 * Survives refresh for at least 7 days; cleared only after a successful merge to Supabase.
 */

export const GUEST_WISHLIST_KEY = 'guest_wishlist'
export const GUEST_CART_KEY = 'guest_cart'
export const PENDING_CHECKOUT_KEY = 'nca_pending_checkout'

const TTL_MS = 7 * 24 * 60 * 60 * 1000

export type GuestCartEntry = { productId: string; quantity: number }

type WishlistBlob = { productIds: string[]; updatedAt: number }
type CartBlob = { items: GuestCartEntry[]; updatedAt: number }

function now() {
  return Date.now()
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode */
  }
}

function isFresh(updatedAt: number | undefined): boolean {
  if (!updatedAt || typeof updatedAt !== 'number') return false
  return now() - updatedAt < TTL_MS
}

/** Product IDs in the guest wishlist (empty if missing/expired). */
export function readGuestWishlistIds(): string[] {
  const blob = readJson<WishlistBlob>(GUEST_WISHLIST_KEY)
  if (!blob || !isFresh(blob.updatedAt) || !Array.isArray(blob.productIds)) {
    if (blob && !isFresh(blob.updatedAt)) clearGuestWishlist()
    return []
  }
  return [...new Set(blob.productIds.filter((id) => typeof id === 'string' && id.length > 0))]
}

export function writeGuestWishlistIds(productIds: string[]) {
  writeJson(GUEST_WISHLIST_KEY, {
    productIds: [...new Set(productIds)],
    updatedAt: now(),
  } satisfies WishlistBlob)
}

export function toggleGuestWishlistId(productId: string): { ids: string[]; added: boolean } {
  const ids = readGuestWishlistIds()
  const idx = ids.indexOf(productId)
  if (idx >= 0) {
    ids.splice(idx, 1)
    writeGuestWishlistIds(ids)
    return { ids, added: false }
  }
  ids.push(productId)
  writeGuestWishlistIds(ids)
  return { ids, added: true }
}

export function clearGuestWishlist() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(GUEST_WISHLIST_KEY)
  } catch {
    /* ignore */
  }
}

export function readGuestCart(): GuestCartEntry[] {
  const blob = readJson<CartBlob>(GUEST_CART_KEY)
  if (!blob || !isFresh(blob.updatedAt) || !Array.isArray(blob.items)) {
    if (blob && !isFresh(blob.updatedAt)) clearGuestCart()
    return []
  }
  const byId = new Map<string, GuestCartEntry>()
  for (const item of blob.items) {
    if (!item || typeof item.productId !== 'string' || !item.productId) continue
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1))
    // Digital patterns: one entry per product (never stack quantities).
    if (!byId.has(item.productId)) byId.set(item.productId, { productId: item.productId, quantity: 1 })
    else byId.set(item.productId, { productId: item.productId, quantity: 1 })
    void quantity
  }
  return [...byId.values()]
}

export function writeGuestCart(items: GuestCartEntry[]) {
  const deduped = new Map<string, GuestCartEntry>()
  for (const item of items) {
    if (!item?.productId) continue
    deduped.set(item.productId, { productId: item.productId, quantity: 1 })
  }
  writeJson(GUEST_CART_KEY, {
    items: [...deduped.values()],
    updatedAt: now(),
  } satisfies CartBlob)
}

export function addGuestCartItem(productId: string) {
  const items = readGuestCart()
  if (!items.some((i) => i.productId === productId)) {
    items.push({ productId, quantity: 1 })
  }
  writeGuestCart(items)
  return items
}

export function removeGuestCartItem(productId: string) {
  const items = readGuestCart().filter((i) => i.productId !== productId)
  writeGuestCart(items)
  return items
}

export function clearGuestCart() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(GUEST_CART_KEY)
  } catch {
    /* ignore */
  }
}

export function setPendingCheckout(pending: boolean) {
  if (typeof window === 'undefined') return
  try {
    if (pending) sessionStorage.setItem(PENDING_CHECKOUT_KEY, '1')
    else sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
  } catch {
    /* ignore */
  }
}

export function consumePendingCheckout(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const v = sessionStorage.getItem(PENDING_CHECKOUT_KEY) === '1'
    if (v) sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
    return v
  } catch {
    return false
  }
}

export const GUEST_MERGE_DONE_EVENT = 'nca:guest-merge-done'
export const RUN_PENDING_CHECKOUT_EVENT = 'nca:run-pending-checkout'

export function emitGuestMergeDone() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(GUEST_MERGE_DONE_EVENT))
}

/** Resolves when guest merge finishes (or after timeout). */
export function waitForGuestMerge(timeoutMs = 10000): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  return new Promise((resolve) => {
    const finish = () => {
      window.removeEventListener(GUEST_MERGE_DONE_EVENT, onDone)
      clearTimeout(timer)
      resolve()
    }
    const onDone = () => finish()
    const timer = setTimeout(finish, timeoutMs)
    window.addEventListener(GUEST_MERGE_DONE_EVENT, onDone, { once: true })
  })
}

export function emitRunPendingCheckout() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(RUN_PENDING_CHECKOUT_EVENT))
}
