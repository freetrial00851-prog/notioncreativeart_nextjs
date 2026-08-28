'use client'

import { useState } from 'react'
import { downloadOrderReceipt } from '../lib/orderReceipt'
import { useToast } from '../context/ToastContext'
import { MaterialIcon } from './MaterialIcon'

const BRAND = '#1f249c'

export function DownloadReceiptButton({
  orderId,
  variant = 'outline',
}: {
  orderId: string
  variant?: 'outline' | 'header'
}) {
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    if (busy) return
    setBusy(true)
    const result = await downloadOrderReceipt(orderId)
    setBusy(false)
    if (!result.ok) showToast(result.error, 'error')
  }

  if (variant === 'header') {
    return (
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={busy}
        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-[11px] tracking-[0.08em] font-semibold rounded-full border border-line hover:bg-surface disabled:opacity-50"
      >
        <MaterialIcon name="download" size={14} />
        {busy ? 'PREPARING…' : 'DOWNLOAD RECEIPT'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      className="flex w-full items-center justify-center gap-1.5 py-3.5 border border-line rounded-full text-[12px] tracking-[0.12em] text-ink hover:bg-surface transition-colors disabled:opacity-50"
      style={{ color: BRAND }}
    >
      <MaterialIcon name="download" size={15} />
      {busy ? 'PREPARING RECEIPT…' : 'DOWNLOAD RECEIPT'}
    </button>
  )
}
