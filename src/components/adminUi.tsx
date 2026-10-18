'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { MaterialIcon } from './MaterialIcon'

/* ───────────── small helpers ───────────── */

export function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const inputCls =
  'h-11 w-full rounded-[10px] border border-[#D1D5DB] bg-white px-3.5 text-[14px] text-ink outline-none transition-shadow placeholder:text-[#9AA0A8] focus:border-ink focus:ring-2 focus:ring-black/10 disabled:bg-[#F6F6F7]'
export const textareaCls = inputCls.replace('h-11 ', 'py-2.5 leading-relaxed ')

export const money = (n: number, currency = 'USD') =>
  `${currency === 'USD' ? '$' : ''}${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currency === 'USD' ? '' : ` ${currency}`}`

export function ago(iso: string | null | undefined) {
  if (!iso) return '—'
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.floor(h / 24)
  return d < 14 ? `${d} day${d === 1 ? '' : 's'} ago` : new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    let s = v == null ? '' : String(v)
    // Spreadsheet formula injection guard.
    if (/^[=+\-@]/.test(s)) s = `'${s}`
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

/* ───────────── layout pieces ───────────── */

export function PageHeader({ title, desc, actions }: { title: string; desc?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-heading text-[24px] font-bold leading-tight md:text-[28px]">{title}</h2>
        {desc && <p className="mt-1 max-w-2xl text-[14px] text-[#6b7280]">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ title, desc, children, aside, className = '', id }: { title?: string; desc?: ReactNode; children: ReactNode; aside?: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`scroll-mt-32 rounded-2xl border border-[#E5E7EB] bg-white ${className}`}>
      {(title || aside) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title && <h3 className="text-[15px] font-semibold">{title}</h3>}
            {desc && <p className="mt-0.5 text-[13px] text-[#6b7280]">{desc}</p>}
          </div>
          {aside}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function Field({ label, hint, error, children, right }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode; right?: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2 text-[13px] font-medium text-ink">
        <span>{label}</span>
        {right && <span className="text-[12px] font-normal text-[#8a8f98]">{right}</span>}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-[12px] text-sale">{error}</span> : hint ? <span className="mt-1.5 block text-[12px] text-[#6b7280]">{hint}</span> : null}
    </label>
  )
}

type Tone = 'green' | 'red' | 'amber' | 'grey' | 'dark'
const TONES: Record<Tone, string> = {
  green: 'bg-[#E7F5EC] text-[#14532D]',
  red: 'bg-[#FDE8E8] text-[#991B1B]',
  amber: 'bg-[#FEF3C7] text-[#92400E]',
  grey: 'bg-[#F1F2F4] text-[#4B5563]',
  dark: 'bg-ink text-white',
}
export function Chip({ tone = 'grey', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${TONES[tone]}`}>{children}</span>
}

export function Empty({ icon = 'inventory_2', title, body, action }: { icon?: string; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[#F1F2F4] text-[#6b7280]">
        <MaterialIcon name={icon} size={22} />
      </span>
      <p className="mt-3 text-[15px] font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[13px] text-[#6b7280]">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; size?: 'md' | 'sm' }
export function Btn({ variant = 'secondary', size = 'md', className = '', ...rest }: BtnProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-[transform,background-color,opacity] active:scale-[.97] disabled:pointer-events-none disabled:opacity-45'
  const sz = size === 'sm' ? 'min-h-9 px-3.5 text-[13px]' : 'min-h-11 px-5 text-[14px]'
  const v =
    variant === 'primary'
      ? 'bg-ink text-white hover:bg-[#2a2a2a]'
      : variant === 'danger'
        ? 'border border-[#F3C4C4] bg-white text-[#B42318] hover:bg-[#FEF3F2]'
        : variant === 'ghost'
          ? 'text-[#4B5563] hover:bg-[#F1F2F4]'
          : 'border border-[#D1D5DB] bg-white text-ink hover:bg-[#F6F6F7]'
  return <button type="button" className={`${base} ${sz} ${v} ${className}`} {...rest} />
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-deal' : 'bg-[#D1D5DB]'}`}
    >
      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1" role="tablist">
      {items.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors ${value === t.id ? 'bg-ink text-white' : 'text-[#4B5563] hover:bg-white'}`}
        >
          {t.label}
          {t.count != null && <span className={`text-[12px] ${value === t.id ? 'text-white/70' : 'text-[#9AA0A8]'}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
      <MaterialIcon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8f98]" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={`${inputCls} rounded-full pl-10 pr-9`} />
      {value && (
        <button onClick={() => onChange('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-ink">
          ✕
        </button>
      )}
    </div>
  )
}

/** Slide-over panel (right on desktop, full width on phones). */
export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[480px] flex-col bg-[#F6F6F7] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-white px-5 py-3.5">
          <h3 className="text-[16px] font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#F1F2F4]">
            <MaterialIcon name="close" size={20} />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-[#E5E7EB] bg-white p-4">{footer}</div>}
      </aside>
    </div>
  )
}

/* ───────────── confirm dialog + toasts ───────────── */

type ConfirmOpts = { title: string; body?: ReactNode; confirmLabel?: string; tone?: 'danger' | 'normal'; typeToConfirm?: string }
type Toast = { id: number; text: string; tone: 'ok' | 'error' }
type Ctx = { confirm: (o: ConfirmOpts) => Promise<boolean>; toast: (text: string, tone?: 'ok' | 'error') => void }
const UiCtx = createContext<Ctx | null>(null)

export function useAdminUi(): Ctx {
  const c = useContext(UiCtx)
  if (!c) {
    // Outside the shell (e.g. isolated preview) fall back to the browser dialogs.
    return {
      confirm: async (o) => window.confirm(`${o.title}\n\n${typeof o.body === 'string' ? o.body : ''}`),
      toast: (t) => console.info(t),
    }
  }
  return c
}

export function AdminUiProvider({ children }: { children: ReactNode }) {
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null)
  const [typed, setTyped] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)

  const confirm = useCallback(
    (o: ConfirmOpts) =>
      new Promise<boolean>((resolve) => {
        setTyped('')
        setDlg({ ...o, resolve })
      }),
    [],
  )
  const toast = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    const id = ++seq.current
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 6000 : 3200)
  }, [])
  const value = useMemo(() => ({ confirm, toast }), [confirm, toast])

  const close = (v: boolean) => {
    dlg?.resolve(v)
    setDlg(null)
  }
  const locked = !!dlg?.typeToConfirm && typed.trim().toLowerCase() !== dlg.typeToConfirm.toLowerCase()

  return (
    <UiCtx.Provider value={value}>
      {children}
      {dlg && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-label={dlg.title}>
          <div className="absolute inset-0 bg-black/40" onClick={() => close(false)} />
          <div className="relative w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-[17px] font-semibold">{dlg.title}</h3>
            {dlg.body && <div className="mt-2 text-[14px] leading-relaxed text-[#4B5563]">{dlg.body}</div>}
            {dlg.typeToConfirm && (
              <label className="mt-4 block text-[13px]">
                Type <b>{dlg.typeToConfirm}</b> to continue
                <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} className={`${inputCls} mt-1.5`} />
              </label>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Btn onClick={() => close(false)}>Cancel</Btn>
              <Btn variant={dlg.tone === 'danger' ? 'danger' : 'primary'} disabled={locked} onClick={() => close(true)}>
                {dlg.confirmLabel ?? 'Confirm'}
              </Btn>
            </div>
          </div>
        </div>
      )}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto rounded-full px-5 py-3 text-[14px] font-medium text-white shadow-lg ${t.tone === 'error' ? 'bg-[#B42318]' : 'bg-ink'}`}>
            {t.text}
          </div>
        ))}
      </div>
    </UiCtx.Provider>
  )
}
