export type OrderRow = {
  id: string
  lemon_order_id: string | null
  display_order_number?: string | null
  amount: number
  currency: string
  status: string
  product_ids: string[]
  created_at: string
}

const BRAND = '#1f249c'
const BRAND_SOFT = '#e9eaf5'

export function StatusBadge({ status }: { status: string }) {
  const style =
    status === 'paid' ? { background: BRAND_SOFT, color: BRAND } :
    status === 'refunded' ? { background: '#F5E6E6', color: 'var(--color-madder)' } :
    { background: 'var(--color-surface)', color: 'var(--color-ink-soft)' }
  const label = status === 'paid' ? 'Completed' : status === 'refunded' ? 'Refunded' : 'Pending'
  return <span className="text-[11px] tracking-wide px-2.5 py-1 rounded-[3px] font-medium" style={style}>{label}</span>
}
