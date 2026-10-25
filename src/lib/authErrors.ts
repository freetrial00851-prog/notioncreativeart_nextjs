/** Turns raw sign-in / password errors into sentences a customer can act on. */
export function friendlyAuthError(message: string | null | undefined): string | null {
  if (!message) return null
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'That email or password is not right. Please try again, or use "Forgot password".'
  if (m.includes('email not confirmed')) return 'Please confirm your email first: check your inbox for the confirmation link.'
  if (m.includes('user already registered')) return 'An account with this email already exists. Try signing in instead.'
  if (m.includes('same password') || m.includes('different from the old')) return 'Please choose a password different from your old one.'
  if (m.includes('password should be') || m.includes('weak password')) return 'That password is too weak. Use at least 8 characters with upper and lower case letters and a symbol.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Please wait a few minutes and try again.'
  if (m.includes('failed to fetch') || m.includes('network')) return 'We could not reach the server. Please check your connection and try again.'
  return message
}
