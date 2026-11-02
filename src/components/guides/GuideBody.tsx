import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import type { GuideBlock } from '@/lib/guides'
import { slugifyHeading } from '@/lib/guideMeta'

const LINK_RE = /\[([^\]]+)\]\((\/[^)\s]*)\)/g

/** Text with [label](/internal-path) links turned into real <a> elements. */
function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(LINK_RE)) {
    const i = m.index ?? 0
    if (i > last) parts.push(text.slice(last, i))
    parts.push(
      <Link key={i} href={m[2]} className="font-semibold text-ink underline decoration-coral decoration-2 underline-offset-4 hover:text-coral">
        {m[1]}
      </Link>,
    )
    last = i + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  )
}

/** Renders the structured article body. Server component: all text is in the first HTML. */
export function GuideBody({ blocks }: { blocks: GuideBlock[] }) {
  // Same de-duplication as the table of contents, so every "On this page" link finds its heading.
  const seen = new Map<string, number>()
  const headingId = (text: string) => {
    const base = slugifyHeading(text)
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    return n === 1 ? base : `${base}-${n}`
  }

  return (
    <div className="space-y-5 text-[16px] leading-[1.75] text-ink/80 md:text-[17px]">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h2':
            return (
              <h2
                key={i}
                id={headingId(b.text)}
                className="scroll-mt-28 border-t border-border pt-10 font-heading text-[26px] font-semibold leading-tight text-ink first:border-0 first:pt-0 md:text-[32px]"
              >
                {b.text}
              </h2>
            )
          case 'p':
            return (
              <p key={i} className={i === 0 ? 'text-[18px] leading-[1.7] text-ink md:text-[20px]' : undefined}>
                <Inline text={b.text} />
              </p>
            )
          case 'ul':
            return (
              <ul key={i} className="list-disc space-y-2.5 pl-6 marker:text-coral">
                {b.items.map((it, j) => (
                  <li key={j} className="pl-1">
                    <Inline text={it} />
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="guide-steps space-y-4">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ol>
            )
          case 'note':
            return (
              <aside key={i} className="rounded-lg border border-border border-l-4 border-l-coral bg-surface-warm px-5 py-4 text-[15px] leading-relaxed text-ink md:text-[16px]">
                <Inline text={b.text} />
              </aside>
            )
          case 'table':
            return (
              <figure key={i} className="overflow-hidden rounded-xl border border-border bg-white">
                {b.caption && (
                  <figcaption className="border-b border-border bg-surface-warm px-4 py-3 text-[13px] font-bold uppercase tracking-[0.04em] text-ink">
                    {b.caption}
                  </figcaption>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[460px] border-collapse text-left text-[15px] leading-snug">
                    <thead>
                      <tr className="border-b border-border text-ink">
                        {b.head.map((h) => (
                          <th key={h} scope="col" className="px-4 py-3 text-[13px] font-extrabold uppercase tracking-[0.04em]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {b.rows.map((row, r) => (
                        <tr key={r} className="border-t border-border even:bg-surface-warm/60">
                          {row.map((cell, c) => (
                            <td key={c} className={`px-4 py-3 align-top ${c === 0 ? 'font-semibold text-ink' : ''}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </figure>
            )
        }
      })}
    </div>
  )
}
