'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { resetDefaultCheckoutProvider, PADDLE_ENVIRONMENT, paddleConfigured, type CheckoutProvider } from '../lib/paddle'
import { Card, Chip, PageHeader, useAdminUi } from '../components/adminUi'

/**
 * Admin → Payments: which provider takes the payment for every listing that has no setting of its own.
 * Stored in site_settings (key "checkout"). Listings can still override it in their own editor.
 */
export function AdminPayments() {
  const { confirm, toast } = useAdminUi()
  const [current, setCurrent] = useState<CheckoutProvider | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    supabase.from('site_settings').select('value').eq('key', 'checkout').maybeSingle().then(({ data }) => {
      if (!alive) return
      setCurrent((data?.value as { default_provider?: string } | null)?.default_provider === 'paddle' ? 'paddle' : 'lemonsqueezy')
    })
    return () => { alive = false }
  }, [])

  const sandbox = PADDLE_ENVIRONMENT === 'sandbox'

  const choose = async (next: CheckoutProvider) => {
    if (next === current || saving) return
    if (next === 'paddle') {
      const ok = await confirm({
        title: 'Send every listing through Paddle?',
        body: sandbox
          ? 'Paddle is in TEST mode: only Paddle test cards work, so real customers will not be able to pay until your live Paddle account is approved. Use this while Paddle reviews the site, then switch back.'
          : 'Every listing without its own setting will check out through Paddle.',
        confirmLabel: 'Use Paddle for the whole shop',
        tone: sandbox ? 'danger' : 'normal',
      })
      if (!ok) return
    }
    setSaving(true)
    const { error } = await supabase.from('site_settings').upsert({ key: 'checkout', value: { default_provider: next } }, { onConflict: 'key' })
    setSaving(false)
    if (error) {
      toast(error.message, 'error')
      return
    }
    resetDefaultCheckoutProvider()
    setCurrent(next)
    toast(next === 'paddle' ? 'The whole shop now checks out through Paddle' : 'The whole shop now checks out through Lemon Squeezy')
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Payments" desc="Choose who takes the payment for your patterns." />

      <Card title="Shop-wide payment provider" desc="Applies to every listing that does not have its own setting.">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[14px]">
            <span>Now using:</span>
            {current ? <Chip tone={current === 'paddle' ? 'dark' : 'grey'}>{current === 'paddle' ? 'Paddle' : 'Lemon Squeezy'}</Chip> : <span className="text-[#6b7280]">loading…</span>}
            <Chip tone={paddleConfigured() ? 'green' : 'amber'}>{paddleConfigured() ? `Paddle ${sandbox ? 'test mode' : 'live'} is connected` : 'Paddle is not connected yet'}</Chip>
          </div>

          <div role="radiogroup" aria-label="Shop-wide payment provider" className="flex flex-wrap gap-3">
            {([
              ['lemonsqueezy', 'Lemon Squeezy', 'Real payments work today.'],
              ['paddle', 'Paddle', sandbox ? 'Test mode: test cards only.' : 'Live payments.'],
            ] as const).map(([id, label, note]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={current === id}
                disabled={saving || current === null || (id === 'paddle' && !paddleConfigured())}
                onClick={() => void choose(id)}
                className={`min-w-[220px] rounded-2xl border p-4 text-left transition-colors disabled:opacity-50 ${current === id ? 'border-ink bg-[#F6F6F7]' : 'border-[#D1D5DB] hover:border-ink'}`}
              >
                <span className="block text-[15px] font-semibold">{label}</span>
                <span className="mt-1 block text-[13px] text-[#6b7280]">{note}</span>
              </button>
            ))}
          </div>

          {sandbox && (
            <p className="rounded-xl bg-[#FEF3C7] px-4 py-3 text-[13px] text-[#7C4A03]" role="note">
              <strong>Paddle is in test mode.</strong> While the whole shop uses Paddle, real customers cannot pay (only test cards work). Switch
              it on while Paddle reviews your site, then switch back to Lemon Squeezy until your live Paddle account is approved.
            </p>
          )}

          <p className="text-[13px] text-[#6b7280]">
            In Paddle each listing is sent with its own name and price from your catalog here, so nothing needs to be created in Paddle first.
            A single listing can still use the other provider: open it in Listings and change “Sell this pattern with”.
          </p>
        </div>
      </Card>
    </div>
  )
}
