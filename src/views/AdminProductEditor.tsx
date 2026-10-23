'use client'

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { DropzoneUpload } from '../components/DropzoneUpload'
import { MaterialIcon } from '../components/MaterialIcon'
import { validatePdfFile } from '../lib/uploadValidation'
import { triggerPdfDownload } from '../lib/downloads'
import { deriveVariantUrl } from '../lib/imageVariants'
import type { Category } from '../lib/types'
import { Btn, Card, Chip, Field, Toggle, inputCls, textareaCls, slugify, useAdminUi } from '../components/adminUi'

export type ProductForm = {
  id: string
  title: string
  slug: string
  subtitle: string
  description: string
  skill_level: 'beginner' | 'intermediate' | 'advanced'
  itemType: 'free' | 'paid'
  price: string
  compare_at_price: string
  category_id: string
  images: string[]
  pdf_pages: string
  materials: string
  lemon_variant_id: string
  lemon_numeric_variant_id: string
  checkout_provider: 'lemonsqueezy' | 'paddle'
  paddle_price_id: string
  paddle_price_id_sandbox: string
  active: boolean
  featured: boolean
  card_badge: '' | 'sale' | 'new' | 'featured'
  sold_out: boolean
  checkout_mode: 'overlay' | 'hosted'
  is_bundle: boolean
  bundle_includes: string[]
  meta_title: string
  meta_description: string
}

export type PdfInfo = { sizeKb: number; date: string; originalName: string } | null

type Props = {
  form: ProductForm
  setForm: Dispatch<SetStateAction<ProductForm>>
  categories: Category[]
  saving: boolean
  saveError: string | null
  uploadingImages: boolean
  uploadingPdf: boolean
  pdfUploaded: boolean
  pdfInfo: PdfInfo
  onUploadImages: (files: File[]) => void
  onRemoveImage: (url: string) => void
  onReorderImages: (from: number, to: number) => void
  onUploadPdf: (file: File, productId: string) => void
  onSave: (publish: boolean) => Promise<string | null>
  onClose: () => void
  onTrash: (id: string) => void
}

function sortedForDropdown(categories: Category[]): Category[] {
  const parents = categories.filter((c) => !c.parent_id)
  const out: Category[] = []
  for (const p of parents) {
    out.push(p)
    out.push(...categories.filter((c) => c.parent_id === p.id))
  }
  return out
}

function Segmented<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { id: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-full border border-[#D1D5DB] bg-white p-0.5">
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          role="radio"
          aria-checked={value === i.id}
          onClick={() => onChange(i.id)}
          className={`min-h-9 rounded-full px-4 text-[13px] font-medium transition-colors ${value === i.id ? 'bg-ink text-white' : 'text-[#4B5563] hover:text-ink'}`}
        >
          {i.label}
        </button>
      ))}
    </div>
  )
}

export function ProductEditor(p: Props) {
  const { form, setForm } = p
  const { confirm, toast } = useAdminUi()
  const isFree = form.itemType === 'free'
  const priceNum = form.price.trim() === '' ? null : parseFloat(form.price)
  const compareNum = form.compare_at_price.trim() === '' ? null : parseFloat(form.compare_at_price)
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(form))
  const dirty = JSON.stringify(form) !== snapshot
  const [touchedSave, setTouchedSave] = useState(false)

  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const checklist: { id: string; label: string; done: boolean; anchor: string }[] = [
    { id: 'title', label: 'Title', done: !!form.title.trim(), anchor: 'ed-basics' },
    { id: 'desc', label: 'Description', done: !!form.description.trim(), anchor: 'ed-basics' },
    { id: 'cat', label: 'Category', done: !!form.category_id, anchor: 'ed-org' },
    { id: 'img', label: 'At least one photo', done: form.images.length > 0, anchor: 'ed-photos' },
    { id: 'pdf', label: 'Pattern PDF uploaded', done: p.pdfUploaded, anchor: 'ed-file' },
    ...(isFree
      ? []
      : [
          { id: 'price', label: 'Price above $0', done: !!(priceNum && priceNum > 0), anchor: 'ed-price' },
          form.checkout_provider === 'paddle'
            ? { id: 'paddle', label: 'Price ID from Paddle (live or test)', done: !!form.paddle_price_id.trim() || !!form.paddle_price_id_sandbox.trim(), anchor: 'ed-checkout' }
            : { id: 'lemon', label: 'Checkout IDs from Lemon Squeezy', done: !!form.lemon_variant_id.trim() && !!form.lemon_numeric_variant_id.trim(), anchor: 'ed-checkout' },
        ]),
  ]
  const doneCount = checklist.filter((c) => c.done).length
  const canPublish = doneCount === checklist.length
  const jump = (anchor: string) => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const doSave = async (publish: boolean) => {
    setTouchedSave(true)
    const id = await p.onSave(publish)
    if (!id) return
    setSnapshot(JSON.stringify({ ...form, id, active: publish }))
    toast(publish ? (form.active ? 'Changes published' : 'Published — it’s live on the shop') : 'Saved as draft')
    if (publish) p.onClose()
  }

  const back = async () => {
    if (dirty && !(await confirm({ title: 'Leave without saving?', body: 'You have changes that haven’t been saved.', confirmLabel: 'Leave', tone: 'danger' }))) return
    p.onClose()
  }

  const discount = compareNum && priceNum && compareNum > priceNum ? Math.round((1 - priceNum / compareNum) * 100) : null
  const titleErr = touchedSave && !form.title.trim() ? 'Add a title to save.' : null
  const compareErr = compareNum != null && priceNum != null && compareNum <= priceNum ? 'Should be higher than the price, otherwise no strikethrough shows.' : null

  return (
    <div className="pb-24">
      <div className="sticky top-14 z-20 -mx-4 mb-5 flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] bg-[#F6F6F7]/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <button onClick={back} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white" aria-label="Back to listings">
          <MaterialIcon name="arrow_back" size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{form.title || (form.id ? 'Untitled listing' : 'New listing')}</p>
          <p className="flex items-center gap-2 text-[12px] text-[#6b7280]">
            {form.id ? (form.active ? <Chip tone="green">Live</Chip> : <Chip>Draft</Chip>) : <Chip>Not saved yet</Chip>}
            {dirty && <span className="text-[#B45309]">Unsaved changes</span>}
          </p>
        </div>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        {form.slug && form.id && (
          <a href={`/pattern/${form.slug}`} target="_blank" rel="noreferrer" className="hidden min-h-10 items-center rounded-full border border-[#D1D5DB] bg-white px-4 text-[13px] hover:bg-[#F6F6F7] sm:inline-flex">
            View on shop ↗
          </a>
        )}
        <Btn size="sm" disabled={p.saving} onClick={() => doSave(false)}>{form.active && form.id ? 'Unpublish & save' : 'Save draft'}</Btn>
        <Btn size="sm" variant="primary" disabled={p.saving || !canPublish} onClick={() => doSave(true)} title={canPublish ? '' : 'Finish the checklist first'}>
          {p.saving ? 'Saving…' : form.active ? 'Save changes' : 'Publish'}
        </Btn>
        </div>
      </div>

      {p.saveError && (
        <div role="alert" className="mb-4 rounded-xl border border-[#F3C4C4] bg-[#FEF3F2] px-4 py-3 text-[14px] text-[#B42318]">{p.saveError}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-5">
          <Card id="ed-basics" title="Basics">
            <div className="space-y-4">
              <Field label="Title" right={`${form.title.length}/120`} error={titleErr}>
                <input
                  value={form.title}
                  maxLength={120}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  onBlur={() => !form.slug && setForm((f) => ({ ...f, slug: slugify(f.title) }))}
                  className={inputCls}
                  placeholder="e.g. Granny Stripe Cardigan Pattern"
                />
              </Field>
              <Field label="Short line under the title" right={`${form.subtitle.length}/150`} hint="One sentence that sells it. Shown on the product page and helps Google.">
                <input value={form.subtitle} maxLength={150} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputCls} placeholder="A cosy, beginner-friendly cardigan worked in one piece" />
              </Field>
              <Field label="Description" hint="What the pattern makes, who it’s for, finished size, what’s in the PDF.">
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={textareaCls} rows={8} />
              </Field>
            </div>
          </Card>

          <Card id="ed-photos" title="Photos" desc="The first photo is the cover shown on shop cards. Drag to reorder.">
            <DropzoneUpload
              label=""
              sizeHint="Landscape 4:3 works best, at least 1600px wide. JPG or PNG. They’re compressed automatically."
              urls={form.images}
              accept="image/jpeg,image/png"
              acceptLabel="JPEG or PNG"
              uploading={p.uploadingImages}
              onAdd={p.onUploadImages}
              onRemove={p.onRemoveImage}
              onReorder={p.onReorderImages}
            />
          </Card>

          <Card id="ed-file" title="Pattern file (PDF)" desc="What customers download after they pay. Replacing it updates it for past buyers too.">
            {form.id ? (
              <PdfDropzone uploading={p.uploadingPdf} uploaded={p.pdfUploaded} info={p.pdfInfo} productId={form.id} productTitle={form.title} onSelect={(f) => p.onUploadPdf(f, form.id)} />
            ) : (
              <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-[#FAFAFA] p-5 text-center">
                <p className="text-[14px] text-[#4B5563]">The PDF is attached to the listing, so save it once first.</p>
                <Btn className="mt-3" disabled={p.saving || !form.title.trim()} onClick={() => doSave(false)}>
                  Save draft &amp; unlock upload
                </Btn>
                {!form.title.trim() && <p className="mt-2 text-[12px] text-[#6b7280]">Add a title first.</p>}
              </div>
            )}
          </Card>

          <Card id="ed-price" title="Pricing">
            <div className="space-y-4">
              <Segmented
                label="Price type"
                value={form.itemType}
                onChange={(v) => setForm({ ...form, itemType: v, price: v === 'free' ? '0' : form.price === '0' ? '' : form.price, is_bundle: v === 'free' ? false : form.is_bundle })}
                items={[{ id: 'paid', label: 'Paid' }, { id: 'free', label: 'Free download' }]}
              />
              {isFree ? (
                <p className="text-[13px] text-[#6b7280]">Free patterns need no checkout. Customers sign in and download straight away.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Price (USD)">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7280]">$</span>
                      <input inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={`${inputCls} pl-7`} placeholder="6.50" />
                    </div>
                  </Field>
                  <Field label="Old price (optional)" error={compareErr} hint={discount ? `Shows as ${discount}% off with the old price struck through.` : 'Fill this to show a sale: the old price appears crossed out.'}>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b7280]">$</span>
                      <input inputMode="decimal" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} className={`${inputCls} pl-7`} />
                    </div>
                  </Field>
                </div>
              )}
            </div>
          </Card>

          {!isFree && (
            <Card id="ed-checkout" title="Checkout" desc="Choose who takes the payment for this listing, then add its IDs.">
              <div className="space-y-4">
                <div>
                  <p className="mb-1.5 text-[13px] font-medium">Sell this pattern with</p>
                  <Segmented label="Payment provider" value={form.checkout_provider} onChange={(v) => setForm({ ...form, checkout_provider: v })} items={[{ id: 'lemonsqueezy', label: 'Lemon Squeezy' }, { id: 'paddle', label: 'Paddle' }]} />
                </div>
                {form.checkout_provider === 'lemonsqueezy' ? (
                  <>
                    <Field label="Checkout ID" hint="Lemon Squeezy → Products → your product → Share → the long code at the end of the link.">
                      <input value={form.lemon_variant_id} onChange={(e) => setForm({ ...form, lemon_variant_id: e.target.value.trim() })} className={inputCls} placeholder="a208e95b-8f17-407f-b7a7-115583bed5a5" />
                    </Field>
                    <Field label="Variant ID (number)" hint="Lemon Squeezy → Products → your product → Variants → the number in the web address.">
                      <input inputMode="numeric" value={form.lemon_numeric_variant_id} onChange={(e) => setForm({ ...form, lemon_numeric_variant_id: e.target.value.trim() })} className={inputCls} placeholder="1255414" />
                    </Field>
                    <div>
                      <p className="mb-1.5 text-[13px] font-medium">Checkout style</p>
                      <Segmented label="Checkout style" value={form.checkout_mode} onChange={(v) => setForm({ ...form, checkout_mode: v })} items={[{ id: 'overlay', label: 'Pop-up on the page' }, { id: 'hosted', label: 'Separate page' }]} />
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Paddle price ID (live)" hint="Paddle → Catalog → Products → this product → its price → the ID starting with pri_. Leave empty until your live Paddle account is approved.">
                      <input value={form.paddle_price_id} onChange={(e) => setForm({ ...form, paddle_price_id: e.target.value.trim() })} className={inputCls} placeholder="pri_01abc..." />
                    </Field>
                    <Field label="Paddle price ID (test)" hint="Same place in your Paddle sandbox account. Used only while testing.">
                      <input value={form.paddle_price_id_sandbox} onChange={(e) => setForm({ ...form, paddle_price_id_sandbox: e.target.value.trim() })} className={inputCls} placeholder="pri_01xyz..." />
                    </Field>
                    <p className="text-[12px] text-[#6b7280]">Until Paddle checkout is switched on for the shop, customers still pay through Lemon Squeezy.</p>
                  </>
                )}
              </div>
            </Card>
          )}

          <Card title="Pattern details">
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-[13px] font-medium">Skill level</p>
                <Segmented label="Skill level" value={form.skill_level} onChange={(v) => setForm({ ...form, skill_level: v })} items={[{ id: 'beginner', label: 'Beginner' }, { id: 'intermediate', label: 'Intermediate' }, { id: 'advanced', label: 'Advanced' }]} />
              </div>
              <Field label="Pages in the PDF">
                <input inputMode="numeric" value={form.pdf_pages} onChange={(e) => setForm({ ...form, pdf_pages: e.target.value.replace(/[^0-9]/g, '') })} className={`${inputCls} sm:max-w-[140px]`} />
              </Field>
              <Field label="Materials needed" hint="One per line.">
                <textarea value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} rows={4} className={textareaCls} placeholder={'5mm (US H/8) crochet hook\nDK weight yarn, approx 400 yds'} />
              </Field>
            </div>
          </Card>

          {!isFree && (
            <Card title="Bundle" desc="Turn this on if the listing sells several patterns together.">
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-4 text-[14px]">
                  This is a bundle
                  <Toggle label="This is a bundle" checked={form.is_bundle} onChange={(v) => setForm({ ...form, is_bundle: v })} />
                </label>
                {form.is_bundle && (
                  <div className="space-y-2">
                    <p className="text-[13px] text-[#6b7280]">What’s included — one pattern per line.</p>
                    {form.bundle_includes.map((line, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={line} onChange={(e) => { const next = [...form.bundle_includes]; next[i] = e.target.value; setForm({ ...form, bundle_includes: next }) }} className={inputCls} placeholder="Pattern name" />
                        <Btn variant="ghost" aria-label="Remove line" onClick={() => setForm({ ...form, bundle_includes: form.bundle_includes.filter((_, idx) => idx !== i) })}>✕</Btn>
                      </div>
                    ))}
                    <Btn size="sm" onClick={() => setForm({ ...form, bundle_includes: [...form.bundle_includes, ''] })}>+ Add a pattern</Btn>
                  </div>
                )}
              </div>
            </Card>
          )}

          <details className="group rounded-2xl border border-[#E5E7EB] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
              <span>
                <span className="block text-[15px] font-semibold">Google &amp; web address</span>
                <span className="block text-[13px] text-[#6b7280]">Optional. Leave empty and it’s filled in for you.</span>
              </span>
              <span aria-hidden className="text-[#8a8f98] transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="space-y-4 border-t border-[#EEF0F2] p-5">
              <Field label="Web address" hint={<>notioncreativeart.com/pattern/<b>{form.slug || slugify(form.title) || 'your-pattern'}</b></>}>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className={inputCls} placeholder="granny-stripe-cardigan" />
              </Field>
              <Field label="Google title" right={`${form.meta_title.length}/60`}>
                <input value={form.meta_title} maxLength={70} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} className={inputCls} placeholder={form.title || 'Pattern title'} />
              </Field>
              <Field label="Google description" right={`${form.meta_description.length}/155`}>
                <textarea value={form.meta_description} maxLength={200} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} className={textareaCls} rows={3} placeholder={form.description.slice(0, 155)} />
              </Field>
              <div className="rounded-xl bg-[#F6F6F7] p-4">
                <p className="text-[12px] text-[#6b7280]">How it can look in Google</p>
                <p className="mt-1 text-[17px] leading-tight text-[#1a0dab]">{form.meta_title || form.title || 'Pattern title'}</p>
                <p className="text-[12px] text-[#188038]">notioncreativeart.com › pattern › {form.slug || slugify(form.title) || '…'}</p>
                <p className="mt-0.5 text-[13px] text-[#4B5563]">{(form.meta_description || form.description || 'Description').slice(0, 155)}</p>
              </div>
            </div>
          </details>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-32 lg:self-start">
          <Card title="Ready to publish?" aside={<span className="text-[13px] font-semibold tabular-nums">{doneCount}/{checklist.length}</span>}>
            <div className="mb-3 h-1.5 rounded-full bg-[#ECEEF0]"><div className="h-1.5 rounded-full bg-deal transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} /></div>
            <ul className="space-y-1">
              {checklist.map((c) => (
                <li key={c.id}>
                  <button onClick={() => jump(c.anchor)} className="flex min-h-9 w-full items-center gap-2.5 rounded-lg px-1 text-left text-[14px] hover:bg-[#F6F6F7]">
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${c.done ? 'bg-deal text-white' : 'border border-[#D1D5DB] text-transparent'}`}>✓</span>
                    <span className={c.done ? 'text-[#6b7280] line-through decoration-[#C9CDD2]' : ''}>{c.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            {canPublish && !form.active && <p className="mt-3 text-[13px] text-deal">All set — you can publish.</p>}
          </Card>

          <Card id="ed-org" title="Organise">
            <div className="space-y-4">
              <Field label="Category">
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputCls}>
                  <option value="">Choose a category</option>
                  {sortedForDropdown(p.categories).map((c) => (
                    <option key={c.id} value={c.id}>{c.parent_id ? `— ${c.name}` : c.name}</option>
                  ))}
                </select>
              </Field>
              <label className="flex items-center justify-between gap-4 text-[14px]">
                <span>Show on the homepage<span className="block text-[12px] text-[#6b7280]">Featured patterns appear in “Patterns to fall for”.</span></span>
                <Toggle label="Featured on homepage" checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
              </label>
              <div>
                <p className="mb-1.5 text-[13px] font-medium">Card badge</p>
                <Segmented label="Card badge" value={form.card_badge} onChange={(v) => setForm({ ...form, card_badge: v })} items={[{ id: '', label: 'None' }, { id: 'sale', label: 'Sale' }, { id: 'new', label: 'New' }, { id: 'featured', label: 'Featured' }]} />
              </div>
              <label className="flex items-center justify-between gap-4 text-[14px]">
                <span>Mark as sold out<span className="block text-[12px] text-[#6b7280]">Hides the buy button.</span></span>
                <Toggle label="Sold out" checked={form.sold_out} onChange={(v) => setForm({ ...form, sold_out: v })} />
              </label>
            </div>
          </Card>

          <Card title="How it looks in the shop">
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
              <div className="aspect-[4/3] bg-[#F1F2F4]">
                {form.images[0] ? <img src={deriveVariantUrl(form.images[0], 'thumb')} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[13px] text-[#9AA0A8]">Cover photo</div>}
              </div>
              <div className="p-3">
                <p className="truncate text-[14px] font-semibold">{form.title || 'Pattern title'}</p>
                <p className="mt-0.5 text-[15px] font-bold">
                  {isFree ? <span>Free</span> : (
                    <>
                      <span className={discount ? 'text-deal' : ''}>${priceNum != null && !Number.isNaN(priceNum) ? priceNum.toFixed(2) : '0.00'}</span>
                      {discount ? <del className="ml-2 text-[13px] font-semibold text-sale">${compareNum?.toFixed(2)}</del> : null}
                    </>
                  )}
                </p>
              </div>
            </div>
          </Card>

          {form.id && (
            <Btn variant="danger" className="w-full" onClick={() => p.onTrash(form.id)}>Move to trash</Btn>
          )}
        </aside>
      </div>
    </div>
  )
}

function PdfDropzone({ uploading, uploaded, info, productId, productTitle, onSelect }: {
  uploading: boolean
  uploaded: boolean
  info: PdfInfo
  productId: string
  productTitle: string
  onSelect: (file: File) => void
}) {
  const { confirm, toast } = useAdminUi()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const displayName = info?.originalName || fileName || (productTitle ? `${productTitle}.pdf` : 'pattern.pdf')

  const handleFile = async (file?: File) => {
    if (!file) return
    const v = await validatePdfFile(file)
    if (!v.ok) {
      toast(v.reason, 'error')
      return
    }
    if (uploaded && !(await confirm({ title: 'Replace the PDF?', body: 'Customers who already bought this will get the new file the next time they download.', confirmLabel: 'Replace' }))) return
    setFileName(file.name)
    onSelect(file)
  }

  const test = async () => {
    setTesting(true)
    const ok = await triggerPdfDownload(productId, displayName.replace(/\.pdf$/i, ''))
    setTesting(false)
    if (!ok) toast('Couldn’t fetch the file from storage. The upload may not have finished.', 'error')
  }

  return (
    <div>
      {uploaded && !uploading && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#FDE8E8] text-[#B42318]"><MaterialIcon name="picture_as_pdf" size={20} /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium">{displayName}</p>
            <p className="text-[12px] text-[#6b7280]">{info ? `${info.sizeKb} KB · uploaded ${info.date}` : 'Uploaded'}</p>
          </div>
          <Btn size="sm" onClick={test} disabled={testing}>{testing ? 'Checking…' : 'Test download'}</Btn>
        </div>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${dragOver ? 'border-ink bg-[#F6F6F7]' : 'border-[#D1D5DB] hover:border-[#9AA0A8]'}`}
      >
        <p className="text-[14px]"><span className="font-medium underline underline-offset-2">{uploaded ? 'Replace the file' : 'Choose a PDF'}</span> or drop it here</p>
        <p className="mt-1 text-[12px] text-[#6b7280]">PDF only</p>
        {uploading && <p className="mt-2 text-[13px] font-medium">Uploading…</p>}
        <input ref={inputRef} type="file" accept="application/pdf" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }} className="hidden" />
      </div>
    </div>
  )
}
