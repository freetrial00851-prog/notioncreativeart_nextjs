import { supabase } from './supabase'

function triggerBrowserDownload(signedUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = signedUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Signs and triggers a real browser download of a pattern's PDF. Returns
 *  false (and lets the caller show an error) if the file isn't uploaded yet. */
export async function triggerPdfDownload(productId: string, title?: string): Promise<boolean> {
  const filename = `${(title ?? 'pattern').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.pdf`
  const { data, error } = await supabase.storage.from('patterns').createSignedUrl(`${productId}.pdf`, 60, { download: filename })
  if (error || !data) return false
  triggerBrowserDownload(data.signedUrl, filename)
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

/** Guest/anonymous free download — server verifies price === 0 and mints a
 *  signed URL via the download-free-pattern Edge Function. */
async function downloadFreePatternAsGuest(productId: string, title?: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('download-free-pattern', { body: { productId } })
  if (error) {
    try {
      const context = (error as { context?: Response }).context
      if (context && typeof context.json === 'function') {
        const body = await context.json()
        if (body?.error) console.error('Free download failed:', body.error)
      }
    } catch {
      /* ignore */
    }
    return false
  }
  if (data?.error || !data?.signedUrl) return false
  const filename = data.filename ?? `${(title ?? 'pattern').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.pdf`
  triggerBrowserDownload(data.signedUrl, filename)
  return true
}

/** Download a $0 pattern — logged-in users get a purchases row; guests use
 *  the Edge Function path. Paid products must not call this. */
export async function downloadFreePattern(productId: string, title?: string, userId?: string | null): Promise<boolean> {
  if (userId) return claimAndDownloadFreePattern(userId, productId, title)
  return downloadFreePatternAsGuest(productId, title)
}
