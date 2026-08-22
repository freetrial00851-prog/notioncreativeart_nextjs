import type { Profile } from './types'

// Country-specific postal code patterns for the countries we support in the
// billing form (see COUNTRIES in Account.tsx). Anything not listed here
// falls back to a loose generic check (see isValidPostalCode below) — we
// don't have a full per-country postal-code database, so this covers the
// common/strict formats and stays permissive for the rest.
const POSTAL_PATTERNS: Record<string, RegExp> = {
  US: /^\d{5}(-\d{4})?$/,
  CA: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
  GB: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
  AU: /^\d{4}$/,
  DE: /^\d{5}$/,
  FR: /^\d{5}$/,
  ES: /^\d{5}$/,
  IT: /^\d{5}$/,
  NL: /^\d{4}\s?[A-Z]{2}$/i,
  IE: /^[A-Z]\d{2}\s?[A-Z0-9]{4}$/i,
  NZ: /^\d{4}$/,
  SG: /^\d{6}$/,
  IN: /^\d{6}$/,
  PK: /^\d{5}$/,
  JP: /^\d{3}-?\d{4}$/,
  BR: /^\d{5}-?\d{3}$/,
  MX: /^\d{5}$/,
  ZA: /^\d{4}$/,
  SE: /^\d{3}\s?\d{2}$/,
  NO: /^\d{4}$/,
  DK: /^\d{4}$/,
  FI: /^\d{5}$/,
  PL: /^\d{2}-?\d{3}$/,
  PT: /^\d{4}-?\d{3}$/,
  BE: /^\d{4}$/,
  CH: /^\d{4}$/,
  AT: /^\d{4}$/,
}

/** Loose fallback for countries without a specific pattern above. */
const GENERIC_POSTAL_PATTERN = /^[A-Z0-9][A-Z0-9\- ]{1,9}[A-Z0-9]$/i

export function isValidPostalCode(country: string | null | undefined, zip: string | null | undefined) {
  const value = (zip ?? '').trim()
  if (!value) return false
  const pattern = country ? POSTAL_PATTERNS[country] : undefined
  return pattern ? pattern.test(value) : GENERIC_POSTAL_PATTERN.test(value)
}

/**
 * Whether the profile has everything needed for checkout to prefill billing
 * details. US requires the full address (street, city, state, zip) since
 * that's what a US billing address needs; every other country only needs a
 * valid postal code + country, per how the store handles non-US orders.
 */
export function isBillingAddressComplete(profile: Profile | null | undefined) {
  if (!profile) return false
  const country = profile.billing_country
  if (!country) return false

  if (country === 'US') {
    return !!(
      profile.billing_address_line1?.trim() &&
      profile.billing_city?.trim() &&
      profile.billing_state?.trim() &&
      isValidPostalCode('US', profile.billing_zip)
    )
  }

  return isValidPostalCode(country, profile.billing_zip)
}
