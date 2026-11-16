/**
 * next/image loader that skips Vercel's image optimiser.
 *
 * Why: every product upload already stores five pre-sized WebP files in Supabase Storage
 * (micro 160, thumb 320, card 640, large 1000, full 1600; see imageVariants.ts), cached for a year.
 * Running them through /_next/image as well counts against Vercel's image-optimisation quota, and
 * once that quota is used up Vercel answers 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) for any
 * image it has not cached, so photos appear as broken alt text.
 *
 * This loader picks the closest pre-sized file for the width Next asks for and returns its URL
 * directly. Anything that is not a stored product image (files in /public, other hosts) is returned as is.
 */

const VARIANT_RE = /-(micro|thumb|card|large|full)\.webp(\?.*)?$/

const STEPS: { name: 'micro' | 'thumb' | 'card' | 'large' | 'full'; width: number }[] = [
  { name: 'micro', width: 160 },
  { name: 'thumb', width: 320 },
  { name: 'card', width: 640 },
  { name: 'large', width: 1000 },
  { name: 'full', width: 1600 },
]

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (!VARIANT_RE.test(src)) return src
  // Smallest stored file that is at least as wide as requested; the biggest one if none is.
  const pick = STEPS.find((s) => s.width >= width) ?? STEPS[STEPS.length - 1]
  return src.replace(VARIANT_RE, (_m, _name, query) => `-${pick.name}.webp${query ?? ''}`)
}
