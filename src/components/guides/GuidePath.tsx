'use client'

import { GuideIcon } from './GuideIcon'
import { scrollToId } from '@/lib/smoothScroll'
import type { GuideIconName } from '@/lib/guideMeta'

type Step = { id: string; title: string; count: number; icon: GuideIconName; accent: string }

/** The suggested reading order. Each step jumps to its section further down the page. */
export function GuidePath({ steps }: { steps: Step[] }) {
  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-card">
      <p className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-muted">Suggested order</p>
      <ol className="mt-4 space-y-1">
        {steps.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={(e) => {
                if (scrollToId(s.id)) e.preventDefault()
              }}
              className="group flex min-h-12 items-center gap-3 rounded-lg px-2 hover:bg-surface-warm"
            >
              <span className="w-5 text-[13px] font-extrabold text-muted">{i + 1}</span>
              <span
                className="grid size-8 shrink-0 place-items-center rounded-lg"
                style={{ color: s.accent, backgroundColor: `${s.accent}14` }}
              >
                <GuideIcon name={s.icon} size={17} />
              </span>
              <span className="flex-1 text-[15px] font-bold text-ink group-hover:underline">{s.title}</span>
              <span className="text-[13px] text-muted">{s.count}</span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}
