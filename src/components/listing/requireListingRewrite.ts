import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

/**
 * The /q/... routes only exist to render listing pages that carry filter or page query strings.
 * src/middleware.ts rewrites those requests here and stamps this header; opening /q/... directly is a 404.
 */
export async function requireListingRewrite() {
  const h = await headers()
  if (h.get('x-nca-q') !== '1') notFound()
}
