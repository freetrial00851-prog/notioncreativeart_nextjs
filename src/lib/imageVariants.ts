/**
 * Multi-size image pipeline (browser canvas → WebP):
 *
 *   - products.images stays a plain string[] of the "card" (~640px) URL.
 *   - Each upload also produces micro / thumb / large / full WebP siblings
 *     next to the card variant under a predictable filename.
 *   - `deriveVariantUrl()` turns a stored card URL into any sibling by
 *     string substitution — no extra query or stored field.
 *   - Encoding is dimension + quality based (not a fixed KB target). File
 *     size is a natural result of max edge + WebP quality ~75–80%.
 */

const SIZES = { micro: 160, thumb: 320, card: 640, large: 1000, full: 1600 } as const

/** WebP quality per variant — fixed; we do not ratchet down to hit a byte cap. */
const QUALITY: Record<keyof typeof SIZES, number> = {
  micro: 0.72,
  thumb: 0.75,
  card: 0.78,
  large: 0.8,
  full: 0.8,
}

/** Defaults for single-file uploads (hero, category, chapter, etc.). */
export const SINGLE_IMAGE_DEFAULTS = {
  maxDimension: 1600,
  quality: 0.8,
} as const

export const IMAGE_MAX = {
  hero: 1920,
  category: 800,
  chapter: 1200,
  general: 1600,
} as const

export type { ValidationResult } from './uploadValidation'
export { validateImageFile, IMAGE_UPLOAD_MAX_BYTES } from './uploadValidation'

export function sanitizeFilename(name: string) {
  const base = name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return /[a-z0-9]/.test(base) ? base : 'image'
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality),
  )
}

/**
 * Resize to maxDimension (long edge, never upscale), then encode once at the
 * given quality. No iterative quality/dimension crushing to hit a byte budget.
 */
async function encodeVariant(
  bitmap: ImageBitmap,
  maxDimension: number,
  quality: number,
  type: 'image/webp' | 'image/jpeg' = 'image/webp',
): Promise<Blob> {
  let { width, height } = bitmap
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return toBlob(canvas, type, quality)
}

/**
 * Generates micro/thumb/card/large/full WebP variants for one source file and
 * uploads all of them. Returns the card URL. Falls back to a single JPEG if
 * WebP encoding fails in the browser.
 */
export async function processAndUploadImage(
  file: File,
  upload: (path: string, blob: Blob) => Promise<string /* public URL */>,
  basePath: string,
): Promise<{ url: string; usedFallback: boolean; fallbackReason?: string }> {
  try {
    const bitmap = await createImageBitmap(file)
    const originalMax = Math.max(bitmap.width, bitmap.height)
    let cardUrl = ''
    for (const [key, maxDim] of Object.entries(SIZES) as [keyof typeof SIZES, number][]) {
      const cappedMax = Math.min(maxDim, originalMax) // never upscale
      const blob = await encodeVariant(bitmap, cappedMax, QUALITY[key])
      if (blob.type !== 'image/webp') {
        throw new Error(
          `Browser produced ${blob.type || 'an unknown format'} instead of image/webp for the "${key}" size — this browser likely can't encode WebP via canvas.`,
        )
      }
      const url = await upload(`${basePath}-${key}.webp`, blob)
      if (key === 'card') cardUrl = url
    }
    bitmap.close()
    return { url: cardUrl, usedFallback: false }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.error('WebP variant pipeline failed, falling back to single JPEG upload:', err)
    const bitmap = await createImageBitmap(file)
    const blob = await encodeVariant(bitmap, 1600, 0.82, 'image/jpeg')
    bitmap.close()
    const url = await upload(`${basePath}-card.jpg`, blob)
    return { url, usedFallback: true, fallbackReason: reason }
  }
}

/** Derives any sibling variant URL from a stored card URL by string
 * substitution. Falls back to the card URL if the naming pattern isn't found. */
export function deriveVariantUrl(cardUrl: string, size: keyof typeof SIZES): string {
  if (cardUrl.includes('-card.webp')) return cardUrl.replace('-card.webp', `-${size}.webp`)
  return cardUrl
}

/** Single-size compressor for homepage / category decorative images. */
export async function compressSingleImage(
  file: File,
  maxDimension: number = SINGLE_IMAGE_DEFAULTS.maxDimension,
  quality: number = SINGLE_IMAGE_DEFAULTS.quality,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const blob = await encodeVariant(bitmap, maxDimension, quality)
  bitmap.close()
  return blob
}
