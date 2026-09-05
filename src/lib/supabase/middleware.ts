import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'

/**
 * Legacy WordPress / WooCommerce home query strings that used to resolve to
 * posts/products. Serving `/` for these is a soft-404; rewrite to a missing
 * path so the App Router returns a real 404 (not homepage 200).
 */
const WP_LEGACY_HOME_QUERY = new Set([
  'p',
  'page_id',
  'attachment_id',
  'product',
  'post_type',
])

function isWordPressLegacyHomeQuery(request: NextRequest): boolean {
  if (request.nextUrl.pathname !== '/') return false
  for (const key of WP_LEGACY_HOME_QUERY) {
    if (request.nextUrl.searchParams.has(key)) return true
  }
  return false
}

/** Soft-nav / Flight requests (visible in middleware before Next strips RSC headers). */
function isSoftNavigation(request: NextRequest): boolean {
  const rsc = request.headers.get('rsc') ?? request.headers.get('RSC')
  if (rsc === '1') return true
  if (request.headers.has('next-router-state-tree') || request.headers.has('Next-Router-State-Tree')) {
    return true
  }
  // Fallback when Flight headers are absent but the browser still uses fetch()-style navigation.
  const dest = request.headers.get('sec-fetch-dest')
  const mode = request.headers.get('sec-fetch-mode')
  return dest === 'empty' && mode === 'cors'
}

/**
 * Refreshes the Supabase auth session on every matched request.
 * Without this, server components would see stale/expired sessions.
 *
 * Also stamps `x-nca-soft-nav` for any future Server Components that need it.
 * Homepage deliberately does NOT read this header (calling headers() would
 * force the route dynamic and defeat ISR) — soft-nav speed comes from
 * client homeCatalogCache instead.
 */
export async function updateSession(request: NextRequest) {
  if (isWordPressLegacyHomeQuery(request)) {
    const gone = request.nextUrl.clone()
    gone.pathname = '/__wordpress-removed'
    gone.search = ''
    return NextResponse.rewrite(gone)
  }

  const requestHeaders = new Headers(request.headers)
  if (isSoftNavigation(request)) {
    requestHeaders.set('x-nca-soft-nav', '1')
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request: { headers: requestHeaders },
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  // Triggers session refresh — do not remove
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Server-side admin gate: never serve /admin shell to logged-out or non-admin users.
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)

    if (!user) {
      return NextResponse.redirect(loginUrl)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}
