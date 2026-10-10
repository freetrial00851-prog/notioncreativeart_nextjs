import { supabase } from './supabase'

export const CONTACT_TOPICS = [
  'Problem with a download',
  'Question before buying',
  'Order or payment',
  'Refund',
  'Something else',
] as const

export type ContactTopic = (typeof CONTACT_TOPICS)[number]

export const LIVE_SUPPORT_EMAIL = 'engg.muhammadsufyan@gmail.com'

export type ContactPayload = {
  name: string
  email: string
  topic: ContactTopic
  order_number: string
  message: string
  company?: string
}

export async function sendContactMessage(
  payload: ContactPayload,
): Promise<{ ok: boolean; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('contact-message', { body: payload })
  if (error) {
    try {
      const context = (error as { context?: Response }).context
      if (context && typeof context.json === 'function') {
        const body = await context.json()
        if (body?.error) return { ok: false, error: body.error }
      }
    } catch {
      // fall through
    }
    return { ok: false, error: "Couldn't send your message — please try again." }
  }
  if (data?.error) return { ok: false, error: data.error }
  return { ok: true, error: null }
}
