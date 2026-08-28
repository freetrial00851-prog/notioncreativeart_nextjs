import { supabase } from './supabase'
import { env } from './env'

function triggerBrowserDownload(signedUrl: string, filename: string): void {
  // iOS Safari often ignores `<a download>` for cross-origin URLs — opening
  // the signed URL directly is more reliable on mobile.
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (isMobile) {
    window.location.assign(signedUrl)
    return
  }
  const a = document.createElement('a')
  a.href = signedUrl
  a.download = filename
  a.rel = 'noopener'
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

type FreeDownloadResponse = { signedUrl?: string; filename?: string; error?: string }

async function requestFreeDownloadUrl(productId: string): Promise<FreeDownloadResponse> {
  const { data, error } = await supabase.functions.invoke('download-free-pattern', { body: { productId } })
  if (!error && data?.signedUrl) return data as FreeDownloadResponse

  if (error) {
    try {
      const context = (error as { context?: Response }).context
      if (context && typeof context.json === 'function') {
        const body = await context.json()
        if (body?.error) return { error: body.error }
      }
    } catch {
      /* ignore */
    }
  }

  // Some mobile browsers / supabase-js versions mishandle functions.invoke —
  // fall back to a direct fetch against the same Edge Function endpoint.
  try {
    const res = await fetch(`${env.supabaseUrl}/functions/v1/download-free-pattern`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.supabaseAnonKey}`,
        apikey: env.supabaseAnonKey,
      },
      body: JSON.stringify({ productId }),
    })
    const body = (await res.json()) as FreeDownloadResponse
    if (res.ok && body.signedUrl) return body
    return { error: body.error ?? "Couldn't start the download — please try again." }
  } catch {
    return { error: "Couldn't start the download — please try again." }
  }
}

/** Guest/anonymous free download — server verifies price === 0 and mints a
 *  signed URL via the download-free-pattern Edge Function. */
async function downloadFreePatternViaServer(
  productId: string,
  title?: string,
  options?: { onStarting?: () => void },
): Promise<{ ok: boolean; error?: string }> {
  const data = await requestFreeDownloadUrl(productId)
  if (data.error) return { ok: false, error: data.error }
  if (!data.signedUrl) return { ok: false, error: "This pattern's file isn't uploaded yet — please check back soon." }
  const filename = data.filename ?? `${(title ?? 'pattern').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.pdf`
  options?.onStarting?.()
  triggerBrowserDownload(data.signedUrl, filename)
  return { ok: true }
}

/** Download a $0 pattern. Everyone gets the file via the Edge Function
 *  (reliable signed URL). Logged-in users also get a best-effort purchases
 *  row so the pattern shows up under Account → Downloads. */
export async function downloadFreePattern(
  productId: string,
  title?: string,
  userId?: string | null,
  options?: { onStarting?: () => void },
): Promise<{ ok: boolean; error?: string }> {
  if (userId) {
    void supabase.from('purchases').insert({ user_id: userId, product_id: productId, order_id: null }).then(({ error }) => {
      if (error && error.code !== '23505') console.error('Failed to record free-pattern purchase:', error)
    })
  }
  const result = await downloadFreePatternViaServer(productId, title, options)
  return result
}
