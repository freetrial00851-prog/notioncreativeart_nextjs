'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { GuideIcon } from './GuideIcon'
import type { GuideIconName } from '@/lib/guideMeta'

export type BrowserGuide = {
  slug: string
  title: string
  description: string
  minutes: number
}

export type BrowserGroup = {
  id: string
  title: string
  intro: string
  icon: GuideIconName
  accent: string
  guides: BrowserGuide[]
}

function GuideCard({ guide, group, showLabel }: { guide: BrowserGuide; group: BrowserGroup; showLabel: boolean }) {
  return (
    <li>
      <Link
        href={`/guides/${guide.slug}`}
        className="group flex h-full flex-col rounded-xl border border-border bg-white p-5 transition-[border-color,box-shadow] hover:border-ink/40 hover:shadow-card-hover"
      >
        <span className="flex items-center gap-2.5">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-lg"
            style={{ color: group.accent, backgroundColor: `${group.accent}14` }}
          >
            <GuideIcon name={group.icon} size={19} />
          </span>
          {showLabel && (
            <span className="text-[12px] font-extrabold uppercase tracking-[0.06em]" style={{ color: group.accent }}>
              {group.title}
            </span>
          )}
        </span>
        <h3 className="mt-4 font-heading text-[20px] font-semibold leading-snug text-ink group-hover:underline group-hover:underline-offset-4">
          {guide.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-muted">{guide.description}</p>
        <span className="mt-auto flex items-center justify-between pt-5 text-[13px] font-semibold text-ink">
          <span className="text-muted">{guide.minutes} min read</span>
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">Read →</span>
        </span>
      </Link>
    </li>
  )
}

/** Search + section filter. Everything is rendered on the server first, so crawlers and no-JS visitors see every guide. */
export function GuidesBrowser({ groups }: { groups: BrowserGroup[] }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<string>('all')

  const q = query.trim().toLowerCase()
  const total = useMemo(() => groups.reduce((n, g) => n + g.guides.length, 0), [groups])

  const visible = useMemo(() => {
    return groups
      .filter((g) => active === 'all' || g.id === active)
      .map((g) => ({
        ...g,
        guides: q ? g.guides.filter((x) => `${x.title} ${x.description}`.toLowerCase().includes(q)) : g.guides,
      }))
      .filter((g) => g.guides.length > 0)
  }, [groups, active, q])

  const shown = visible.reduce((n, g) => n + g.guides.length, 0)
  const chip = (id: string, label: string, count: number) => (
    <button
      key={id}
      type="button"
      onClick={() => setActive(id)}
      aria-pressed={active === id}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-4 text-[14px] font-semibold transition-colors ${
        active === id ? 'border-ink bg-ink text-white' : 'border-border bg-white text-ink hover:border-ink/40'
      }`}
    >
      {label}
      <span className={`text-[12px] font-bold ${active === id ? 'text-white/75' : 'text-muted'}`}>{count}</span>
    </button>
  )

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter guides by section" className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {chip('all', 'All guides', total)}
          {groups.map((g) => chip(g.id, g.title, g.guides.length))}
        </div>
        <label className="relative block w-full lg:w-72">
          <span className="sr-only">Search guides</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides"
            className="min-h-11 w-full rounded-lg border border-border bg-white px-4 text-[15px] text-ink placeholder:text-muted focus:border-ink"
          />
        </label>
      </div>

      <p className="sr-only" aria-live="polite">
        {shown} {shown === 1 ? 'guide' : 'guides'} shown
      </p>

      {visible.length === 0 ? (
        <p className="mt-10 rounded-xl border border-border bg-surface-warm p-6 text-[15px] text-muted">
          No guides match &ldquo;{query}&rdquo;. Try a shorter word such as &ldquo;stitch&rdquo; or &ldquo;yarn&rdquo;.
        </p>
      ) : (
        visible.map((g) => (
          <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="mt-12 scroll-mt-24 first:mt-10">
            <div className="flex flex-col gap-1 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
              <h2 id={`${g.id}-title`} className="type-h2 text-ink">{g.title}</h2>
              <p className="max-w-[52ch] text-[14px] leading-relaxed text-muted md:text-right">{g.intro}</p>
            </div>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.guides.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} group={g} showLabel={q !== ''} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
