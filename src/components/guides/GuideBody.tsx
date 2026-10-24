import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import type { GuideBlock } from '@/lib/guides'

const LINK_RE = /\[([^\]]+)\]\((\/[^)\s]*)\)/g

/** Text with [label](/internal-path) links turned into real <a> elements. */
function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(LINK_RE)) {
    const i = m.index ?? 0
    if (i > last) parts.push(text.slice(last, i))
    parts.push(
      <Link key={i} href={m[2]} className="text-primary underline underline-offset-4">
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

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Renders the structured article body. Server component: all text is in the first HTML. */
export function GuideBody({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-muted md:text-[16px]">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'h2':
            return (
              <h2 key={i} id={slugifyHeading(b.text)} className="scroll-mt-24 pt-4 font-heading text-[26px] leading-tight text-ink md:text-[30px]">
                {b.text}
              </h2>
            )
          case 'p':
            return (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            )
          case 'ul':
            return (
              <ul key={i} className="list-disc space-y-2 pl-6">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="list-decimal space-y-2 pl-6">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <Inline text={it} />
                  </li>
                ))}
              </ol>
            )
          case 'note':
            return (
              <p key={i} className="rounded-[5px] border border-border bg-surface-warm px-4 py-3 font-mono text-[14px] text-ink">
                {b.text}
              </p>
            )
          case 'table':
            return (
              <div key={i} className="overflow-x-auto rounded-[5px] border border-border">
                <table className="w-full min-w-[420px] border-collapse text-left text-[14px]">
                  {b.caption && <caption className="px-4 py-2 text-left text-[13px] text-muted">{b.caption}</caption>}
                  <thead className="bg-surface-warm text-ink">
                    <tr>
                      {b.head.map((h) => (
                        <th key={h} scope="col" className="px-4 py-2.5 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, r) => (
                      <tr key={r} className="border-t border-border">
                        {row.map((cell, c) => (
                          <td key={c} className="px-4 py-2.5 align-top">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      })}
    </div>
  )
}
