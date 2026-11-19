import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

/** Listing routes that are prerendered when the URL has no filter or page query. */
const LISTING_PATH = /^\/(shop|shop\/[^/]+|free-crochet-patterns)$/
/** Query keys that never change what a listing shows (tracking, Next's own RSC cache key). */
const IGNORED_QUERY = /^(_rsc|utm_.*|fbclid|gclid|gbraid|wbraid|gad_source|gad_campaignid|msclkid|srsltid|epik|mc_cid|mc_eid)$/

/**
 * /shop, /shop/<category> and /free-crochet-patterns are served from the static cache. Only requests that carry a
 * filter, sort or ?page= are sent to the per-request copies under /q (same output, rendered on demand).
 */
function listingRewrite(request: NextRequest): NextResponse | null {
  if (request.method !== 'GET') return null
  const { pathname, searchParams } = request.nextUrl
  if (!LISTING_PATH.test(pathname)) return null
  let needs = false
  for (const key of searchParams.keys()) {
    if (!IGNORED_QUERY.test(key)) {
      needs = true
      break
    }
  }
  if (!needs) return null
  const url = request.nextUrl.clone()
  url.pathname = `/q${pathname}`
  const headers = new Headers(request.headers)
  headers.set('x-nca-q', '1')
  return NextResponse.rewrite(url, { request: { headers } })
}

export async function middleware(request: NextRequest) {
  const rewrite = listingRewrite(request)
  if (rewrite) return rewrite
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all routes except static assets and Next.js internals.
     * Supabase session refresh must run on every page navigation.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
