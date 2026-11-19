/**
 * Keeps the owner's own visits out of analytics.
 *
 * A browser is marked "internal" when it is used while signed in as an admin, or when the owner opens any page once
 * with ?nca_internal=1 (do that on each phone or browser used for testing). Internal browsers do not load GA4 or the
 * Pinterest tag and do not send first-party events. Open any page with ?nca_internal=0 to count that browser again.
 */

export const INTERNAL_KEY = 'nca_internal'

/** '1' = internal (not counted), '0' = deliberately counted, null = not decided yet. */
function stored(): string | null {
  try {
    return typeof window === 'undefined' ? null : localStorage.getItem(INTERNAL_KEY)
  } catch {
    return null
  }
}

export function isInternalVisitor(): boolean {
  return stored() === '1'
}

/** Applies ?nca_internal=1 / ?nca_internal=0 from the address bar. */
export function syncInternalFromUrl(): void {
  try {
    const v = new URLSearchParams(window.location.search).get(INTERNAL_KEY)
    if (v === '1' || v === '0') localStorage.setItem(INTERNAL_KEY, v)
  } catch {
    /* storage can be blocked; counting then simply stays on */
  }
}

/** Marks this browser as internal unless the owner chose to be counted. */
export function markInternalAdmin(): void {
  try {
    if (stored() === null) localStorage.setItem(INTERNAL_KEY, '1')
  } catch {
    /* ignore */
  }
}
