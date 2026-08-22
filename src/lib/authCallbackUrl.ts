/** OAuth redirect target — must match Supabase Auth → URL Configuration allow list. */
export function authCallbackUrl(next = '/account') {
  if (typeof window === 'undefined') return '/auth/callback'
  const url = new URL('/auth/callback', window.location.origin)
  url.searchParams.set('next', next)
  return url.toString()
}
