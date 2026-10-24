'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { PRODUCT_IMAGE_CACHE_CONTROL, processAndUploadImage, sanitizeFilename, validateImageFile } from '../lib/imageVariants'
import { validatePdfFile } from '../lib/uploadValidation'
import type { Category } from '../lib/types'
import { Btn, Card, Chip, Empty, PageHeader, useAdminUi } from '../components/adminUi'
import { slugFromTitle } from '../lib/slug'

/** One entry of listings.json (all fields optional except what you want filled in). */
type Draft = {
  title?: string
  subtitle?: string
  description?: string
  materials?: string
  skill_level?: 'beginner' | 'intermediate' | 'advanced'
  category?: string
  price?: number
  compare_at_price?: number
  slug?: string
  meta_title?: string
  meta_description?: string
  pdf_pages?: number
  featured?: boolean
}

type Item = {
  key: string
  folder: string
  images: File[]
  pdf: File | null
  data: Draft
  hasText: boolean
  warnings: string[]
  selected: boolean
  state: 'ready' | 'working' | 'done' | 'error'
  step?: string
  error?: string
  productId?: string
}

const IMG = /\.(jpe?g|png|webp)$/i
const natural = (a: File, b: File) => a.name.localeCompare(b.name, undefined, { numeric: true })
const pretty = (s: string) => s.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()

async function readJson(file: File): Promise<Record<string, Draft>> {
  const raw = JSON.parse(await file.text())
  const out: Record<string, Draft> = {}
  if (Array.isArray(raw?.listings)) {
    for (const l of raw.listings) if (l?.folder) out[String(l.folder).toLowerCase()] = l
  } else if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) out[k.toLowerCase()] = v as Draft
  }
  return out
}

export function AdminImport() {
  const { confirm, toast } = useAdminUi()
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<Item[]>([])
  const [jsonName, setJsonName] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const patch = (key: string, p: Partial<Item>) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...p } : i)))

  const onFolder = async (list: FileList | null) => {
    setParseError(null)
    if (!list || list.length === 0) return
    const files = Array.from(list)
    // Paths look like Root/Pattern name/file.ext  (or Root/file.ext for root-level files)
    const rel = (f: File) => ((f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name).split('/')
    const jsonFile = files.find((f) => rel(f).length === 2 && /^listings\.json$/i.test(f.name)) ?? files.find((f) => /^listings\.json$/i.test(f.name))
    let texts: Record<string, Draft> = {}
    if (jsonFile) {
      try {
        texts = await readJson(jsonFile)
        setJsonName(jsonFile.name)
      } catch {
        setParseError('listings.json is not valid JSON. Ask Claude to regenerate it.')
        setJsonName(null)
      }
    } else setJsonName(null)

    const groups = new Map<string, File[]>()
    for (const f of files) {
      const parts = rel(f)
      if (parts.length >= 3) groups.set(parts[1], [...(groups.get(parts[1]) ?? []), f])
    }
    // A single pattern folder picked directly: Root/file.ext
    if (groups.size === 0) {
      const rootName = rel(files[0])[0] ?? 'Pattern'
      groups.set(rootName, files.filter((f) => rel(f).length === 2 && !/\.json$/i.test(f.name)))
    }

    const { data: cats } = await supabase.from('categories').select('id, name, slug')
    const catList = (cats ?? []) as Pick<Category, 'id' | 'name' | 'slug'>[]

    const next: Item[] = []
    for (const [folder, group] of groups) {
      const images = group.filter((f) => IMG.test(f.name)).sort(natural)
      const pdfs = group.filter((f) => /\.pdf$/i.test(f.name)).sort(natural)
      const data = texts[folder.toLowerCase()] ?? {}
      const hasText = !!(data.title || data.description)
      const warnings: string[] = []
      if (!pdfs.length) warnings.push('No PDF found')
      if (pdfs.length > 1) warnings.push(`${pdfs.length} PDFs found, using “${pdfs[0].name}”`)
      if (!images.length) warnings.push('No photos found')
      if (!hasText) warnings.push('No text for this folder in listings.json')
      if (data.category && !catList.some((c) => c.name.toLowerCase() === data.category!.toLowerCase())) warnings.push(`Category “${data.category}” doesn’t exist yet`)
      if (data.price == null) warnings.push('No price set — saved as 0 (free) until you change it')
      next.push({
        key: folder,
        folder,
        images,
        pdf: pdfs[0] ?? null,
        data,
        hasText,
        warnings,
        selected: images.length > 0 && pdfs.length > 0,
        state: 'ready',
      })
    }
    next.sort((a, b) => a.folder.localeCompare(b.folder, undefined, { numeric: true }))
    setItems(next)
  }

  const createOne = async (it: Item, categories: Pick<Category, 'id' | 'name'>[]) => {
    patch(it.key, { state: 'working', step: 'Checking…', error: undefined })
    try {
      const d = it.data
      const title = (d.title ?? pretty(it.folder)).trim()
      let slug = slugFromTitle(d.slug || title)
      for (let n = 2; ; n++) {
        const { data } = await supabase.from('products').select('id').eq('slug', slug).maybeSingle()
        if (!data) break
        slug = `${slugFromTitle(d.slug || title)}-${n}`
      }
      const category = d.category ? categories.find((c) => c.name.toLowerCase() === d.category!.toLowerCase()) : undefined

      // 1) photos → public bucket (same pipeline as the listing editor)
      const urls: string[] = []
      for (let i = 0; i < it.images.length; i++) {
        const file = it.images[i]
        patch(it.key, { step: `Photo ${i + 1} of ${it.images.length}…` })
        const v = await validateImageFile(file)
        if (!v.ok) throw new Error(`${file.name}: ${v.reason}`)
        const base = `${crypto.randomUUID()}-${sanitizeFilename(file.name)}`
        const res = await processAndUploadImage(
          file,
          async (path, blob) => {
            const { error } = await supabase.storage.from('product-images').upload(path, blob, { cacheControl: PRODUCT_IMAGE_CACHE_CONTROL, contentType: blob.type })
            if (error) throw error
            return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
          },
          base,
        )
        urls.push(res.url)
      }

      // 2) the draft listing (never live)
      patch(it.key, { step: 'Creating draft…' })
      const price = Number.isFinite(d.price) ? Number(d.price) : 0
      const { data: row, error } = await supabase
        .from('products')
        .insert({
          title,
          slug,
          subtitle: d.subtitle?.trim().slice(0, 150) || null,
          description: d.description || null,
          skill_level: d.skill_level ?? 'beginner',
          price,
          compare_at_price: d.compare_at_price ?? null,
          category_id: category?.id ?? null,
          images: urls,
          pdf_pages: d.pdf_pages ?? null,
          materials: d.materials || null,
          lemon_variant_id: '',
          lemon_numeric_variant_id: null,
          active: false,
          featured: !!d.featured,
          card_badge: null,
          sold_out: false,
          checkout_mode: 'overlay',
          is_bundle: false,
          bundle_includes: [],
          meta_title: d.meta_title?.trim() || null,
          meta_description: d.meta_description?.trim() || null,
        })
        .select('id')
        .single()
      if (error || !row) throw new Error(error?.message ?? 'Could not create the listing')

      // 3) PDF → private bucket
      if (it.pdf) {
        patch(it.key, { step: 'Uploading PDF…' })
        const v = await validatePdfFile(it.pdf)
        if (!v.ok) throw new Error(`${it.pdf.name}: ${v.reason} (the draft was created without the PDF)`)
        const { error: pe } = await supabase.storage.from('patterns').upload(`${row.id}.pdf`, it.pdf, { upsert: true, contentType: 'application/pdf', metadata: { originalName: it.pdf.name } })
        if (pe) throw new Error(`PDF upload failed: ${pe.message} (the draft was created without it)`)
        await supabase.from('products').update({ pdf_filename: it.pdf.name }).eq('id', row.id)
      }
      patch(it.key, { state: 'done', step: undefined, productId: row.id })
    } catch (e) {
      patch(it.key, { state: 'error', step: undefined, error: e instanceof Error ? e.message : 'Something went wrong' })
    }
  }

  const run = async () => {
    const todo = items.filter((i) => i.selected && i.state !== 'done')
    if (todo.length === 0) return
    const ok = await confirm({
      title: `Create ${todo.length} draft listing${todo.length === 1 ? '' : 's'}?`,
      body: 'They are saved as drafts, so nothing goes live. You can review and publish each one yourself.',
      confirmLabel: 'Create drafts',
    })
    if (!ok) return
    setRunning(true)
    const { data: cats } = await supabase.from('categories').select('id, name')
    for (const it of todo) await createOne(it, (cats ?? []) as Pick<Category, 'id' | 'name'>[])
    setRunning(false)
    toast('Import finished')
  }

  const done = items.filter((i) => i.state === 'done').length
  const failed = items.filter((i) => i.state === 'error').length

  return (
    <div>
      <PageHeader
        title="Smart import"
        desc="Pick a folder with one sub-folder per pattern (a PDF + photos in each). Drafts are created for you; you only add the Lemon Squeezy IDs and publish."
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple
              // @ts-expect-error non-standard but widely supported folder picker
              webkitdirectory=""
              onChange={(e) => {
                onFolder(e.target.files)
                e.target.value = ''
              }}
            />
            <Btn variant="primary" onClick={() => inputRef.current?.click()} disabled={running}>Choose folder</Btn>
          </>
        }
      />

      {parseError && <p role="alert" className="mb-4 rounded-xl bg-[#FEF3F2] px-4 py-3 text-[14px] text-[#B42318]">{parseError}</p>}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white">
          <Empty
            icon="auto_awesome"
            title="Choose your patterns folder"
            body={
              <>
                Layout: <b>New patterns / Amigurumi Bunny / pattern.pdf + 1.jpg, 2.jpg…</b> and one <b>listings.json</b> in the top folder with the SEO text (Claude writes this file for you).
              </>
            }
            action={<Btn variant="primary" onClick={() => inputRef.current?.click()}>Choose folder</Btn>}
          />
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-[14px]">
            <span>{items.length} pattern{items.length === 1 ? '' : 's'} found</span>
            <Chip tone={jsonName ? 'green' : 'amber'}>{jsonName ? `Text from ${jsonName}` : 'No listings.json — titles come from folder names'}</Chip>
            {done > 0 && <Chip tone="green">{done} created</Chip>}
            {failed > 0 && <Chip tone="red">{failed} failed</Chip>}
            <div className="flex-1" />
            <Btn variant="primary" onClick={run} disabled={running || items.every((i) => !i.selected || i.state === 'done')}>
              {running ? 'Creating…' : `Create ${items.filter((i) => i.selected && i.state !== 'done').length} draft${items.filter((i) => i.selected && i.state !== 'done').length === 1 ? '' : 's'}`}
            </Btn>
          </div>

          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.key}>
                <Card>
                  <div className="flex flex-wrap items-start gap-4">
                    <input
                      type="checkbox"
                      aria-label={`Include ${it.folder}`}
                      checked={it.selected}
                      disabled={it.state === 'done' || running}
                      onChange={(e) => patch(it.key, { selected: e.target.checked })}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{it.data.title ?? pretty(it.folder)}</p>
                      <p className="text-[12px] text-[#6b7280]">
                        Folder “{it.folder}” · {it.images.length} photo{it.images.length === 1 ? '' : 's'} · {it.pdf ? it.pdf.name : 'no PDF'}
                        {it.data.category ? ` · ${it.data.category}` : ''}
                      </p>
                      {it.data.subtitle && <p className="mt-1 text-[13px] text-[#4B5563]">{it.data.subtitle}</p>}
                      {it.warnings.length > 0 && it.state !== 'done' && (
                        <ul className="mt-2 space-y-0.5 text-[12px] text-[#B45309]">
                          {it.warnings.map((w) => <li key={w}>• {w}</li>)}
                        </ul>
                      )}
                      {it.state === 'error' && <p role="alert" className="mt-2 text-[13px] text-[#B42318]">{it.error}</p>}
                    </div>
                    <div className="text-right text-[13px]">
                      {it.state === 'working' && <span className="font-medium">{it.step}</span>}
                      {it.state === 'done' && it.productId && (
                        <Link href="/admin/listings?status=draft" className="font-medium text-deal underline">Created — open drafts</Link>
                      )}
                      {it.state === 'ready' && <Chip>{it.selected ? 'Will be a draft' : 'Skipped'}</Chip>}
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
