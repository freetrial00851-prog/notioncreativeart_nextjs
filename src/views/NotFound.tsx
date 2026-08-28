'use client'

import Link from 'next/link'
import { MaterialIcon } from '../components/MaterialIcon'

export function NotFound() {
  return (
    <div className="max-w-site w-full mx-auto px-8 py-32 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--color-surface)' }}>
        <MaterialIcon name="shopping_basket" size={36} color="var(--color-sale-green)" />
      </div>
      <p className="font-display font-semibold text-6xl mb-3" style={{ color: 'var(--color-sale-green)' }}>404</p>
      <h1 className="font-display font-semibold text-2xl mb-3">Oops! This page wandered away.</h1>
      <p className="text-ink-soft text-[14px] mb-10">The page may have moved with the last collection. Try the shop, or search for a pattern.</p>
      <div className="flex gap-4 justify-center">
        <Link href="/shop" className="px-7 py-3.5 bg-ink text-canvas hover:opacity-85 rounded-full text-[13px] font-semibold">Browse patterns</Link>
        <Link href="/" className="px-7 py-3.5 border border-ink hover:bg-surface rounded-full text-[13px] font-semibold">Go to homepage</Link>
      </div>
    </div>
  )
}
