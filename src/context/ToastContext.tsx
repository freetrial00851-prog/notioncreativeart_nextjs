'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { MaterialIcon } from '../components/MaterialIcon'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; message: string; type: ToastType; action?: { label: string; onClick: () => void } }

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, action?: Toast['action']) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

function CheckCircleIcon() {
  return <MaterialIcon name="check_circle" size={18} color="#3F7D4A" />
}
function ErrorCircleIcon() {
  return <MaterialIcon name="error" size={18} color="#B94A48" />
}
function InfoCircleIcon() {
  return <MaterialIcon name="info" size={18} color="var(--color-sale-green)" />
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const showToast = useCallback((message: string, type: ToastType = 'success', action?: Toast['action']) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, type, action }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed z-[100] flex flex-col gap-2 bottom-5 left-1/2 -translate-x-1/2 md:left-auto md:right-5 md:translate-x-0 px-4 md:px-0 w-full md:w-auto items-center md:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 bg-canvas border border-line rounded-lg shadow-lg px-4 py-3 text-[13px] max-w-sm animate-[fadeIn_0.2s_ease-out] w-full md:w-auto"
          >
            {t.type === 'success' && <CheckCircleIcon />}
            {t.type === 'error' && <ErrorCircleIcon />}
            {t.type === 'info' && <InfoCircleIcon />}
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); setToasts((prev) => prev.filter((x) => x.id !== t.id)) }}
                className="text-[12px] font-semibold underline underline-offset-2 shrink-0"
                style={{ color: 'var(--color-sale-green)' }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
