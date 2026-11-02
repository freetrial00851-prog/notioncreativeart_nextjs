'use client'

import { useEffect, useState } from 'react'
import { scrollToId } from '@/lib/smoothScroll'

type Item = { id: string; text: string }

function useActiveId(items: Item[]): string {
  const [active, setActive] = useState(items[0]?.id ?? '')
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e)
    if (els.length === 0) return
    const onScroll = () => {
      // The last heading that has passed the top third of the screen is the one being read.
      const line = window.innerHeight * 0.33
      let current = els[0].id
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])
  return active
}

function jump(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  if (scrollToId(id)) e.preventDefault()
}

/** Closed panel above the article on phones and tablets. */
export function GuideTocMobile({ items }: { items: Item[] }) {
  if (items.length < 3) return null
  return (
      <details className="mb-8 rounded-xl border border-border bg-surface-warm lg:hidden">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between px-5 text-[15px] font-bold text-ink">
          In this guide
          <span className="text-[13px] font-semibold text-muted">{items.length} sections</span>
        </summary>
        <ol className="space-y-1 px-5 pb-4">
          {items.map((i) => (
            <li key={i.id}>
              <a href={`#${i.id}`} onClick={(e) => jump(e, i.id)} className="flex min-h-11 items-center text-[15px] text-ink hover:underline">
                {i.text}
              </a>
            </li>
          ))}
        </ol>
      </details>
  )
}

/** Sticky "On this page" list beside the article on large screens. */
export function GuideTocSidebar({ items }: { items: Item[] }) {
  const active = useActiveId(items)
  if (items.length < 3) return null
  return (
      <nav aria-label="On this page" className="sticky top-28 hidden lg:block">
        <p className="mb-3 text-[12px] font-extrabold uppercase tracking-[0.06em] text-muted">On this page</p>
        <ol className="space-y-0.5 border-l border-border">
          {items.map((i) => {
            const on = i.id === active
            return (
              <li key={i.id}>
                <a
                  href={`#${i.id}`}
                  onClick={(e) => jump(e, i.id)}
                  aria-current={on ? 'location' : undefined}
                  className={`-ml-px block border-l-2 py-1.5 pl-4 text-[14px] leading-snug transition-colors ${
                    on ? 'border-coral font-bold text-ink' : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  {i.text}
                </a>
              </li>
            )
          })}
        </ol>
      </nav>
  )
}
