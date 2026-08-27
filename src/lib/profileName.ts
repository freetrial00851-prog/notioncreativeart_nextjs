import type { Profile } from './types'

/** Single display name from profile (nullable name column). */
export function profileDisplayName(
  profile: Pick<Profile, 'name'> | { name?: string | null } | null | undefined,
  fallback = '',
): string {
  const n = profile?.name?.trim()
  return n || fallback
}

export function profileInitial(
  profile: Pick<Profile, 'name'> | { name?: string | null } | null | undefined,
  email?: string | null,
): string {
  const n = profile?.name?.trim()
  if (n) return n[0]!.toUpperCase()
  if (email) return email[0]!.toUpperCase()
  return '?'
}
