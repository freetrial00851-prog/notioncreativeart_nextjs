type WithImages = { title: string; images?: string[] | null; image_alts?: string[] | null }

/**
 * Alt text for a product photo. A written alt (column `image_alts`, same order as `images`) is used when it exists;
 * otherwise the title with the photo number, so nothing is ever left without a description.
 */
export function productImageAlt(p: WithImages, index: number): string {
  const written = p.image_alts?.[index]?.trim()
  if (written) return written
  const count = p.images?.length ?? 0
  return count > 1 ? `${p.title}, photo ${index + 1} of ${count}` : p.title
}
