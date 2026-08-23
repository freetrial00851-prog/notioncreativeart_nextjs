export const NEWSLETTER_PROMPT_KEY = 'nca_newsletter_prompted'

export function hasBeenNewsletterPrompted(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return sessionStorage.getItem(NEWSLETTER_PROMPT_KEY) === '1'
  } catch {
    return true
  }
}

export function markNewsletterPrompted(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(NEWSLETTER_PROMPT_KEY, '1')
  } catch {
    /* ignore quota / private mode */
  }
}
