export type CheckoutPhase = 'validating' | 'preparing' | 'redirecting'
export type DownloadPhase = 'preparing' | 'starting'

export type LoadingOverlayState =
  | { kind: 'checkout'; phase: CheckoutPhase; source: 'cart' | 'buy' }
  | { kind: 'download'; phase: DownloadPhase }
  | null

export const CHECKOUT_STEPS: { phase: CheckoutPhase; label: string; labelBuy?: string }[] = [
  { phase: 'validating', label: 'Reviewing your cart', labelBuy: 'Reviewing your order' },
  { phase: 'preparing', label: 'Preparing your order' },
  { phase: 'redirecting', label: 'Redirecting to checkout' },
]

export const DOWNLOAD_STEPS: { phase: DownloadPhase; label: string }[] = [
  { phase: 'preparing', label: 'Preparing your download' },
  { phase: 'starting', label: 'Starting download' },
]

export function checkoutProgressPercent(phase: CheckoutPhase): number {
  switch (phase) {
    case 'validating':
      return 28
    case 'preparing':
      return 68
    case 'redirecting':
      return 100
  }
}

export function downloadProgressPercent(phase: DownloadPhase): number {
  switch (phase) {
    case 'preparing':
      return 62
    case 'starting':
      return 100
  }
}

export function checkoutHeading(phase: CheckoutPhase): string {
  return phase === 'redirecting' ? 'Almost ready…' : 'Preparing your order…'
}

export function checkoutSubtitle(phase: CheckoutPhase): string {
  switch (phase) {
    case 'validating':
      return 'Reviewing your items'
    case 'preparing':
      return 'Creating your checkout session'
    case 'redirecting':
      return 'Redirecting to checkout'
  }
}

export function downloadHeading(): string {
  return 'Preparing your download…'
}

export function downloadSubtitle(phase: DownloadPhase): string {
  return phase === 'starting' ? 'Your download is starting' : 'Getting your pattern ready'
}
