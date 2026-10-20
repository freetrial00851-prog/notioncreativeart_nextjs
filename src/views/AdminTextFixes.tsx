'use client'

import { useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { revalidateStorefront } from '../lib/actions/revalidateStorefront'
import { clearHomeCatalogCache } from '../lib/homeCatalogCache'
import { Btn, Card, Chip, Empty, PageHeader, SearchBox, useAdminUi } from '../components/adminUi'

/** The ONLY columns this tool may ever write. Price, photos, PDF, status and slug are untouchable. */
const FIELDS = ['title', 'subtitle', 'description', 'materials', 'pdf_pages', 'meta_title', 'meta_description'] as const
type Field = (typeof FIELDS)[number]
const LABEL: Record<Field, string> = {
  title: 'Title',
  subtitle: 'Short line',
  description: 'Description',
  materials: 'Materials',
  pdf_pages: 'PDF pages',
  meta_title: 'Google title',
  meta_description: 'Google description',
}
const LIMIT: Partial<Record<Field, number>> = { title: 160, subtitle: 200, meta_title: 70, meta_description: 200, description: 6000, materials: 3000 }

type Fix = { id: string; slug?: string; new: Partial<Record<Field, string | number | null>>; flags?: string[] }
type Row = Fix & {
  current: Record<string, unknown> | null
  changes: { field: Field; from: unknown; to: unknown }[]
  selected: boolean
  state: 'ready' | 'working' | 'done' | 'error' | 'missing'
  error?: string
  title: string
}

const show = (v: unknown) => (v == null || v === '' ? '—' : String(v))
const same = (a: unknown, b: unknown) => (a ?? null) === (b ?? null) || String(a ?? '').trim() === String(b ?? '').trim()

export function AdminTextFixes() {
  const { confirm, toast } = useAdminUi()
  const input = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [q, setQ] = useState('')
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const patch = (id: string, p: Partial<Row>) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)))

  const onFile = async (file: File | undefined) => {
    setParseError(null)
    if (!file) return
    let fixes: Fix[]
    try {
      const raw = JSON.parse(await file.text())
      fixes = Array.isArray(raw) ? raw : raw.fixes
      if (!Array.isArray(fixes)) throw new Error('No list found')
    } catch {
      setParseError('This is not a valid fixes.json file.')
      return
    }
    setLoading(true)
    const ids = fixes.map((f) => f.id)
    const current = new Map<string, Record<string, unknown>>()
    for (let i = 0; i < ids.length; i += 100) {
      const { data } = await supabase.from('products').select(['id', ...FIELDS].join(',')).in('id', ids.slice(i, i + 100))
      for (const r of (data ?? []) as unknown as Record<string, unknown>[]) current.set(String(r.id), r)
    }
    const built: Row[] = fixes.map((f) => {
      const cur = current.get(f.id) ?? null
      const changes: Row['changes'] = []
      for (const k of FIELDS) {
        if (!(k in f.new)) continue
        const to = f.new[k]
        if (cur && !same(cur[k], to)) changes.push({ field: k, from: cur[k], to })
      }
      return {
        ...f,
        current: cur,
        changes,
        title: String(cur?.title ?? f.slug ?? f.id),
        selected: !!cur && changes.length > 0 && !(f.flags && f.flags.length > 0),
        state: cur ? 'ready' : 'missing',
      }
    })
    setRows(built.filter((r) => r.changes.length > 0 || r.state === 'missing'))
    setLoading(false)
  }

  const visible = useMemo(
    () =>
      rows.filter((r) => {
        if (onlyFlagged && !(r.flags && r.flags.length)) return false
        if (q && !`${r.title} ${r.slug ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false
        return true
      }),
    [rows, q, onlyFlagged],
  )
  const toApply = rows.filter((r) => r.selected && r.state !== 'done' && r.state !== 'missing')

  const apply = async () => {
    if (toApply.length === 0) return
    const fieldCount = toApply.reduce((n, r) => n + r.changes.length, 0)
    const ok = await confirm({
      title: `Update ${toApply.length} listing${toApply.length === 1 ? '' : 's'}?`,
      body: `${fieldCount} text fields will change. Prices, photos, PDFs, live/draft status and web addresses are not touched. Anything wrong can be edited again in the listing editor.`,
      confirmLabel: 'Apply changes',
    })
    if (!ok) return
    setRunning(true)
    let okCount = 0
    for (const r of toApply) {
      patch(r.id, { state: 'working', error: undefined })
      const update: Record<string, unknown> = {}
      for (const c of r.changes) {
        const lim = LIMIT[c.field]
        const v = c.to
        if (typeof v === 'string' && lim && v.length > lim) {
          update.__error = `${LABEL[c.field]} is too long`
          break
        }
        if (typeof v === 'string' && v.includes('�')) {
          update.__error = `${LABEL[c.field]} still contains a broken character`
          break
        }
        update[c.field] = c.field === 'pdf_pages' ? (v == null ? null : Number(v)) : typeof v === 'string' && v.trim() === '' ? null : v
      }
      if (update.__error) {
        patch(r.id, { state: 'error', error: String(update.__error) })
        continue
      }
      const { error } = await supabase.from('products').update(update).eq('id', r.id)
      if (error) patch(r.id, { state: 'error', error: error.message })
      else {
        okCount++
        patch(r.id, { state: 'done' })
      }
    }
    clearHomeCatalogCache()
    try {
      await revalidateStorefront()
    } catch {
      /* pages refresh within a minute anyway */
    }
    setRunning(false)
    toast(`${okCount} listing${okCount === 1 ? '' : 's'} updated`)
  }

  const doneN = rows.filter((r) => r.state === 'done').length
  const errN = rows.filter((r) => r.state === 'error').length
  const flaggedN = rows.filter((r) => r.flags && r.flags.length).length

  return (
    <div>
      <PageHeader
        title="Text fixes"
        desc="Review proposed text corrections (broken characters, titles, Google titles and descriptions, materials, page counts) side-by-side, then apply the ones you like."
        actions={
          <>
            <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
            <Btn variant="primary" onClick={() => input.current?.click()} disabled={running}>Choose fixes.json</Btn>
          </>
        }
      />
      {parseError && <p role="alert" className="mb-4 rounded-xl bg-[#FEF3F2] px-4 py-3 text-[14px] text-[#B42318]">{parseError}</p>}

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[#ECEEF0]" />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white">
          <Empty icon="description" title="Choose the fixes file" body="Claude prepares fixes.json for you. You see every change before it is saved, and you can untick any listing." action={<Btn variant="primary" onClick={() => input.current?.click()}>Choose fixes.json</Btn>} />
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-[14px]">
            <span>{rows.length} listings with changes</span>
            {flaggedN > 0 && <Chip tone="amber">{flaggedN} need a look (unticked)</Chip>}
            {doneN > 0 && <Chip tone="green">{doneN} updated</Chip>}
            {errN > 0 && <Chip tone="red">{errN} failed</Chip>}
            <div className="flex-1" />
            <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={onlyFlagged} onChange={(e) => setOnlyFlagged(e.target.checked)} className="h-4 w-4" /> Only those needing a look</label>
            <SearchBox value={q} onChange={setQ} placeholder="Search listings" />
            <Btn onClick={() => setRows((p) => p.map((r) => (r.state === 'ready' && r.changes.length && !(r.flags && r.flags.length) ? { ...r, selected: true } : r)))} disabled={running}>Tick all clean ones</Btn>
            <Btn variant="primary" onClick={apply} disabled={running || toApply.length === 0}>{running ? 'Updating…' : `Apply ${toApply.length}`}</Btn>
          </div>

          <ul className="space-y-3">
            {visible.map((r) => (
              <li key={r.id}>
                <Card>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" aria-label={`Include ${r.title}`} checked={r.selected} disabled={r.state === 'done' || r.state === 'missing' || running} onChange={(e) => patch(r.id, { selected: e.target.checked })} className="mt-1 h-4 w-4" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[15px] font-semibold">{r.title}</p>
                        {r.state === 'done' && <Chip tone="green">Updated</Chip>}
                        {r.state === 'missing' && <Chip tone="red">Not found in your shop</Chip>}
                        {r.state === 'working' && <Chip>Saving…</Chip>}
                      </div>
                      {r.flags && r.flags.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-[12px] text-[#B45309]">{r.flags.map((f) => <li key={f}>⚠ {f}</li>)}</ul>
                      )}
                      {r.state === 'error' && <p role="alert" className="mt-1 text-[13px] text-[#B42318]">{r.error}</p>}
                      <div className="mt-3 space-y-3">
                        {r.changes.map((c) => (
                          <div key={c.field}>
                            <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#6b7280]">{LABEL[c.field]}</p>
                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="whitespace-pre-wrap rounded-lg bg-[#FEF3F2] px-3 py-2 text-[13px] leading-relaxed text-[#7A271A]"><span className="mb-0.5 block text-[11px] font-semibold uppercase text-[#B42318]">Now</span>{show(c.from)}</div>
                              <div className="whitespace-pre-wrap rounded-lg bg-[#E7F5EC] px-3 py-2 text-[13px] leading-relaxed text-[#14532D]"><span className="mb-0.5 block text-[11px] font-semibold uppercase text-[#15803D]">New</span>{show(c.to)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
