import type { Product } from './types'

/**
 * Free download listing that should show auto FREE UI (not sold out, price is 0).
 * Matches the historic ProductCard corner-badge gate.
 */
export function isFreeProduct(product: Pick<Product, 'price' | 'sold_out'>): boolean {
  return !product.sold_out && Number(product.price) === 0
}
