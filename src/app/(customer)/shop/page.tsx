import type { Metadata } from 'next'
import { ShopIndexPage, shopIndexMetadata } from '@/components/listing/ShopIndexPage'

/**
 * The clean /shop URL is prerendered and cached (rebuilt every minute), so it is served from the CDN.
 * Requests with filter or ?page= query strings are rewritten by src/middleware.ts to /q/shop, which renders per request.
 * force-static makes useSearchParams() empty at build time, so the products are in the first HTML instead of a loading fallback.
 */
export const dynamic = 'force-static'
export const revalidate = 60

export function generateMetadata(): Metadata {
  return shopIndexMetadata({})
}

export default function ShopPage() {
  return <ShopIndexPage sp={{}} />
}
