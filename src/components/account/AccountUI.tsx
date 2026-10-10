import Link from 'next/link'
import type { ReactNode } from 'react'

export const ACCOUNT_CARD = 'rounded-[20px] border border-border bg-surface'

export const PRIMARY_PILL =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-[15px] md:text-[14px] font-semibold text-primary-contrast transition-colors hover:bg-primary-hover disabled:opacity-50'
export const SECONDARY_PILL =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-primary bg-white px-6 text-[15px] md:text-[14px] font-semibold text-primary transition-colors hover:bg-primary-soft disabled:opacity-50'
export const TEXT_LINK =
  'inline-flex min-h-11 items-center text-[15px] md:text-[14px] font-semibold text-primary hover:underline underline-offset-2'

export const SELECT_PILL =
  'min-h-11 rounded-full border border-border bg-surface px-4 pr-9 text-[15px] md:text-[14px] font-semibold text-ink'

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(amount))
  } catch {
    return `${Number(amount).toFixed(2)} ${currency}`
  }
}

export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function fileLabel(pages: number | null | undefined) {
  return pages ? `PDF · ${pages} ${pages === 1 ? 'page' : 'pages'}` : 'PDF'
}

export function OrderStatusPill({ status }: { status: string }) {
  const [label, cls] =
    status === 'paid'
      ? ['Paid', 'bg-success-bg text-free']
      : status === 'refunded'
        ? ['Refunded', 'bg-sale/10 text-sale']
        : ['Pending', 'bg-surface-soft text-muted']
  return <span className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-bold ${cls}`}>{label}</span>
}

export function AccountPageHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-5 md:mb-6">
      <h1 className="font-heading text-[34px] md:text-[40px] font-bold leading-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-[16px] md:text-[14px] text-muted">{subtitle}</p>}
    </div>
  )
}

/** Support line: placeholder until the owner supplies the address; Contact page in production. */
export function SupportNote({ hidePlaceholder, lead }: { hidePlaceholder: boolean; lead: string }) {
  return (
    <p className="mt-5 text-[14px] md:text-[13px] leading-relaxed text-muted">
      {lead}{' '}
      {hidePlaceholder ? (
        <>
          write to us through our{' '}
          <Link href="/contact" className="text-primary underline underline-offset-2 hover:text-primary-hover">
            Contact page
          </Link>
        </>
      ) : (
        <>
          {/* TODO(owner): real support email */}
          write to <span className="text-primary underline">[SUPPORT EMAIL]</span>
        </>
      )}
      .
    </p>
  )
}
