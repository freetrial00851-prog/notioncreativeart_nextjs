import { compressSingleImage, IMAGE_MAX, SINGLE_IMAGE_DEFAULTS } from './imageVariants'

/**
 * Compresses an image in the browser before upload: resize to max long-edge,
 * encode once as WebP at a fixed quality (~80%). Used for category images and
 * other single-file uploads outside the multi-variant product pipeline.
 */
export async function compressImage(
  file: File,
  maxDimension: number = IMAGE_MAX.general,
  quality: number = SINGLE_IMAGE_DEFAULTS.quality,
): Promise<File> {
  try {
    const blob = await compressSingleImage(file, maxDimension, quality)
    const ext = blob.type === 'image/webp' ? '.webp' : blob.type === 'image/jpeg' ? '.jpg' : '.bin'
    const newName = file.name.replace(/\.\w+$/, '') + ext
    return new File([blob], newName, { type: blob.type || 'image/webp' })
  } catch {
    return file
  }
}
