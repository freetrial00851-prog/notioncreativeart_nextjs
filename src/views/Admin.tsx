'use client'

import { useEffect, useRef, useState, Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavLink } from '@/components/NavLink'
import { supabase } from '../lib/supabase'
import { processAndUploadImage, validateImageFile, sanitizeFilename, deriveVariantUrl } from '../lib/imageVariants'
import { compressImage } from '../lib/imageCompress'
import { useAuth } from '../context/AuthContext'
import type { Product, Category } from '../lib/types'
import { HomepageAdmin } from './AdminHomepage'
import { DropzoneUpload } from '../components/DropzoneUpload'
import { MaterialIcon } from '../components/MaterialIcon'
import { triggerPdfDownload } from '../lib/downloads'

const ADMIN_NAV = [
  { to: '/admin', label: 'Products', icon: 'inventory_2', end: true },
  { to: '/admin/categories', label: 'Categories', icon: 'category' },
  { to: '/admin/free-patterns', label: 'Free Patterns', icon: 'card_giftcard' },
  { to: '/admin/bundles', label: 'Bundles', icon: 'redeem' },
  { to: '/admin/orders', label: 'Orders', icon: 'receipt_long' },
  { to: '/admin/homepage', label: 'Homepage', icon: 'home' },
  { to: '/admin/subscribers', label: 'Newsletter', icon: 'mail' },
  { to: '/admin/trash', label: 'Trash', icon: 'delete' },
]

export function Admin() {
  const { user, profile, loading, signOut } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  if (loading) return null
  if (!user || !profile?.is_admin) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-32 text-center">
        <p className="font-subheading text-2xl mb-4">Not authorized.</p>
        <Link href="/" className="text-[12px] tracking-[0.12em] border-b border-ink pb-1">BACK TO HOME →</Link>
      </div>
    )
  }

  const navContent = (
    <>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {ADMIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            href={item.to}
            end={item.end}
            onClick={() => setMobileNavOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] transition-colors ${isActive ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/5'}`
            }
          >
            <MaterialIcon name={item.icon} size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[12px] font-medium truncate">Admin</p>
        <p className="text-[11px] text-white/50 truncate mb-3">{user.email}</p>
        <div className="flex items-center gap-4 text-[11px] tracking-[0.08em]">
          <Link href="/" target="_blank" rel="noreferrer" className="text-white/50 hover:text-white transition-colors">VIEW SITE ↗</Link>
          <button onClick={signOut} className="text-white/50 hover:text-white transition-colors">SIGN OUT</button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen md:flex" style={{ background: '#f6f4ef' }}>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 text-white sticky top-0 z-40" style={{ background: '#16233d' }}>
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-md border border-white/25 flex items-center justify-center text-[10px] font-semibold shrink-0">NCA</span>
          <p className="text-[12px] font-semibold tracking-wide">ADMIN</p>
        </div>
        <button onClick={() => setMobileNavOpen(true)} aria-label="Open menu" className="p-1">
          <MaterialIcon name="menu" size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative w-[240px] shrink-0 flex flex-col text-white" style={{ background: '#16233d' }}>
            <div className="px-6 py-6 flex items-center justify-between border-b border-white/10">
              <p className="text-[12px] font-semibold tracking-wide">NOTION CREATIVE ART</p>
              <button onClick={() => setMobileNavOpen(false)} aria-label="Close menu"><MaterialIcon name="close" size={20} /></button>
            </div>
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col text-white" style={{ background: '#16233d' }}>
        <div className="px-6 py-6 flex items-center gap-2.5 border-b border-white/10">
          <span className="w-8 h-8 rounded-md border border-white/25 flex items-center justify-center text-[11px] font-semibold shrink-0">NCA</span>
          <div className="leading-tight">
            <p className="text-[12px] font-semibold tracking-wide">NOTION CREATIVE ART</p>
            <p className="text-[10px] tracking-[0.15em] text-white/50">ADMIN</p>
          </div>
        </div>
        {navContent}
      </aside>

      <main className="flex-1 min-w-0 px-4 py-6 md:px-12 md:py-10 overflow-x-auto">
        <AdminContent />
      </main>
    </div>
  )
}

/** Renders the correct admin sub-page based on the current URL pathname. */
function AdminContent() {
  const pathname = usePathname()
  switch (pathname) {
    case '/admin/categories':
      return <CategoriesAdmin />
    case '/admin/free-patterns':
      return <ProductsAdmin mode="free" />
    case '/admin/bundles':
      return <ProductsAdmin mode="bundles" />
    case '/admin/homepage':
      return <HomepageAdmin />
    case '/admin/orders':
      return <OrdersAdmin />
    case '/admin/subscribers':
      return <SubscribersAdmin />
    case '/admin/trash':
      return <TrashAdmin />
    default:
      return <ProductsAdmin mode="all" />
  }
}

function mergeCounts(existing: Record<string, { wishlist: number; sales: number }>, key: 'wishlist' | 'sales', tally: Record<string, number>) {
  const next = { ...existing }
  for (const [productId, count] of Object.entries(tally)) {
    const current = next[productId] ?? { wishlist: 0, sales: 0 }
    next[productId] = { ...current, [key]: count }
  }
  return next
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Parents in sort_order, each immediately followed by its own subcategories
 *  (also in sort_order) — used to show real hierarchy in flat <select> lists. */
function sortedForDropdown(categories: Category[]): Category[] {
  const parents = categories.filter((c) => !c.parent_id)
  const out: Category[] = []
  for (const p of parents) {
    out.push(p)
    out.push(...categories.filter((c) => c.parent_id === p.id))
  }
  return out
}

const emptyForm = {
  id: '',
  title: '',
  slug: '',
  description: '',
  skill_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
  itemType: 'paid' as 'free' | 'paid',
  price: '',
  compare_at_price: '',
  category_id: '',
  images: [] as string[],
  pdf_pages: '',
  materials: '',
  lemon_variant_id: '',
  lemon_numeric_variant_id: '',
  active: true,
  featured: false,
  sold_out: false,
  checkout_mode: 'overlay' as 'overlay' | 'hosted',
  is_bundle: false,
  bundle_includes: [] as string[],
  meta_title: '',
  meta_description: '',
}

function ProductsAdmin({ mode }: { mode: 'all' | 'free' | 'bundles' }) {
  const PAGE_SIZE = 25
  const [products, setProducts] = useState<Product[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'media' | 'pricing' | 'seo'>('general')
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [pdfUploaded, setPdfUploaded] = useState(false)
  const [pdfInfo, setPdfInfo] = useState<{ sizeKb: number; date: string } | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)

  const pageTitle = mode === 'free' ? 'Free Patterns' : mode === 'bundles' ? 'Bundles' : 'Products'
  const emptyMessage = mode === 'free' ? 'No free patterns yet — set a product\'s price to $0 to list it here.' : mode === 'bundles' ? 'No bundles yet — check "This is a bundle" on a product to list it here.' : 'No products yet.'

  const uploadImages = async (files: File[]) => {
    setUploadingImages(true)
    const urls: string[] = []
    for (const file of files) {
      const validation = await validateImageFile(file)
      if (!validation.ok) {
        alert(`${file.name}: ${validation.reason}`)
        continue
      }
      const basePath = `${crypto.randomUUID()}-${sanitizeFilename(file.name)}`
      try {
        const result = await processAndUploadImage(file, async (path, blob) => {
          const { error } = await supabase.storage.from('product-images').upload(path, blob, { cacheControl: '31536000', contentType: blob.type })
          if (error) throw error
          return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
        }, basePath)
        urls.push(result.url)
        if (result.usedFallback) {
          alert(`${file.name} uploaded, but WebP compression failed in this browser so it fell back to a single 1600px JPEG (no small/thumbnail sizes generated for this image). Reason: ${result.fallbackReason}\n\nThis is worth reporting — most browsers should not hit this path.`)
        }
      } catch (err) {
        console.error('Image upload failed:', err)
        alert(`${file.name} failed to upload — please try again.`)
      }
    }
    setForm((f) => ({ ...f, images: [...f.images, ...urls] }))
    setUploadingImages(false)
  }

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }))
  }

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setForm((f) => {
      const next = [...f.images]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { ...f, images: next }
    })
  }
  const uploadPdf = async (file: File, productId: string) => {
    setUploadingPdf(true)
    const { error } = await supabase.storage.from('patterns').upload(`${productId}.pdf`, file, { upsert: true })
    setUploadingPdf(false)
    if (!error) {
      setPdfUploaded(true)
      setPdfInfo({ sizeKb: Math.round(file.size / 1024), date: new Date().toLocaleString() })
    }
  }


  const [counts, setCounts] = useState<Record<string, { wishlist: number; sales: number }>>({})

  const load = () => {
    let query = supabase.from('products').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (mode === 'all') query = query.gt('price', 0)
    if (mode === 'free') query = query.eq('price', 0)
    if (mode === 'bundles') query = query.eq('is_bundle', true)
    if (search.trim()) query = query.ilike('title', `%${search.trim()}%`)
    query.range(0, PAGE_SIZE - 1).then(({ data }) => {
      setProducts((data as Product[]) ?? [])
      setHasMore((data?.length ?? 0) === PAGE_SIZE)
    })
    supabase.from('wishlist').select('product_id').then(({ data }) => {
      const tally: Record<string, number> = {}
      for (const row of data ?? []) tally[row.product_id] = (tally[row.product_id] ?? 0) + 1
      setCounts((c) => mergeCounts(c, 'wishlist', tally))
    })
    supabase.from('purchases').select('product_id').then(({ data }) => {
      const tally: Record<string, number> = {}
      for (const row of data ?? []) tally[row.product_id] = (tally[row.product_id] ?? 0) + 1
      setCounts((c) => mergeCounts(c, 'sales', tally))
    })
  }

  const loadMore = async () => {
    setLoadingMore(true)
    let query = supabase.from('products').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (mode === 'all') query = query.gt('price', 0)
    if (mode === 'free') query = query.eq('price', 0)
    if (mode === 'bundles') query = query.eq('is_bundle', true)
    if (search.trim()) query = query.ilike('title', `%${search.trim()}%`)
    const { data } = await query.range(products.length, products.length + PAGE_SIZE - 1)
    setProducts((prev) => [...prev, ...((data as Product[]) ?? [])])
    setHasMore((data?.length ?? 0) === PAGE_SIZE)
    setLoadingMore(false)
  }

  useEffect(() => {
    setSelected(new Set())
    load()
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories((data as Category[]) ?? []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    setSelected(new Set())
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((s) => (s.size === products.length ? new Set() : new Set(products.map((p) => p.id))))
  }

  const bulkSetActive = async (active: boolean) => {
    setBulkWorking(true)
    await supabase.from('products').update({ active }).in('id', [...selected])
    setBulkWorking(false)
    setSelected(new Set())
    load()
  }

  const bulkTrash = async () => {
    if (!confirm(`Move ${selected.size} product${selected.size === 1 ? '' : 's'} to Trash?`)) return
    setBulkWorking(true)
    await supabase.from('products').update({ deleted_at: new Date().toISOString(), active: false }).in('id', [...selected])
    setBulkWorking(false)
    setSelected(new Set())
    load()
  }

  const startEdit = (p?: Product) => {
    setSaveError(null)
    if (p) {
      setForm({
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description ?? '',
        skill_level: p.skill_level ?? 'beginner',
        itemType: p.price === 0 ? 'free' : 'paid',
        price: String(p.price),
        compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '',
        category_id: p.category_id ?? '',
        images: p.images,
        pdf_pages: p.pdf_pages ? String(p.pdf_pages) : '',
        materials: p.materials ?? '',
        lemon_variant_id: p.lemon_variant_id,
        lemon_numeric_variant_id: p.lemon_numeric_variant_id ?? '',
        active: p.active,
        featured: p.featured,
        sold_out: p.sold_out,
        checkout_mode: p.checkout_mode,
        is_bundle: p.is_bundle ?? false,
        bundle_includes: p.bundle_includes ?? [],
        meta_title: p.meta_title ?? '',
        meta_description: p.meta_description ?? '',
      })
      setPdfUploaded(false)
      setPdfInfo(null)
      supabase.storage.from('patterns').list('', { search: `${p.id}.pdf` }).then(({ data }) => {
        const match = data?.find((f) => f.name === `${p.id}.pdf`)
        if (match) {
          setPdfUploaded(true)
          setPdfInfo({ sizeKb: Math.round((match.metadata?.size ?? 0) / 1024), date: new Date(match.updated_at ?? match.created_at ?? Date.now()).toLocaleString() })
        }
      })
    } else {
      setForm({
        ...emptyForm,
        itemType: mode === 'free' ? 'free' : 'paid',
        price: mode === 'free' ? '0' : emptyForm.price,
        is_bundle: mode === 'bundles',
      })
      setPdfUploaded(false)
      setPdfInfo(null)
    }
    setActiveTab('general')
    setEditing(true)
  }

  const duplicateProduct = (p: Product) => {
    setSaveError(null)
    let newSlug = `${p.slug}-copy`
    let n = 2
    while (products.some((x) => x.slug === newSlug)) { newSlug = `${p.slug}-copy-${n}`; n += 1 }
    setForm({
      id: '',
      title: `${p.title} (Copy)`,
      slug: newSlug,
      description: p.description ?? '',
      skill_level: p.skill_level ?? 'beginner',
      itemType: p.price === 0 ? 'free' : 'paid',
      price: String(p.price),
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '',
      category_id: p.category_id ?? '',
      images: p.images,
      pdf_pages: p.pdf_pages ? String(p.pdf_pages) : '',
      materials: p.materials ?? '',
      // Deliberately NOT copied: a Lemon Squeezy checkout ID is tied to one specific
      // product there — reusing it here would point two of our products at the same
      // checkout and immediately trigger the "Duplicate checkout ID" warning.
      lemon_variant_id: '',
      lemon_numeric_variant_id: '',
      active: false,
      featured: false,
      sold_out: false,
      checkout_mode: p.checkout_mode,
      is_bundle: p.is_bundle ?? false,
      bundle_includes: p.bundle_includes ?? [],
      meta_title: '',
      meta_description: '',
    })
    setPdfUploaded(false)
    setPdfInfo(null)
    setActiveTab('general')
    setEditing(true)
  }

  const save = async (publish: boolean): Promise<string | null> => {
    setSaveError(null)
    const slug = form.slug.trim() || slugify(form.title)
    if (!form.title.trim()) {
      setSaveError('Add a title before saving.')
      return null
    }
    let conflictQuery = supabase.from('products').select('id').eq('slug', slug)
    if (form.id) conflictQuery = conflictQuery.neq('id', form.id)
    const { data: conflict } = await conflictQuery.maybeSingle()
    if (conflict) {
      setSaveError(`The URL "${slug}" is already used by another product — change the title or slug so it's unique.`)
      return null
    }
    setSaving(true)
    const payload = {
      title: form.title,
      slug,
      description: form.description || null,
      skill_level: form.skill_level,
      price: form.itemType === 'free' ? 0 : parseFloat(form.price) || 0,
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      category_id: form.category_id || null,
      images: form.images,
      pdf_pages: form.pdf_pages ? parseInt(form.pdf_pages) : null,
      materials: form.materials || null,
      lemon_variant_id: form.lemon_variant_id || '',
      lemon_numeric_variant_id: form.lemon_numeric_variant_id || null,
      active: publish,
      featured: form.featured,
      sold_out: form.sold_out,
      checkout_mode: form.checkout_mode,
      is_bundle: form.is_bundle,
      bundle_includes: form.is_bundle ? form.bundle_includes.filter((s) => s.trim()) : [],
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
    }
    setForm((f) => ({ ...f, active: publish }))
    let savedId = form.id
    if (form.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', form.id)
      if (error) {
        setSaveError(error.message)
        setSaving(false)
        return null
      }
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select().single()
      if (error) {
        setSaveError(error.message)
        setSaving(false)
        return null
      }
      if (data) {
        savedId = data.id
        setForm((f) => ({ ...f, id: data.id })) // keep form open so images/PDF can now be attached
      }
    }
    setSaving(false)
    load()
    return savedId || null
  }

  const setActive = async (p: Product, active: boolean) => {
    await supabase.from('products').update({ active }).eq('id', p.id)
    load()
  }

  const trash = async (id: string) => {
    if (!confirm('Move this product to Trash? It will disappear from the site, and you can restore it later.')) return
    await supabase.from('products').update({ deleted_at: new Date().toISOString(), active: false }).eq('id', id)
    load()
  }

  if (editing) {
    const isFreeItem = form.itemType === 'free'
    const priceNum = form.price.trim() === '' ? null : parseFloat(form.price)
    const tabs: ('general' | 'media' | 'pricing' | 'seo')[] = isFreeItem ? ['general', 'media', 'seo'] : ['general', 'media', 'pricing', 'seo']
    const tabLabels: Record<'general' | 'media' | 'pricing' | 'seo', string> = { general: 'GENERAL', media: 'MEDIA', pricing: 'PRICING & CHECKOUT', seo: 'SEO' }
    const isLastTab = activeTab === tabs[tabs.length - 1]
    const missingFields: string[] = []
    if (!form.title.trim()) missingFields.push('Title')
    if (!form.description.trim()) missingFields.push('Description')
    if (!form.category_id) missingFields.push('Category')
    if (form.images.length === 0) missingFields.push('At least one listing image')
    if (!pdfUploaded) missingFields.push('Deliverable PDF file')
    if (!isFreeItem) {
      if (!(priceNum && priceNum > 0)) missingFields.push('Price')
      if (!form.lemon_variant_id.trim()) missingFields.push('Lemon Squeezy checkout ID')
      if (!form.lemon_numeric_variant_id.trim()) missingFields.push('Lemon Squeezy numeric variant ID')
    }
    const canPublish = missingFields.length === 0

    return (
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-semibold text-2xl">{form.id ? 'Edit Product' : `New ${mode === 'free' ? 'Free Pattern' : mode === 'bundles' ? 'Bundle' : 'Product'}`}</h1>
          <button onClick={() => setEditing(false)} className="text-[11px] tracking-[0.1em] text-ink-soft hover:text-ink">← BACK TO {pageTitle.toUpperCase()}</button>
        </div>
        <div className="bg-white border border-line rounded-2xl overflow-hidden">
          <div className="flex border-b border-line">
            {tabs.map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-3.5 text-[11px] tracking-[0.1em] border-b-2 transition-colors ${activeTab === key ? 'border-ink text-ink font-medium' : 'border-transparent text-ink-soft hover:text-ink'}`}
              >
                {tabLabels[key]}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <div className="grid gap-4">
                <Field label="TITLE"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} onBlur={() => !form.slug && setForm((f) => ({ ...f, slug: slugify(f.title) }))} className="input" /></Field>
                {!form.id && form.images.length > 0 && (
                  <p className="text-[11px] text-ink-soft -mt-2">Duplicated from another product — images and details copied, but you'll need to set a new Lemon Squeezy checkout ID and re-upload the PDF file in the Media step before publishing.</p>
                )}
                <Field label="SLUG (URL — leave blank to auto-generate from title)"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" placeholder="granny-stripe-top" /></Field>
                <Field label="DESCRIPTION"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={4} /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="SKILL LEVEL">
                    <select value={form.skill_level} onChange={(e) => setForm({ ...form, skill_level: e.target.value as typeof form.skill_level })} className="input">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </Field>
                  <Field label="CATEGORY">
                    <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input">
                      <option value="">—</option>
                      {sortedForDropdown(categories).map((c) => (
                        <option key={c.id} value={c.id}>{c.parent_id ? `— ${c.name}` : c.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="TYPE">
                  <select
                    value={form.itemType}
                    onChange={(e) => {
                      const itemType = e.target.value as 'free' | 'paid'
                      setForm({
                        ...form,
                        itemType,
                        price: itemType === 'free' ? '0' : (form.price === '0' ? '' : form.price),
                        is_bundle: itemType === 'free' ? false : form.is_bundle,
                      })
                    }}
                    className="input"
                  >
                    <option value="paid">Paid — sold via Lemon Squeezy checkout</option>
                    <option value="free">Free — instant download, no checkout</option>
                  </select>
                  <p className="text-[11px] text-ink-soft mt-1.5">
                    {form.itemType === 'free' ? "Skips the Pricing & Checkout step entirely — nothing to set up." : 'Unlocks the Pricing & Checkout step next.'}
                  </p>
                </Field>
                {form.id && (
                  <div>
                    <span className="block text-[10px] tracking-[0.1em] text-ink-soft mb-1.5">CURRENT STATUS</span>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.06em] px-2.5 py-1 rounded-full ${form.active ? 'bg-ink text-canvas' : 'border border-line text-ink-soft'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${form.active ? 'bg-canvas' : 'bg-ink-soft'}`} />
                      {form.active ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                    <p className="text-[11px] text-ink-soft mt-1.5">Use Save as Draft / Publish at the bottom of each step to change this.</p>
                  </div>
                )}
                <label className="flex items-center gap-2 text-[12px]">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured (shows in homepage Featured Items row — product stays in its own category too)
                </label>
                <label className="flex items-center gap-2 text-[12px]">
                  <input type="checkbox" checked={form.sold_out} onChange={(e) => setForm({ ...form, sold_out: e.target.checked })} /> Sold out (shows badge, disables Buy Now)
                </label>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="grid gap-4">
                <DropzoneUpload
                  label="PRODUCT PHOTOS (first image is primary — drag to reorder)"
                  sizeHint="1200×1600px, portrait (3:4), at least 1200px wide — this is the shape used on shop grid cards; the same photo is also shown larger and closer to square on the product page"
                  urls={form.images}
                  accept="image/jpeg,image/png"
                  acceptLabel="JPEG or PNG"
                  uploading={uploadingImages}
                  onAdd={(files) => uploadImages(files)}
                  onRemove={removeImage}
                  onReorder={reorderImages}
                />
                <Field label="PDF PAGES"><input value={form.pdf_pages} onChange={(e) => setForm({ ...form, pdf_pages: e.target.value })} className="input" /></Field>
                <Field label="MATERIALS NEEDED (one per line — e.g. hook size, yarn weight, yardage)">
                  <textarea value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} rows={4} className="input" placeholder={"5mm (US H/8) crochet hook\nDK weight yarn, approx 400 yds\nTapestry needle"} />
                </Field>
                {form.id ? (
                  <div className="pt-2 border-t border-line">
                    <p className="text-[10px] tracking-[0.1em] text-ink-soft mb-2 mt-4">PATTERN PDF FILE</p>
                    <PdfDropzone uploading={uploadingPdf} uploaded={pdfUploaded} info={pdfInfo} productId={form.id} onSelect={(file) => uploadPdf(file, form.id)} />
                  </div>
                ) : (
                  <p className="text-[11px] text-ink-soft pt-2 border-t border-line mt-2">Save the product once first — then the PDF upload will appear here.</p>
                )}
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="PRICE (USD)"><input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" placeholder="6.50" /></Field>
                  <Field label="COMPARE-AT (OPTIONAL)"><input value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} className="input" /></Field>
                </div>
                {form.compare_at_price && parseFloat(form.compare_at_price) <= (parseFloat(form.price) || 0) && (
                  <p className="text-[11px] text-madder -mt-2">Compare-at should be higher than the price, or the Sale badge won't show — it'll just display as the regular price.</p>
                )}
                <Field label="LEMON SQUEEZY CHECKOUT ID (from product's Share button — the ID in the checkout URL, not the numeric variant ID)"><input value={form.lemon_variant_id} onChange={(e) => setForm({ ...form, lemon_variant_id: e.target.value })} className="input" placeholder="a208e95b-8f17-407f-b7a7-115583bed5a5" /></Field>
                <Field label="LEMON SQUEEZY NUMERIC VARIANT ID (only needed for the cart feature — the number in the product's dashboard URL, e.g. app.lemonsqueezy.com/products/1255414)"><input value={form.lemon_numeric_variant_id} onChange={(e) => setForm({ ...form, lemon_numeric_variant_id: e.target.value })} className="input" placeholder="1255414" /></Field>
                <div>
                  <span className="block text-[10px] tracking-[0.1em] text-ink-soft mb-1.5">CHECKOUT STYLE</span>
                  <div className="flex border border-line w-fit text-[11px] tracking-[0.1em] rounded-lg overflow-hidden">
                    <button
                      onClick={() => setForm({ ...form, checkout_mode: 'overlay' })}
                      className={`px-4 py-2 ${form.checkout_mode === 'overlay' ? 'bg-ink text-canvas' : 'text-ink-soft hover:text-ink'}`}
                    >
                      OVERLAY
                    </button>
                    <button
                      onClick={() => setForm({ ...form, checkout_mode: 'hosted' })}
                      className={`px-4 py-2 border-l border-line ${form.checkout_mode === 'hosted' ? 'bg-ink text-canvas' : 'text-ink-soft hover:text-ink'}`}
                    >
                      HOSTED (NEW TAB)
                    </button>
                  </div>
                  <p className="text-[11px] text-ink-soft mt-1.5">
                    {form.checkout_mode === 'overlay'
                      ? 'Stays on your site — narrower checkout layout.'
                      : "Opens Lemon Squeezy's full checkout page in a new tab — wider layout, but leaves your site."}
                  </p>
                </div>

                <div className="border-t border-line pt-4">
                  <label className="flex items-center gap-2 text-[12px] mb-3">
                    <input type="checkbox" checked={form.is_bundle} onChange={(e) => setForm({ ...form, is_bundle: e.target.checked })} /> This is a bundle (shows in the homepage Bundles section)
                  </label>
                  {form.is_bundle && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-ink-soft">
                        What's included — one line per pattern (e.g. "Amigurumi Bear Pattern PDF"). This is display text only; set the total bundle price above like any other product, and give it its own Lemon Squeezy product/variant as usual.
                      </p>
                      {form.bundle_includes.map((line, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={line}
                            onChange={(e) => { const next = [...form.bundle_includes]; next[i] = e.target.value; setForm({ ...form, bundle_includes: next }) }}
                            className="input flex-1"
                            placeholder="Pattern name"
                          />
                          <button onClick={() => setForm({ ...form, bundle_includes: form.bundle_includes.filter((_, idx) => idx !== i) })} className="px-3 text-[11px] text-ink-soft hover:text-madder">✕</button>
                        </div>
                      ))}
                      <button
                        onClick={() => setForm({ ...form, bundle_includes: [...form.bundle_includes, ''] })}
                        className="text-[11px] tracking-[0.1em] border-b border-ink pb-0.5"
                      >
                        + ADD INCLUDED PATTERN
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="grid gap-4">
                <p className="text-[12px] text-ink-soft -mt-1">Optional — leave blank to use the product title and description automatically.</p>
                <Field label={`META TITLE (${form.meta_title.length}/60 recommended)`}>
                  <input
                    value={form.meta_title}
                    onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                    className="input"
                    placeholder={form.title || 'Product title'}
                    maxLength={70}
                  />
                </Field>
                <Field label={`META DESCRIPTION (${form.meta_description.length}/155 recommended)`}>
                  <textarea
                    value={form.meta_description}
                    onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                    className="input"
                    rows={3}
                    maxLength={200}
                    placeholder={form.description ? form.description.slice(0, 155) : 'Product description'}
                  />
                </Field>
                <div className="border border-line rounded-lg p-4 bg-surface/50">
                  <p className="text-[10px] tracking-[0.1em] text-ink-soft mb-2">SEARCH PREVIEW</p>
                  <p className="text-[17px] leading-tight" style={{ color: '#1a0dab' }}>{form.meta_title || form.title || 'Product title'}</p>
                  <p className="text-[12px] text-ink-soft mt-0.5">notioncreativeart.com/pattern/{form.slug || slugify(form.title) || 'product-slug'}</p>
                  <p className="text-[13px] mt-1 leading-snug">{(form.meta_description || form.description || 'Product description').slice(0, 155)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-5 border-t border-line bg-surface/50">
            {saveError && <p className="text-[11px] text-madder mb-3">{saveError}</p>}
            {isLastTab && !canPublish && (
              <p className="text-[11px] text-madder mb-3">Still needed to publish: {missingFields.join(', ')}.</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={async () => { const id = await save(false); if (id) setEditing(false) }}
                disabled={saving}
                className="px-6 py-3 border border-ink text-[11px] tracking-[0.12em] hover:bg-surface disabled:opacity-50 rounded-lg bg-white"
              >
                {saving ? 'SAVING…' : 'SAVE AS DRAFT'}
              </button>
              {isLastTab ? (
                <button
                  onClick={async () => { const id = await save(true); if (id) setEditing(false) }}
                  disabled={saving || !canPublish}
                  className="px-6 py-3 bg-ink text-canvas text-[11px] tracking-[0.12em] hover:opacity-85 disabled:opacity-40 rounded-lg"
                >
                  {saving ? 'SAVING…' : 'PUBLISH'}
                </button>
              ) : (
                <button
                  onClick={async () => { const id = await save(false); if (id) setActiveTab(tabs[tabs.indexOf(activeTab) + 1]) }}
                  disabled={saving}
                  className="px-6 py-3 bg-ink text-canvas text-[11px] tracking-[0.12em] hover:opacity-85 disabled:opacity-50 rounded-lg"
                >
                  {saving ? 'SAVING…' : 'SAVE & CONTINUE →'}
                </button>
              )}
              <button onClick={() => setEditing(false)} className="px-6 py-3 text-[11px] tracking-[0.12em] text-ink-soft hover:text-ink rounded-lg">CANCEL</button>
            </div>
          </div>
        </div>
        <style>{`.input { width: 100%; border: 1px solid var(--color-line); padding: 10px 12px; font-size: 13px; background: white; border-radius: 8px; } .input:focus { outline: none; border-color: var(--color-ink); }`}</style>
      </div>
    )
  }

  const variantCounts = products.reduce<Record<string, number>>((acc, p) => {
    if (!p.lemon_variant_id) return acc
    acc[p.lemon_variant_id] = (acc[p.lemon_variant_id] ?? 0) + 1
    return acc
  }, {})
  const categoryById = new Map(categories.map((c) => [c.id, c.name]))

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="font-display font-semibold text-2xl shrink-0">{pageTitle}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="border border-line rounded-lg px-3 py-2.5 text-[13px] bg-white focus:outline-none focus:border-ink pr-8"
              style={{ width: 220 }}
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-[13px]">✕</button>
            )}
          </div>
          <button onClick={() => startEdit()} className="px-5 py-2.5 bg-ink text-canvas text-[11px] tracking-[0.1em] hover:opacity-85 rounded-lg whitespace-nowrap">
            + ADD {mode === 'free' ? 'FREE PATTERN' : mode === 'bundles' ? 'BUNDLE' : 'NEW PRODUCT'}
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-4 mb-4 px-5 py-3 rounded-xl bg-ink text-canvas text-[12px]">
          <span className="tracking-[0.05em]">{selected.size} selected</span>
          <div className="flex gap-4 ml-auto tracking-[0.08em]">
            <button disabled={bulkWorking} onClick={() => bulkSetActive(true)} className="hover:opacity-70 disabled:opacity-50">ACTIVATE</button>
            <button disabled={bulkWorking} onClick={() => bulkSetActive(false)} className="hover:opacity-70 disabled:opacity-50">DEACTIVATE</button>
            <button disabled={bulkWorking} onClick={bulkTrash} className="hover:opacity-70 disabled:opacity-50 text-[#ffb4b4]">DELETE</button>
            <button onClick={() => setSelected(new Set())} className="hover:opacity-70">CLEAR</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        {products.length === 0 ? (
          <p className="py-12 text-center text-ink-soft text-sm">{search ? `No products match "${search}".` : emptyMessage}</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[10px] tracking-[0.1em] text-ink-soft">
                <th className="px-5 py-3 font-medium w-10">
                  <input type="checkbox" checked={selected.size === products.length} onChange={toggleSelectAll} className="accent-ink" />
                </th>
                <th className="px-5 py-3 font-medium">PRODUCT</th>
                <th className="px-5 py-3 font-medium">CATEGORY</th>
                <th className="px-5 py-3 font-medium">PRICE</th>
                <th className="px-5 py-3 font-medium">STATUS</th>
                <th className="px-5 py-3 font-medium">SOLD / SAVED</th>
                <th className="px-5 py-3 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const isDuplicateVariant = !!p.lemon_variant_id && variantCounts[p.lemon_variant_id] > 1
                const c = counts[p.id] ?? { wishlist: 0, sales: 0 }
                return (
                  <tr key={p.id} className={`hover:bg-surface/50 ${selected.has(p.id) ? 'bg-surface/70' : ''}`}>
                    <td className="px-5 py-3">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="accent-ink" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 bg-surface overflow-hidden rounded-lg">
                          {p.images?.[0] ? <img src={deriveVariantUrl(p.images[0], 'micro')} alt="" className="w-full h-full object-cover" /> : null}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.title}</p>
                          {isDuplicateVariant && <p className="text-[10px] text-madder">⚠ Duplicate checkout ID</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{p.category_id ? categoryById.get(p.category_id) ?? '—' : '—'}</td>
                    <td className="px-5 py-3">{p.price === 0 ? 'Free' : `$${p.price.toFixed(2)}`}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.06em] px-2 py-0.5 rounded-full ${p.active ? 'bg-ink text-canvas' : 'border border-line text-ink-soft'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-canvas' : 'bg-ink-soft'}`} />
                        {p.active ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{c.sales} sold · {c.wishlist} saved</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-4 text-[11px] tracking-[0.08em] justify-end">
                        <button onClick={() => startEdit(p)} className="text-ink hover:opacity-70">EDIT</button>
                        <button onClick={() => duplicateProduct(p)} className="text-ink-soft hover:text-ink">DUPLICATE</button>
                        <button onClick={() => setActive(p, !p.active)} className="text-ink-soft hover:text-ink">{p.active ? 'DEACTIVATE' : 'ACTIVATE'}</button>
                        <button onClick={() => trash(p.id)} className="text-ink-soft hover:text-madder">DELETE</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      {hasMore && (
        <div className="text-center mt-6">
          <button onClick={loadMore} disabled={loadingMore} className="px-6 py-2.5 border border-line text-[11px] tracking-[0.1em] rounded-lg hover:bg-surface bg-white disabled:opacity-50">
            {loadingMore ? 'LOADING…' : 'LOAD MORE'}
          </button>
        </div>
      )}
    </div>
  )
}

function CategoriesAdmin() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<{ name: string; slug: string; parent_id: string; image: string }>({ name: '', slug: '', parent_id: '', image: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories((data as Category[]) ?? [])
      setLoading(false)
    })
  }

  useEffect(load, [])

  const startNew = () => {
    setError(null)
    setEditingId('new')
    setForm({ name: '', slug: '', parent_id: '', image: '' })
  }

  const startEdit = (c: Category) => {
    setError(null)
    setEditingId(c.id)
    setForm({ name: c.name, slug: c.slug, parent_id: c.parent_id ?? '', image: c.image ?? '' })
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    const compressed = await compressImage(file)
    const path = `categories/${crypto.randomUUID()}-${compressed.name}`
    const { error: err } = await supabase.storage.from('product-images').upload(path, compressed, { cacheControl: '31536000' })
    if (!err) {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setForm((f) => ({ ...f, image: data.publicUrl }))
    }
    setUploading(false)
  }

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) { setError('Name and slug are required.'); return }
    setSaving(true)
    setError(null)
    const payload = { name: form.name.trim(), slug: form.slug.trim(), parent_id: form.parent_id || null, image: form.image || null }
    const { error: err } = editingId === 'new'
      ? await supabase.from('categories').insert({ ...payload, sort_order: categories.length + 1 })
      : await supabase.from('categories').update(payload).eq('id', editingId)
    setSaving(false)
    if (err) { setError(err.message); return }
    setEditingId(null)
    load()
  }

  const remove = async (c: Category) => {
    const hasSubcategories = categories.some((sub) => sub.parent_id === c.id)
    if (hasSubcategories) { setError(`Can't delete "${c.name}" — it still has subcategories. Move or delete those first.`); return }
    const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', c.id)
    if ((count ?? 0) > 0) { setError(`Can't delete "${c.name}" — ${count} product${count === 1 ? '' : 's'} still assigned to it. Reassign them first.`); return }
    if (!confirm(`Delete "${c.name}"?`)) return
    setError(null)
    await supabase.from('categories').delete().eq('id', c.id)
    load()
  }

  if (loading) return null

  const mains = categories.filter((c) => !c.parent_id)

  const editForm = (
    <div className="bg-surface/60 border-t border-b border-line p-6 space-y-4">
      <Field label="NAME">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingId === 'new' ? slugify(e.target.value) : form.slug })}
          className="input"
        />
      </Field>
      <Field label="SLUG (used in the URL)">
        <input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className="input" />
      </Field>
      <Field label="PARENT CATEGORY (leave blank for a top-level/main category)">
        <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="input">
          <option value="">— Top-level —</option>
          {mains.filter((m) => m.id !== editingId).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>
      <DropzoneUpload
        label="Thumbnail image (optional — shown in the header's mega-menu, mainly useful for subcategories)"
        sizeHint="200×200px, square"
        urls={form.image ? [form.image] : []}
        accept="image/jpeg,image/png"
        acceptLabel="JPEG or PNG"
        multiple={false}
        uploading={uploading}
        onAdd={(files) => uploadImage(files[0])}
        onRemove={() => setForm((f) => ({ ...f, image: '' }))}
        onReorder={() => {}}
      />
      <div className="flex gap-3">
        <button onClick={save} disabled={saving} className="px-6 py-3 rounded-lg text-white text-[12px] font-semibold tracking-[0.06em] hover:opacity-90 transition-opacity disabled:opacity-50" style={{ background: 'var(--color-primary)' }}>
          {saving ? 'SAVING…' : 'SAVE'}
        </button>
        <button onClick={() => setEditingId(null)} className="px-6 py-3 border border-line text-[11px] tracking-[0.1em] rounded-lg hover:bg-surface bg-white">CANCEL</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-semibold text-2xl">Categories</h1>
        <button onClick={startNew} className="px-5 py-2.5 bg-ink text-canvas text-[11px] tracking-[0.1em] hover:opacity-85 rounded-lg">+ ADD CATEGORY</button>
      </div>
      {error && <p className="text-[13px] text-madder mb-4">{error}</p>}

      {editingId === 'new' && (
        <div className="bg-white border border-line rounded-2xl overflow-hidden mb-6">{editForm}</div>
      )}

      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        {mains.length === 0 ? (
          <p className="py-12 text-center text-ink-soft text-sm">No categories yet.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[10px] tracking-[0.1em] text-ink-soft">
                <th className="px-5 py-3 font-medium">NAME</th>
                <th className="px-5 py-3 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {mains.map((m) => (
                <Fragment key={m.id}>
                  <tr className="hover:bg-surface/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {m.image ? <img src={m.image} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-surface" />}
                        <p className="font-medium">{m.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-4 text-[11px] tracking-[0.08em] justify-end">
                        <button onClick={() => (editingId === m.id ? setEditingId(null) : startEdit(m))} className="text-ink hover:opacity-70">{editingId === m.id ? 'CLOSE' : 'EDIT'}</button>
                        <button onClick={() => remove(m)} className="text-ink-soft hover:text-madder">DELETE</button>
                      </div>
                    </td>
                  </tr>
                  {editingId === m.id && (
                    <tr><td colSpan={2}>{editForm}</td></tr>
                  )}
                  {categories.filter((c) => c.parent_id === m.id).map((sub) => (
                    <Fragment key={sub.id}>
                      <tr className="hover:bg-surface/50">
                        <td className="px-5 py-3 pl-12">
                          <div className="flex items-center gap-3">
                            {sub.image ? <img src={sub.image} alt="" className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-surface" />}
                            <p className="text-ink-soft">— {sub.name}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-4 text-[11px] tracking-[0.08em] justify-end">
                            <button onClick={() => (editingId === sub.id ? setEditingId(null) : startEdit(sub))} className="text-ink hover:opacity-70">{editingId === sub.id ? 'CLOSE' : 'EDIT'}</button>
                            <button onClick={() => remove(sub)} className="text-ink-soft hover:text-madder">DELETE</button>
                          </div>
                        </td>
                      </tr>
                      {editingId === sub.id && (
                        <tr><td colSpan={2}>{editForm}</td></tr>
                      )}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function OrdersAdmin() {
  const PAGE_SIZE = 25
  const [orders, setOrders] = useState<Array<{ id: string; lemon_order_id: string; customer_email: string; amount: number; currency: string; status: string; created_at: string; product_ids: string[] }>>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [productTitles, setProductTitles] = useState<Record<string, string>>({})
  const [working, setWorking] = useState<string | null>(null)

  const [ordersWithAccess, setOrdersWithAccess] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.from('orders').select('*').order('created_at', { ascending: false }).range(0, PAGE_SIZE - 1).then(({ data }) => {
      setOrders(data ?? [])
      setHasMore((data?.length ?? 0) === PAGE_SIZE)
      const ids = (data ?? []).map((o) => o.id)
      if (ids.length > 0) {
        supabase.from('purchases').select('order_id').in('order_id', ids).then(({ data: purchases }) => {
          setOrdersWithAccess(new Set((purchases ?? []).map((p) => p.order_id)))
        })
      }
    })
  }, [])

  const markRefunded = async (o: (typeof orders)[number]) => {
    if (!confirm(`Refund order #${o.lemon_order_id} for $${o.amount.toFixed(2)} ${o.currency}?\n\nThis issues a real refund through Lemon Squeezy — the customer's payment method will be credited. This can't be undone from here.`)) return
    const revokeAccess = ordersWithAccess.has(o.id) && confirm(`Also revoke this customer's download access to the pattern(s) in this order?\n\nChoose Cancel to let them keep their downloads even though they've been refunded.`)
    setWorking(o.id)
    const { data, error } = await supabase.functions.invoke('admin-refund-order', { body: { orderId: o.id, revokeAccess } })
    setWorking(null)
    if (error || data?.error) {
      alert(data?.error ?? "Couldn't process the refund — please try again, or check the order directly in Lemon Squeezy.")
      return
    }
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: 'refunded' } : x)))
    if (revokeAccess) {
      setOrdersWithAccess((prev) => {
        const next = new Set(prev)
        next.delete(o.id)
        return next
      })
    }
  }

  const revokeAccess = async (o: (typeof orders)[number]) => {
    if (!confirm(`Revoke this customer's access to the pattern(s) in order #${o.lemon_order_id}?\n\nThey'll lose the ability to download these from their account. This doesn't refund their payment.`)) return
    setWorking(o.id)
    await supabase.from('purchases').delete().eq('order_id', o.id)
    setOrdersWithAccess((prev) => {
      const next = new Set(prev)
      next.delete(o.id)
      return next
    })
    setWorking(null)
  }

  const loadMore = async () => {
    setLoadingMore(true)
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).range(orders.length, orders.length + PAGE_SIZE - 1)
    setOrders((prev) => [...prev, ...(data ?? [])])
    setHasMore((data?.length ?? 0) === PAGE_SIZE)
    setLoadingMore(false)
    const ids = (data ?? []).map((o) => o.id)
    if (ids.length > 0) {
      const { data: purchases } = await supabase.from('purchases').select('order_id').in('order_id', ids)
      setOrdersWithAccess((prev) => new Set([...prev, ...(purchases ?? []).map((p) => p.order_id)]))
    }
  }

  const toggleExpand = async (o: (typeof orders)[number]) => {
    if (expandedId === o.id) { setExpandedId(null); return }
    setExpandedId(o.id)
    const missing = o.product_ids.filter((id) => !productTitles[id])
    if (missing.length > 0) {
      const { data } = await supabase.from('products').select('id, title').in('id', missing)
      if (data) setProductTitles((prev) => ({ ...prev, ...Object.fromEntries(data.map((p) => [p.id, p.title])) }))
    }
  }

  return (
    <div>
      <h1 className="font-display font-semibold text-2xl mb-6">Orders</h1>
      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        {orders.length === 0 ? (
          <p className="py-12 text-center text-ink-soft text-sm">No orders yet.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[10px] tracking-[0.1em] text-ink-soft">
                <th className="px-5 py-3 font-medium">CUSTOMER</th>
                <th className="px-5 py-3 font-medium">ORDER</th>
                <th className="px-5 py-3 font-medium">DATE & TIME</th>
                <th className="px-5 py-3 font-medium">STATUS</th>
                <th className="px-5 py-3 font-medium">AMOUNT</th>
                <th className="px-5 py-3 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <Fragment key={o.id}>
                  <tr className="hover:bg-surface/50">
                    <td className="px-5 py-3">{o.customer_email}</td>
                    <td className="px-5 py-3 text-ink-soft">{o.lemon_order_id}</td>
                    <td className="px-5 py-3 text-ink-soft">{new Date(o.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className="uppercase text-ink-soft">{o.status}</span>
                      {o.status !== 'refunded' && !ordersWithAccess.has(o.id) && o.product_ids.length > 0 && (
                        <span className="block text-[10px] tracking-[0.05em] text-madder mt-0.5">ACCESS REVOKED</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium">${o.amount.toFixed(2)} {o.currency}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-3 justify-end items-center text-[11px] tracking-[0.08em]">
                        {o.status === 'paid' && (
                          <button onClick={() => markRefunded(o)} disabled={working === o.id} className="text-ink-soft hover:text-madder disabled:opacity-50">
                            {working === o.id ? 'REFUNDING…' : 'REFUND'}
                          </button>
                        )}
                        {ordersWithAccess.has(o.id) && (
                          <button onClick={() => revokeAccess(o)} disabled={working === o.id} className="text-ink-soft hover:text-madder disabled:opacity-50">REVOKE ACCESS</button>
                        )}
                        <button onClick={() => toggleExpand(o)} className="text-ink hover:opacity-70">
                          {expandedId === o.id ? 'HIDE' : 'VIEW'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === o.id && (
                    <tr>
                      <td colSpan={6} className="px-5 py-4 bg-surface/50">
                        <p className="text-[10px] tracking-[0.1em] text-ink-soft mb-2">PATTERNS IN THIS ORDER</p>
                        {o.product_ids.length === 0 ? (
                          <p className="text-ink-soft">No products recorded on this order.</p>
                        ) : (
                          <ul className="space-y-1">
                            {o.product_ids.map((id) => (
                              <li key={id}>{productTitles[id] ?? '…'}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {hasMore && (
        <div className="text-center mt-6">
          <button onClick={loadMore} disabled={loadingMore} className="px-6 py-2.5 border border-line text-[11px] tracking-[0.1em] rounded-lg hover:bg-surface bg-white disabled:opacity-50">
            {loadingMore ? 'LOADING…' : 'LOAD MORE'}
          </button>
        </div>
      )}
    </div>
  )
}

function SubscribersAdmin() {
  const PAGE_SIZE = 50
  const [subscribers, setSubscribers] = useState<Array<{ email: string; subscribed_at: string }>>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false }).range(0, PAGE_SIZE - 1).then(({ data }) => {
      setSubscribers(data ?? [])
      setHasMore((data?.length ?? 0) === PAGE_SIZE)
    })
  }, [])

  const loadMore = async () => {
    setLoadingMore(true)
    const { data } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false }).range(subscribers.length, subscribers.length + PAGE_SIZE - 1)
    setSubscribers((prev) => [...prev, ...(data ?? [])])
    setHasMore((data?.length ?? 0) === PAGE_SIZE)
    setLoadingMore(false)
  }

  const exportCsv = async () => {
    // Exports the FULL list, not just whatever page is currently loaded on screen.
    setExporting(true)
    const { data } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false })
    setExporting(false)
    const all = data ?? []
    const csv = ['email,subscribed_at', ...all.map((s) => `${s.email},${s.subscribed_at}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'newsletter-subscribers.csv'
    a.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-semibold text-2xl">Newsletter</h1>
        {subscribers.length > 0 && (
          <button onClick={exportCsv} disabled={exporting} className="px-5 py-2.5 border border-ink text-[11px] tracking-[0.1em] hover:bg-surface rounded-lg bg-white disabled:opacity-50">
            {exporting ? 'PREPARING…' : 'EXPORT AS CSV'}
          </button>
        )}
      </div>
      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        {subscribers.length === 0 ? (
          <p className="py-12 text-center text-ink-soft text-sm">No subscribers yet.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[10px] tracking-[0.1em] text-ink-soft">
                <th className="px-5 py-3 font-medium">EMAIL</th>
                <th className="px-5 py-3 font-medium text-right">SUBSCRIBED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subscribers.map((s) => (
                <tr key={s.email} className="hover:bg-surface/50">
                  <td className="px-5 py-3">{s.email}</td>
                  <td className="px-5 py-3 text-right text-ink-soft">{new Date(s.subscribed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {hasMore && (
        <div className="text-center mt-6">
          <button onClick={loadMore} disabled={loadingMore} className="px-6 py-2.5 border border-line text-[11px] tracking-[0.1em] rounded-lg hover:bg-surface bg-white disabled:opacity-50">
            {loadingMore ? 'LOADING…' : 'LOAD MORE'}
          </button>
        </div>
      )}
    </div>
  )
}

function TrashAdmin() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    supabase.from('products').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }).then(({ data }) => {
      setProducts((data as Product[]) ?? [])
      setLoading(false)
    })
  }

  useEffect(load, [])

  const restore = async (p: Product) => {
    await supabase.from('products').update({ deleted_at: null }).eq('id', p.id)
    load()
  }

  const deleteForever = async (p: Product) => {
    if (!confirm(`Permanently delete "${p.title}"? This can't be undone.`)) return
    await supabase.from('products').delete().eq('id', p.id)
    load()
  }

  if (loading) return null

  return (
    <div>
      <h1 className="font-display font-semibold text-2xl mb-2">Trash</h1>
      <p className="text-[13px] text-ink-soft mb-6">Deleted products land here first — restore them anytime, or delete them for good.</p>
      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        {products.length === 0 ? (
          <p className="py-12 text-center text-ink-soft text-sm">Trash is empty.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[10px] tracking-[0.1em] text-ink-soft">
                <th className="px-5 py-3 font-medium">PRODUCT</th>
                <th className="px-5 py-3 font-medium">DELETED</th>
                <th className="px-5 py-3 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-surface/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 shrink-0 bg-surface overflow-hidden rounded-lg">
                        {p.images?.[0] ? <img src={deriveVariantUrl(p.images[0], 'micro')} alt="" className="w-full h-full object-cover" /> : null}
                      </div>
                      <p className="font-medium">{p.title}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{p.deleted_at ? new Date(p.deleted_at).toLocaleString() : '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-4 text-[11px] tracking-[0.08em] justify-end">
                      <button onClick={() => restore(p)} className="text-ink hover:opacity-70">RESTORE</button>
                      <button onClick={() => deleteForever(p)} className="text-ink-soft hover:text-madder">DELETE FOREVER</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function PdfDropzone({ uploading, uploaded, info, productId, onSelect }: { uploading: boolean; uploaded: boolean; info: { sizeKb: number; date: string } | null; productId: string; onSelect: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const handleFile = (file?: File) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.')
      return
    }
    setFileName(file.name)
    onSelect(file)
  }

  const testDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setTesting(true)
    const ok = await triggerPdfDownload(productId, 'test')
    setTesting(false)
    if (!ok) alert("Couldn't retrieve the file from storage — the upload may not have completed, or there's a bucket permissions issue. Check Supabase Dashboard → Storage → patterns bucket.")
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
      className={`cursor-pointer border-2 border-dashed rounded-xl px-6 py-8 text-center transition-colors ${dragOver ? 'border-ink bg-surface' : 'border-line hover:border-ink-soft'}`}
    >
      <p className="text-[12px] mb-1"><span className="underline underline-offset-2">Choose a file</span> or drop it here</p>
      <p className="text-[11px] text-ink-soft">PDF only</p>
      {fileName && <p className="text-[11px] mt-2">{fileName}</p>}
      {uploading && <p className="text-[11px] text-ink-soft mt-1">Uploading…</p>}
      {uploaded && !uploading && (
        <div className="text-[11px] text-ink-soft mt-1">
          <p>
            PDF uploaded — customers who buy this pattern can now download it.{' '}
            <button onClick={testDownload} disabled={testing} className="underline underline-offset-2 hover:text-ink disabled:opacity-50">
              {testing ? 'Testing…' : 'Test download'}
            </button>
          </p>
          {info && <p className="mt-1">{productId}.pdf · {info.sizeKb} KB · uploaded {info.date}</p>}
        </div>
      )}
      <input ref={inputRef} type="file" accept="application/pdf" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }} className="hidden" />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] tracking-[0.1em] text-ink-soft mb-1.5">{label}</span>
      {children}
    </label>
  )
}
