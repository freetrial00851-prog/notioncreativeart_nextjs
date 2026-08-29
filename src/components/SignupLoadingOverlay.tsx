'use client'

import { useBodyScrollLock } from '../lib/useBodyScrollLock'

/**
 * Full-screen loading state while signup completes (user creation, session, guest merge).
 */
export function SignupLoadingOverlay({ active }: { active: boolean }) {
  useBodyScrollLock(active)

  if (!active) return null

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="assertive"
      aria-label="Setting up your account"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/40 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <div
          className="h-10 w-10 rounded-full border-[3px] border-white/25 border-t-[var(--color-accent)] animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        <div>
          <p className="text-[15px] font-semibold text-white tracking-wide">Setting things up for you…</p>
          <p className="text-[13px] text-white/75 mt-1">This only takes a moment</p>
        </div>
      </div>
    </div>
  )
}
