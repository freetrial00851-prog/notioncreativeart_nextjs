'use client'

import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import {
  CHECKOUT_STEPS,
  DOWNLOAD_STEPS,
  checkoutHeading,
  checkoutProgressPercent,
  checkoutSubtitle,
  downloadHeading,
  downloadProgressPercent,
  downloadSubtitle,
  type CheckoutPhase,
  type DownloadPhase,
  type LoadingOverlayState,
} from '../lib/checkoutLoading'
import { LogoIcon } from './Logo'
import { MaterialIcon } from './MaterialIcon'

const BRAND = '#1f249c'
const BRAND_SOFT = '#e9eaf5'

type StepStatus = 'done' | 'active' | 'pending'

function phaseIndex<T extends string>(steps: { phase: T }[], phase: T): number {
  return steps.findIndex((s) => s.phase === phase)
}

function stepStatus<T extends string>(stepIdx: number, steps: { phase: T }[], phase: T): StepStatus {
  const current = phaseIndex(steps, phase)
  if (current < 0) return 'pending'
  if (stepIdx < current) return 'done'
  if (stepIdx === current) return 'active'
  return 'pending'
}

function statusLabel(status: StepStatus): string {
  if (status === 'done') return 'Completed'
  if (status === 'active') return 'In progress'
  return 'Pending'
}

function StepIcon({ status, icon }: { status: StepStatus; icon: string }) {
  if (status === 'done') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: BRAND }} aria-hidden>
        <MaterialIcon name="check" size={16} color="#fff" />
      </span>
    )
  }
  if (status === 'active') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2" style={{ borderColor: BRAND, background: BRAND_SOFT }} aria-hidden>
        <span className="h-4 w-4 rounded-full border-2 border-[#1f249c]/25 border-t-[#1f249c] animate-spin motion-reduce:animate-none" />
      </span>
    )
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d8d5ce] bg-[#f5f3ef] text-[#9aa1a9]" aria-hidden>
      <MaterialIcon name={icon as 'shopping_cart'} size={16} color="#9aa1a9" />
    </span>
  )
}

function CheckoutHeroIcons() {
  const items = [
    { name: 'shopping_cart' as const, x: '12%', y: '62%' },
    { name: 'shopping_bag' as const, x: '50%', y: '22%', lift: true },
    { name: 'credit_card' as const, x: '72%', y: '58%' },
    { name: 'verified_user' as const, x: '88%', y: '38%' },
  ]
  return (
    <div className="relative mx-auto mb-5 sm:mb-6 w-full max-w-[300px] h-[100px] sm:h-[108px]" aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 108" fill="none">
        <path
          d="M48 62 C 88 42, 118 76, 150 52 C 182 28, 212 62, 252 56"
          stroke={BRAND}
          strokeWidth="1.5"
          strokeDasharray="4 5"
          strokeLinecap="round"
          opacity="0.3"
        />
      </svg>
      {items.map((item) => (
        <div key={item.name} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: item.x, top: item.y }}>
          <span
            className={`flex items-center justify-center rounded-full shadow-sm ${item.lift ? 'h-14 w-14 sm:h-[58px] sm:w-[58px] ring-4 ring-[#1f249c]/10' : 'h-11 w-11 sm:h-12 sm:w-12'}`}
            style={{ background: item.lift ? '#fff' : BRAND_SOFT }}
          >
            <MaterialIcon name={item.name} size={item.lift ? 26 : 20} color={BRAND} />
          </span>
          {item.lift && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: BRAND }}>
              <MaterialIcon name="check" size={12} color="#fff" />
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function DownloadHeroIcons() {
  return (
    <div className="relative mx-auto mb-5 sm:mb-6 w-full max-w-[240px] h-[88px] sm:h-[96px]" aria-hidden>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="flex h-14 w-14 sm:h-[58px] sm:w-[58px] items-center justify-center rounded-full ring-4 ring-[#1f249c]/10 bg-white shadow-sm">
          <MaterialIcon name="download" size={28} color={BRAND} />
        </span>
      </div>
      <span className="absolute left-[18%] top-[58%] flex h-10 w-10 items-center justify-center rounded-full" style={{ background: BRAND_SOFT }}>
        <MaterialIcon name="description" size={18} color={BRAND} />
      </span>
      <span className="absolute right-[18%] top-[52%] flex h-10 w-10 items-center justify-center rounded-full" style={{ background: BRAND_SOFT }}>
        <MaterialIcon name="favorite" size={18} color={BRAND} />
      </span>
    </div>
  )
}

function StepsRow<T extends string>({
  steps,
  phase,
  icons,
  labelForStep,
}: {
  steps: { phase: T; label: string }[]
  phase: T
  icons: string[]
  labelForStep?: (step: { phase: T; label: string }) => string
}) {
  return (
    <ol className="flex items-start gap-0 w-full min-w-0">
      {steps.map((step, idx) => {
        const status = stepStatus(idx, steps, phase)
        const label = labelForStep ? labelForStep(step) : step.label
        return (
          <li key={step.phase} className="flex flex-1 min-w-0 flex-col items-center text-center relative">
            {idx > 0 && (
              <span
                className="absolute top-4 right-1/2 w-full h-px -translate-y-1/2 -z-0"
                style={{ background: status === 'pending' ? '#e8e6e1' : BRAND, opacity: status === 'pending' ? 1 : 0.35 }}
                aria-hidden
              />
            )}
            <StepIcon status={status} icon={icons[idx] ?? 'more_horiz'} />
            <p className={`mt-2 text-[10px] sm:text-[11px] leading-snug font-medium px-0.5 ${status === 'pending' ? 'text-ink-soft/70' : 'text-ink'}`}>
              {label}
            </p>
            <p className="text-[9px] sm:text-[10px] text-ink-soft mt-0.5">{statusLabel(status)}</p>
          </li>
        )
      })}
    </ol>
  )
}

export function CheckoutLoadingOverlay({ overlay }: { overlay: LoadingOverlayState }) {
  const active = overlay !== null
  useBodyScrollLock(active)
  if (!overlay) return null

  const isCheckout = overlay.kind === 'checkout'
  const percent = isCheckout
    ? checkoutProgressPercent(overlay.phase)
    : downloadProgressPercent(overlay.phase)
  const heading = isCheckout ? checkoutHeading(overlay.phase) : downloadHeading()
  const subtitle = isCheckout
    ? checkoutSubtitle(overlay.phase)
    : downloadSubtitle(overlay.phase)
  const ariaLabel = isCheckout ? 'Preparing checkout' : 'Preparing download'

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="assertive"
      aria-label={ariaLabel}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4 py-6 sm:px-6"
    >
      <div
        className="w-full max-w-[520px] rounded-2xl sm:rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <div className="px-5 pt-5 pb-5 sm:px-8 sm:pt-7 sm:pb-6">
          <div className="flex items-center gap-2 mb-5 sm:mb-6">
            <LogoIcon size={36} className="sm:!w-10 sm:!h-10 shrink-0" />
            <span className="text-[15px] sm:text-[17px] font-bold tracking-tight leading-none" style={{ color: BRAND, fontFamily: 'var(--font-logo)' }}>
              NotionCreativeArt
            </span>
          </div>

          <div className="text-center">
            {isCheckout ? <CheckoutHeroIcons /> : <DownloadHeroIcons />}

            <h2 className="font-heading font-semibold text-[21px] sm:text-[26px] leading-tight text-ink mb-1.5">
              {heading}
            </h2>
            <p className="text-[13px] sm:text-[14px] text-ink-soft mb-5 sm:mb-6">{subtitle}</p>

            <div className="flex items-center gap-3 mb-5 sm:mb-6 max-w-md mx-auto">
              <div className="relative flex-1 h-2.5 rounded-full bg-[#eceae4] overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${percent}%`, background: BRAND }}
                />
              </div>
              <span className="text-[13px] sm:text-[14px] font-semibold tabular-nums shrink-0 min-w-[2.5rem] text-right" style={{ color: BRAND }}>
                {percent}%
              </span>
            </div>

            {isCheckout && overlay.kind === 'checkout' ? (
              <StepsRow
                steps={CHECKOUT_STEPS}
                phase={overlay.phase}
                icons={['shopping_cart', 'inventory_2', 'open_in_new']}
                labelForStep={(step) =>
                  step.phase === 'validating' && overlay.source === 'buy'
                    ? CHECKOUT_STEPS[0].labelBuy ?? step.label
                    : step.label
                }
              />
            ) : (
              <StepsRow
                steps={DOWNLOAD_STEPS}
                phase={overlay.phase}
                icons={['hourglass_empty', 'download']}
              />
            )}
          </div>
        </div>

        <div
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 text-[11px] sm:text-[12px] font-medium text-center"
          style={{ background: BRAND_SOFT, color: BRAND }}
        >
          <MaterialIcon name="lock" size={15} color={BRAND} />
          <span>
            {isCheckout
              ? "Please don't close this window. You'll be redirected automatically."
              : "Please don't close this window while your download prepares."}
          </span>
        </div>
      </div>
    </div>
  )
}
