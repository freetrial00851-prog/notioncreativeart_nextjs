'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { hasEmailPasswordAuth } from '../lib/authProviders'
import { ACCOUNT_DELETED_FLAG, deleteAccount } from '../lib/deleteAccount'
import { CloseCircleIcon } from './icons'

export function DeleteAccountSection() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsPassword = hasEmailPasswordAuth(user)
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) closeDialog()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submitting])

  const closeDialog = () => {
    if (submitting) return
    setOpen(false)
    setPassword('')
    setConfirmEmail('')
    setError(null)
  }

  const handleDelete = async () => {
    if (!user) return
    setError(null)

    if (needsPassword && !password) {
      setError('Enter your current password to confirm.')
      return
    }
    if (!needsPassword && confirmEmail.trim().toLowerCase() !== (user.email ?? '').toLowerCase()) {
      setError('Type your email address exactly to confirm.')
      return
    }

    setSubmitting(true)
    const result = await deleteAccount(
      needsPassword ? { password } : { confirmEmail: confirmEmail.trim() },
    )
    if (!result.ok) {
      setSubmitting(false)
      setError(result.error ?? 'Could not delete account.')
      return
    }

    try {
      sessionStorage.setItem(ACCOUNT_DELETED_FLAG, '1')
    } catch {
      // ignore
    }
    await signOut()
    router.replace('/')
  }

  return (
    <>
      <section className="mt-12 pt-8 border-t border-line max-w-xl" aria-labelledby="danger-zone-heading">
        <h2 id="danger-zone-heading" className="text-[11px] tracking-[0.14em] text-madder font-semibold mb-2">
          DANGER ZONE
        </h2>
        <div className="rounded-2xl border border-madder/25 bg-madder/[0.04] p-5 sm:p-6">
          <h3 className="text-[15px] font-semibold text-ink mb-1.5">Delete account</h3>
          <p className="text-[13px] text-ink-soft leading-relaxed mb-4">
            Permanently remove your account, profile, wishlist, cart, and saved addresses. This cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-5 py-2.5 text-[13px] font-semibold rounded-full border border-madder/40 text-madder hover:bg-madder/10 transition-colors"
          >
            Delete account
          </button>
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/45 backdrop-blur-[2px] px-4"
          onClick={(e) => e.target === e.currentTarget && closeDialog()}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          aria-describedby="delete-account-desc"
        >
          <div className="relative w-full max-w-lg bg-canvas border border-madder/30 rounded-2xl shadow-xl p-6 sm:p-8">
            <button
              type="button"
              onClick={closeDialog}
              disabled={submitting}
              className="absolute top-4 right-4 p-1 rounded-full hover:opacity-80 transition-opacity disabled:opacity-40"
              aria-label="Cancel account deletion"
            >
              <CloseCircleIcon size={28} />
            </button>

            <p className="text-[10px] tracking-[0.2em] text-madder font-semibold mb-2 pr-8">PERMANENT ACTION</p>
            <h2 id="delete-account-title" className="font-heading font-semibold text-xl sm:text-[22px] text-ink mb-3 pr-6">
              Delete your account?
            </h2>
            <div id="delete-account-desc" className="text-[13px] text-ink-soft leading-relaxed space-y-2.5 mb-6">
              <p>This action is permanent and cannot be undone.</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Your profile, wishlist, cart, and saved billing addresses will be deleted.</li>
                <li>You will lose access to re-download previously purchased patterns through your account.</li>
                <li>Your order and purchase history will be kept for our financial records, but your login will no longer exist to access it.</li>
              </ul>
            </div>

            {needsPassword ? (
              <label className="block mb-4">
                <span className="block text-ink-soft text-[12px] tracking-[0.06em] mb-1.5">CURRENT PASSWORD</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="current-password"
                  className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-madder rounded-lg disabled:opacity-60"
                />
              </label>
            ) : (
              <label className="block mb-4">
                <span className="block text-ink-soft text-[12px] tracking-[0.06em] mb-1.5">
                  TYPE YOUR EMAIL TO CONFIRM
                </span>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  disabled={submitting}
                  autoComplete="email"
                  placeholder={user?.email ?? ''}
                  className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-madder rounded-lg disabled:opacity-60"
                />
                <p className="text-[11px] text-ink-soft mt-1.5">You signed up with Google — enter your account email to confirm.</p>
              </label>
            )}

            {error && <p className="text-[13px] text-madder mb-4">{error}</p>}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                className="px-5 py-2.5 text-[13px] font-medium rounded-full border border-line text-ink hover:bg-surface transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-5 py-2.5 text-[13px] font-semibold rounded-full bg-madder text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? 'Deleting…' : 'Delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/** Shows a one-time toast after redirect from account deletion. */
export function AccountDeletedToast() {
  const { showToast } = useToast()

  useEffect(() => {
    try {
      if (sessionStorage.getItem(ACCOUNT_DELETED_FLAG) !== '1') return
      sessionStorage.removeItem(ACCOUNT_DELETED_FLAG)
      showToast('Your account has been deleted.', 'success', undefined, 7000)
    } catch {
      // ignore
    }
  }, [showToast])

  return null
}
