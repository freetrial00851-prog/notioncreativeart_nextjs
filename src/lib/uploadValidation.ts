/**
 * Client-side defense-in-depth for admin uploads.
 * True server enforcement lives on Supabase Storage buckets
 * (`file_size_limit` + `allowed_mime_types`) — see
 * supabase/storage-bucket-limits.sql.
 */

export type ValidationResult = { ok: true } | { ok: false; reason: string }

/** Matches product-images bucket limit (largest live object ~0.4MB). */
export const IMAGE_UPLOAD_MAX_BYTES = 10 * 1024 * 1024

/** Matches patterns bucket limit (largest live PDF ~0.85MB). */
export const PDF_UPLOAD_MAX_BYTES = 20 * 1024 * 1024

export const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export const ALLOWED_PDF_MIME = 'application/pdf'

const IMAGE_SIGNATURES = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF — WebP also has WEBP at offset 8
} as const

/** PDF magic: "%PDF" */
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]

export async function validateImageFile(file: File): Promise<ValidationResult> {
  if (file.size <= 0) return { ok: false, reason: 'Empty file.' }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return { ok: false, reason: 'Image is larger than 10MB.' }
  }

  // Declared MIME is untrusted; only use it to reject clearly unsupported image/* types.
  if (file.type) {
    if (file.type.startsWith('image/')) {
      if (!ALLOWED_IMAGE_MIME.has(file.type)) {
        return { ok: false, reason: 'Only JPEG, PNG, and WebP images are allowed.' }
      }
    } else {
      return { ok: false, reason: 'Not an image file.' }
    }
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const matchesJpeg = IMAGE_SIGNATURES.jpeg.every((b, i) => header[i] === b)
  const matchesPng = IMAGE_SIGNATURES.png.every((b, i) => header[i] === b)
  const matchesWebp =
    IMAGE_SIGNATURES.webp.every((b, i) => header[i] === b) &&
    header[8] === 0x57 &&
    header[9] === 0x45 &&
    header[10] === 0x42 &&
    header[11] === 0x50

  if (!matchesJpeg && !matchesPng && !matchesWebp) {
    return { ok: false, reason: "This doesn't look like a valid JPEG, PNG, or WebP file." }
  }

  return { ok: true }
}

export async function validatePdfFile(file: File): Promise<ValidationResult> {
  if (file.size <= 0) return { ok: false, reason: 'Empty file.' }
  if (file.size > PDF_UPLOAD_MAX_BYTES) {
    return { ok: false, reason: 'PDF is larger than 20MB.' }
  }

  // Do not trust file.type alone — require %PDF magic bytes.
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  const looksLikePdf = PDF_MAGIC.every((b, i) => header[i] === b)
  if (!looksLikePdf) {
    return { ok: false, reason: "This doesn't look like a valid PDF file." }
  }

  if (file.type && file.type !== ALLOWED_PDF_MIME && file.type !== 'application/x-pdf') {
    return { ok: false, reason: 'Only PDF files are allowed.' }
  }

  return { ok: true }
}
