import { MAX_OUTPUT_BYTES } from './imageVariants'

/**
 * Compresses an image file in the browser before upload: resizes it and
 * re-encodes until under MAX_OUTPUT_BYTES (26KB). Used for category images
 * and other single-file uploads outside the multi-variant product pipeline.
 */
export async function compressImage(file: File, maxDimension = 1200, quality = 0.7): Promise<File> {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap

  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const ctxAvailable = !!document.createElement('canvas').getContext('2d')
  if (!ctxAvailable) {
    bitmap.close()
    return file
  }

  let q = quality
  let w = width
  let h = height
  let blob: Blob | null = null

  for (let attempt = 0; attempt < 16; attempt++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, w)
    canvas.height = Math.max(1, h)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', q))
    if (!blob) {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', q))
    }
    if (!blob) {
      bitmap.close()
      return file
    }

    if (blob.size <= MAX_OUTPUT_BYTES) break

    if (q > 0.28) {
      q = Math.max(0.28, q - 0.08)
    } else if (Math.max(w, h) > 240) {
      w = Math.max(1, Math.round(w * 0.82))
      h = Math.max(1, Math.round(h * 0.82))
      q = Math.min(quality, 0.5)
    } else {
      break
    }
  }

  bitmap.close()
  if (!blob) return file

  const ext = blob.type === 'image/webp' ? '.webp' : '.jpg'
  const newName = file.name.replace(/\.\w+$/, '') + ext
  return new File([blob], newName, { type: blob.type })
}
