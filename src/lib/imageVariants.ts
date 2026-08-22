/**
 * Multi-size image pipeline, designed to be a LOW-RISK addition on top of the
 * existing single-URL-per-image system:
 *
 *   - products.images stays exactly what it always was: a plain string[] of
 *     the "card" (~640px) URL. Nothing about the schema or the existing
 *     rendering code (`product.images[0]` used as a src) has to change.
 *   - Each upload also silently produces micro (~160px), thumb (~320px),
 *     large (~1000px), and full (~1600px) WebP siblings, saved under a
 *     predictable filename next to the card variant. The intermediate
 *     "large" tier exists specifically so 2x/retina displays viewing a
 *     ~350px grid card don't jump straight to the 1600px "full" image —
 *     without it, a card needing ~700px effective resolution has no
 *     candidate between 640w and 1600w and the browser picks the larger one.
 *   - `deriveVariantUrl()` turns a stored card URL into any sibling on
 *     demand, purely by string substitution — no extra query, no extra
 *     stored field. Call sites that want responsive srcset opt in one at a
 *     time; everything else keeps working unmodified.
 *   - Every output variant is forced under MAX_OUTPUT_BYTES (26KB) by
 *     lowering quality, then shrinking dimensions if still too large.
 */

const SIZES = { micro: 160, thumb: 320, card: 640, large: 1000, full: 1600 } as const
/** Starting quality per variant — encodeVariant may lower these to hit the size cap. */
const QUALITY: Record<keyof typeof SIZES, number> = { micro: 0.5, thumb: 0.52, card: 0.55, large: 0.45, full: 0.4 }

/** Hard ceiling for every uploaded image variant (product photos, etc.). */
export const MAX_OUTPUT_BYTES = 26 * 1024

const SIGNATURES: Record<string, number[]> = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // 'RIFF' — WebP is RIFF + 'WEBP' at offset 8, checked separately below
}

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 // 20MB ceiling — rejects anything absurd

export type ValidationResult = { ok: true } | { ok: false; reason: string }

export async function validateImageFile(file: File): Promise<ValidationResult> {
  if (!file.type.startsWith('image/')) return { ok: false, reason: 'Not an image file.' }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, reason: 'File is larger than 20MB.' }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const matchesJpeg = SIGNATURES.jpeg.every((b, i) => header[i] === b)
  const matchesPng = SIGNATURES.png.every((b, i) => header[i] === b)
  const matchesWebp = SIGNATURES.webp.every((b, i) => header[i] === b) && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50
  if (!matchesJpeg && !matchesPng && !matchesWebp) {
    return { ok: false, reason: "This doesn't look like a valid JPEG, PNG, or WebP file." }
  }
  return { ok: true }
}

export function sanitizeFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  return /[a-z0-9]/.test(base) ? base : 'image'
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality),
  )
}

/**
 * Encodes a WebP (or JPEG) under maxDimension, then iteratively lowers quality
 * and/or dimensions until the blob is ≤ maxBytes.
 */
async function encodeVariant(
  bitmap: ImageBitmap,
  maxDimension: number,
  quality: number,
  type: 'image/webp' | 'image/jpeg' = 'image/webp',
  maxBytes = MAX_OUTPUT_BYTES,
): Promise<Blob> {
  let { width, height } = bitmap
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  let q = quality
  let w = width
  let h = height
  let blob: Blob | null = null

  for (let attempt = 0; attempt < 16; attempt++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, w)
    canvas.height = Math.max(1, h)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    blob = await toBlob(canvas, type, q)

    if (blob.size <= maxBytes) return blob

    if (q > 0.28) {
      q = Math.max(0.28, q - 0.08)
    } else if (Math.max(w, h) > 240) {
      const shrink = 0.82
      w = Math.max(1, Math.round(w * shrink))
      h = Math.max(1, Math.round(h * shrink))
      q = Math.min(quality, 0.5)
    } else {
      // Floor reached — return best effort (should still be near the cap)
      return blob
    }
  }

  return blob!
}

/**
 * Generates thumb/card/full WebP variants for one source file and uploads
 * all three. Returns the card URL plus which path was actually used, so the
 * caller can surface it — a silent fallback is exactly what makes this kind
 * of bug invisible until someone downloads a file and checks it by hand.
 *
 * If WebP encoding fails for any reason, falls back to uploading a single
 * compressed JPEG instead — the feature degrades rather than breaking the
 * upload entirely, but the caller is told this happened.
 */
export async function processAndUploadImage(
  file: File,
  upload: (path: string, blob: Blob) => Promise<string /* public URL */>,
  basePath: string
): Promise<{ url: string; usedFallback: boolean; fallbackReason?: string }> {
  try {
    const bitmap = await createImageBitmap(file)
    const originalMax = Math.max(bitmap.width, bitmap.height)
    let cardUrl = ''
    for (const [key, maxDim] of Object.entries(SIZES) as [keyof typeof SIZES, number][]) {
      const cappedMax = Math.min(maxDim, originalMax) // never upscale
      const blob = await encodeVariant(bitmap, cappedMax, QUALITY[key])
      if (blob.type !== 'image/webp') {
        throw new Error(`Browser produced ${blob.type || 'an unknown format'} instead of image/webp for the "${key}" size — this browser likely can't encode WebP via canvas.`)
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
    const blob = await encodeVariant(bitmap, 1600, 0.72, 'image/jpeg')
    bitmap.close()
    const url = await upload(`${basePath}-card.jpg`, blob)
    return { url, usedFallback: true, fallbackReason: reason }
  }
}

/** Derives any sibling variant URL from a stored card URL, purely by string
 * substitution — no extra query, no extra stored field. Falls back to the
 * card URL itself if the naming pattern isn't found (e.g. the rare JPEG
 * fallback path, which only has one size) — never throws, never breaks. */
export function deriveVariantUrl(cardUrl: string, size: keyof typeof SIZES): string {
  if (cardUrl.includes('-card.webp')) return cardUrl.replace('-card.webp', `-${size}.webp`)
  return cardUrl
}

/** Simple single-size compressor for homepage decorative images (hero,
 * chapter cards, category cards) — capped at MAX_OUTPUT_BYTES. */
export async function compressSingleImage(file: File, maxDimension = 1600, quality = 0.7): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const blob = await encodeVariant(bitmap, maxDimension, quality)
  bitmap.close()
  return blob
}
