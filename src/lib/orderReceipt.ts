import { supabase } from './supabase'

export async function downloadOrderReceipt(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error: fnError } = await supabase.functions.invoke('download-order-receipt', {
    body: { orderId },
  })

  let message = "Couldn't download the receipt — please try again."
  if (fnError || !data?.pdfBase64 || !data?.filename) {
    try {
      const context = (fnError as { context?: Response })?.context
      if (context && typeof context.json === 'function') {
        const body = await context.json()
        if (body?.error) message = body.error
      } else if (data?.error) {
        message = data.error
      }
    } catch {
      /* keep generic */
    }
    return { ok: false, error: message }
  }

  const binary = atob(data.pdfBase64 as string)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = data.filename as string
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return { ok: true }
}
