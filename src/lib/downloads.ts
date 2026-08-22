import { supabase } from './supabase'

/** Signs and triggers a real browser download of a pattern's PDF. Returns
 *  false (and lets the caller show an error) if the file isn't uploaded yet. */
export async function triggerPdfDownload(productId: string, title?: string): Promise<boolean> {
  const filename = `${(title ?? 'pattern').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.pdf`
  const { data, error } = await supabase.storage.from('patterns').createSignedUrl(`${productId}.pdf`, 60, { download: filename })
  if (error || !data) return false
  const a = document.createElement('a')
  a.href = data.signedUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  return true
}

/** Free ($0) patterns skip Lemon Squeezy entirely — this records real
 *  ownership (order_id left null, since there's no real order) and then
 *  triggers the actual file download immediately. Uses a plain insert
 *  (not upsert) since upsert's ON CONFLICT needs a unique constraint on
 *  (user_id, product_id) that may not actually exist on every environment —
 *  a duplicate-row error here just means they already claimed it, which is
 *  fine, not a real failure. */
export async function claimAndDownloadFreePattern(userId: string, productId: string, title?: string): Promise<boolean> {
  const { error } = await supabase.from('purchases').insert({ user_id: userId, product_id: productId, order_id: null })
  if (error && error.code !== '23505') {
    console.error('Failed to record free-pattern purchase:', error)
    return false
  }
  return triggerPdfDownload(productId, title)
}
