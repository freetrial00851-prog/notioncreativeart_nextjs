'use client'

import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

/**
 * Wraps a section of the app so a crash inside it (like the ToastProvider
 * ordering bug that took the whole site down) shows a small recoverable
 * message instead of a blank white page. Each top-level area (customer
 * site, admin panel) gets its own boundary so a crash in one doesn't take
 * down the other.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Caught by ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6 text-center">
          <div>
            <p className="font-semibold text-lg mb-2">Something went wrong.</p>
            <p className="text-sm text-ink-soft mb-5">Please reload the page. If this keeps happening, let us know what you were doing.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-ink text-canvas text-[12px] tracking-[0.12em] rounded-lg hover:opacity-90 transition-opacity"
            >
              RELOAD
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
