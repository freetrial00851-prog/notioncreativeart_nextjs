/**
 * Global TypeScript declarations for third-party scripts loaded at runtime.
 */
interface Window {
  createLemonSqueezy?: () => void
  LemonSqueezy?: {
    Setup: (config: { eventHandler: (event: { event: string }) => void }) => void
    Url: {
      Open: (url: string) => void
      Close: () => void
    }
  }
  /** Paddle.js v2 (https://cdn.paddle.com/paddle/v2/paddle.js) */
  Paddle?: {
    Environment: { set: (env: 'sandbox' | 'production') => void }
    Initialize: (options: {
      token: string
      eventCallback?: (event: { name?: string; data?: Record<string, unknown> }) => void
    }) => void
    Checkout: {
      open: (options: Record<string, unknown>) => void
      close: () => void
    }
  }
}

export {}
