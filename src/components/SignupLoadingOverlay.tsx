'use client'

import { useBodyScrollLock } from '../lib/useBodyScrollLock'
import { LogoIcon } from './Logo'
import { MaterialIcon } from './MaterialIcon'

export type SignupSetupPhase = 'idle' | 'creating' | 'syncing' | 'finishing'

const BRAND = '#1f249c'
const BRAND_SOFT = '#e9eaf5'

const STEPS: { phase: Exclude<SignupSetupPhase, 'idle'>; label: string }[] = [
  { phase: 'creating', label: 'Creating your account' },
  { phase: 'syncing', label: 'Syncing your items' },
  { phase: 'finishing', label: 'Almost ready' },
]

function phaseIndex(phase: SignupSetupPhase): number {
  if (phase === 'idle') return -1
  return STEPS.findIndex((s) => s.phase === phase)
}

/** Progress tied to completed work — not a decorative timer. */
function progressPercent(phase: SignupSetupPhase): number {
  switch (phase) {
    case 'idle':
      return 0
    case 'creating':
      return 28
    case 'syncing':
      return 62
    case 'finishing':
      return 100
  }
}

type StepStatus = 'done' | 'active' | 'pending'

function stepStatus(stepIdx: number, phase: SignupSetupPhase): StepStatus {
  const current = phaseIndex(phase)
  if (current < 0) return 'pending'
  if (phase === 'finishing') return 'done'
  if (stepIdx < current) return 'done'
  if (stepIdx === current) return 'active'
  return 'pending'
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{ background: BRAND }}
        aria-hidden
      >
        <MaterialIcon name="check" size={14} color="#fff" />
      </span>
    )
  }
  if (status === 'active') {
    return (
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{ background: BRAND }}
        aria-hidden
      >
        <span
          className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin motion-reduce:animate-none"
        />
      </span>
    )
  }
  return (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8e6e1] text-[#9aa1a9]"
      aria-hidden
    >
      <span className="text-[10px] font-bold tracking-[0.2em] leading-none">···</span>
    </span>
  )
}

function HeroIcons() {
  const items = [
    { name: 'shopping_bag' as const, bg: BRAND_SOFT, color: BRAND },
    { name: 'person' as const, bg: BRAND_SOFT, color: BRAND, lift: true },
    { name: 'favorite' as const, bg: BRAND_SOFT, color: BRAND },
  ]
  return (
    <div className="relative mx-auto mb-6 w-full max-w-[280px] h-[88px] sm:h-[96px]" aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 96" fill="none">
        <path
          d="M52 58 C 90 38, 118 72, 140 48 C 162 24, 190 58, 228 52"
          stroke={BRAND}
          strokeWidth="1.5"
          strokeDasharray="4 5"
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>
      {[
        { x: '14%', y: '58%', ...items[0] },
        { x: '50%', y: '18%', ...items[1], lift: true },
        { x: '86%', y: '55%', ...items[2] },
      ].map((item) => (
        <div
          key={item.name}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: item.x, top: item.y }}
        >
          <span
            className={`flex items-center justify-center rounded-full shadow-sm ${item.lift ? 'h-14 w-14 sm:h-[60px] sm:w-[60px]' : 'h-12 w-12 sm:h-[52px] sm:w-[52px]'}`}
            style={{ background: item.bg }}
          >
            <MaterialIcon name={item.name} size={item.lift ? 26 : 22} color={item.color} />
          </span>
        </div>
      ))}
      {[
        { left: '22%', top: '28%', size: 5 },
        { left: '68%', top: '22%', size: 4 },
        { left: '78%', top: '70%', size: 5 },
        { left: '32%', top: '78%', size: 4 },
      ].map((dot, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            background: i % 2 === 0 ? BRAND : 'var(--color-logo-accent)',
            opacity: 0.65,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Branded step-by-step loading card while signup completes (account creation + guest merge).
 */
export function SignupLoadingOverlay({ phase }: { phase: SignupSetupPhase }) {
  const active = phase !== 'idle'
  useBodyScrollLock(active)

  if (!active) return null

  const percent = progressPercent(phase)

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="assertive"
      aria-label="Setting up your account"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4 py-6 sm:px-6"
    >
      <div
        className="w-full max-w-[420px] rounded-2xl sm:rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <div className="px-5 pt-7 pb-5 sm:px-8 sm:pt-9 sm:pb-6 text-center">
          <div className="flex flex-col items-center gap-2 mb-1">
            <LogoIcon size={44} className="sm:!w-12 sm:!h-12" />
            <span
              className="text-[17px] sm:text-[19px] font-bold tracking-tight leading-none"
              style={{ color: BRAND, fontFamily: 'var(--font-logo)' }}
            >
              NotionCreativeArt
            </span>
          </div>

          <HeroIcons />

          <h2
            className="font-heading font-semibold text-[22px] sm:text-[26px] leading-tight text-ink mb-2"
          >
            Setting up your account
          </h2>
          <p className="text-[13px] sm:text-[14px] text-ink-soft mb-6 sm:mb-7">
            Getting everything ready for you…
          </p>

          <div className="flex items-center gap-3 mb-5 sm:mb-6">
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

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-2 text-left sm:text-center">
            {STEPS.map((step, idx) => {
              const status = stepStatus(idx, phase)
              return (
                <li
                  key={step.phase}
                  className={`flex items-center gap-2.5 sm:flex-col sm:gap-1.5 sm:items-center min-w-0 ${
                    status === 'pending' ? 'text-ink-soft/70' : 'text-ink'
                  }`}
                >
                  <StepIcon status={status} />
                  <span className="text-[11px] sm:text-[10px] leading-snug font-medium sm:max-w-[6.5rem]">
                    {step.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <div
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 text-[12px] sm:text-[13px] font-medium"
          style={{ background: BRAND_SOFT, color: BRAND }}
        >
          <MaterialIcon name="star" size={16} color={BRAND} filled />
          <span>Thanks for being with us!</span>
        </div>
      </div>
    </div>
  )
}
