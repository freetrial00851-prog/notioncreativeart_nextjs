/**
 * Compresses an image file in the browser before upload: resizes it down to
 * a max dimension and re-encodes as JPEG at a moderate quality. Runs
 * entirely client-side (canvas API) — no server or paid service needed.
 */
export async function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  if (file.size < 150_000) return file

  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap

  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob) return file
  if (blob.size >= file.size) return file

  const newName = file.name.replace(/\.\w+$/, '') + '.jpg'
  return new File([blob], newName, { type: 'image/jpeg' })
}
