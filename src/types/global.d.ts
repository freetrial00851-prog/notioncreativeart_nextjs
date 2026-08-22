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
}

export {}
