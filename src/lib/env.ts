/**
 * Centralized environment variable access.
 * Next.js inlines NEXT_PUBLIC_* at build time — never put secrets here.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  lemonStoreSlug: process.env.NEXT_PUBLIC_LEMON_STORE_SLUG,
  lemonVariantTestId: process.env.NEXT_PUBLIC_LEMON_VARIANT_TEST_ID,
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://notioncreativeart.com',
} as const

/** Validates required public env vars — call from server entry points. */
export function assertEnv() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
}
