'use client'

import { useEffect, useRef, useState, Fragment } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { NavLink } from '@/components/NavLink'
import { supabase } from '../lib/supabase'
import { processAndUploadImage, validateImageFile, sanitizeFilename, deriveVariantUrl, IMAGE_MAX } from '../lib/imageVariants'
import { compressImage } from '../lib/imageCompress'
import { useAuth } from '../context/AuthContext'
import type { Product, Category } from '../lib/types'
import { HomepageAdmin } from './AdminHomepage'
import { AdminDashboard } from './AdminDashboard'
import { DropzoneUpload } from '../components/DropzoneUpload'
import { MaterialIcon } from '../components/MaterialIcon'
import { triggerPdfDownload } from '../lib/downloads'

const SHELL_BG = '#f9f8f6'
const SIDEBAR_BG = '#f3f1ec'
const ACCENT = '#1f249c'

type NavItem =
  | { kind: 'link'; to: string; label: string; icon: string; end?: boolean }
  | { kind: 'group'; id: string; label: string; icon: string; children: { to: string; label: string }[] }

const ADMIN_NAV: NavItem[] = [
  { kind: 'link', to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { kind: 'link', to: '/admin/listings', label: 'Listings', icon: 'sell' },
  { kind: 'link', to: '/admin/orders', label: 'Orders', icon: 'receipt_long' },
  { kind: 'link', to: '/admin/categories', label: 'Categories', icon: 'category' },
  {
    kind: 'group',
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    children: [
      { to: '/admin/homepage', label: 'Homepage' },
      { to: '/admin/subscribers', label: 'Newsletter' },
    ],
  },
  { kind: 'link', to: '/admin/trash', label: 'Trash', icon: 'delete' },
]

export function Admin() {
  const { user, profile, loading, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ settings: true })
  const shopLabel = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Notion Creative Art'

  if (loading) return null
  if (!user || !profile?.is_admin) {
    return (
      <div className="max-w-site w-full mx-auto px-8 py-32 text-center">
        <p className="font-subheading text-2xl mb-4">Not authorized.</p>
        <Link href="/" className="text-[12px] tracking-[0.12em] border-b border-ink pb-1">BACK TO HOME →</Link>
      </div>
    )
  }

  const navContent = (
    <>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {ADMIN_NAV.map((item) => {
          if (item.kind === 'link') {
            return (
              <NavLink
                key={item.to}
                href={item.to}
                end={item.end}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                    isActive ? 'bg-white text-ink font-medium shadow-sm' : 'text-[#444] hover:bg-white/70 hover:text-ink'
                  }`
                }
              >
                <MaterialIcon name={item.icon} size={18} />
                {item.label}
              </NavLink>
            )
          }
          const groupOpen = openGroups[item.id]
          const childActive = item.children.some((c) => pathname === c.to || pathname?.startsWith(c.to + '/'))
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => setOpenGroups((g) => ({ ...g, [item.id]: !g[item.id] }))}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                  childActive ? 'text-ink font-medium' : 'text-[#444] hover:bg-white/70'
                }`}
              >
                <MaterialIcon name={item.icon} size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                <MaterialIcon name="expand_more" size={16} style={{ transform: groupOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              {groupOpen && (
                <div className="ml-4 pl-3 border-l border-[#e4e1db] space-y-0.5 mb-1">
                  {item.children.map((c) => (
                    <NavLink
                      key={c.to}
                      href={c.to}
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `block px-3 py-1.5 rounded-md text-[12px] ${isActive ? 'text-ink font-medium bg-white' : 'text-[#666] hover:text-ink'}`
                      }
                    >
                      {c.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="px-3 pb-2">
        <p className="px-3 text-[11px] font-semibold tracking-wide text-[#888] uppercase mb-1.5">Sales channels</p>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-ink hover:bg-white/70"
        >
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: ACCENT }}>N</span>
          <span className="truncate">NCA Shop</span>
        </a>
      </div>

      <div className="border-t border-[#e4e1db] px-3 py-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-semibold shrink-0" style={{ background: ACCENT }}>
            {(shopLabel[0] || 'A').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium truncate">{shopLabel}</p>
            <p className="text-[11px] text-[#888] truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-2 mt-2 text-[11px]">
          <Link href="/" target="_blank" rel="noreferrer" className="text-[#666] hover:text-ink">View site</Link>
          <button onClick={signOut} className="text-[#666] hover:text-ink">Sign out</button>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen md:flex" style={{ background: SHELL_BG }}>
      <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40 border-b border-[#e4e1db]" style={{ background: SIDEBAR_BG }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileNavOpen(true)} aria-label="Open menu" className="p-1">
            <MaterialIcon name="menu" size={22} />
          </button>
          <p className="font-heading text-[18px] font-semibold">Shop Manager</p>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative w-[260px] shrink-0 flex flex-col border-r border-[#e4e1db]" style={{ background: SIDEBAR_BG }}>
            <div className="px-4 py-4 flex items-center justify-between border-b border-[#e4e1db]">
              <p className="font-heading text-[18px] font-semibold">Shop Manager</p>
              <button onClick={() => setMobileNavOpen(false)} aria-label="Close menu"><MaterialIcon name="close" size={20} /></button>
            </div>
            {navContent}
          </aside>
        </div>
      )}

      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-[#e4e1db] sticky top-0 h-screen" style={{ background: SIDEBAR_BG }}>
        <div className="px-4 py-5 flex items-center gap-2 border-b border-[#e4e1db]">
          <MaterialIcon name="menu" size={20} />
          <p className="font-heading text-[18px] font-semibold">Shop Manager</p>
        </div>
        {navContent}
      </aside>

      <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8 overflow-x-auto">
        <AdminContent />
      </main>
    </div>
  )
}

/** Renders the correct admin sub-page based on the current URL pathname. */
function AdminContent() {
  const pathname = usePathname()
  switch (pathname) {
    case '/admin':
    case '/admin/':
      return <AdminDashboard />
    case '/admin/categories':
      return <CategoriesAdmin />
    case '/admin/listings':
      return <ProductsAdmin mode="listings" />
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
      return <AdminDashboard />
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
  subtitle: '',
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
  card_badge: '' as '' | 'sale' | 'new' | 'featured',
  sold_out: false,
  checkout_mode: 'overlay' as 'overlay' | 'hosted',
  is_bundle: false,
  bundle_includes: [] as string[],
  meta_title: '',
  meta_description: '',
}

function ProductsAdmin({ mode }: { mode: 'all' | 'free' | 'bundles' | 'listings' }) {
  const PAGE_SIZE = 25
  const searchParams = useSearchParams()
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
  const [pdfInfo, setPdfInfo] = useState<{ sizeKb: number; date: string; originalName: string } | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'active' | 'draft' | 'sold_out' | 'inactive' | 'all'>(
    (searchParams.get('status') as 'active' | 'draft' | 'sold_out' | 'inactive' | 'all') || 'active'
  )
  const [typeFilter, setTypeFilter] = useState<'all' | 'paid' | 'free' | 'bundles'>(
    mode === 'free' ? 'free' : mode === 'bundles' ? 'bundles' : 'all'
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [statusCounts, setStatusCounts] = useState({ active: 0, draft: 0, sold_out: 0, inactive: 0 })
  const [showStats, setShowStats] = useState(true)

  const pageTitle = mode === 'free' ? 'Free Patterns' : mode === 'bundles' ? 'Bundles' : 'Listings'
  const emptyMessage = mode === 'free' ? 'No free patterns yet — set a product\'s price to $0 to list it here.' : mode === 'bundles' ? 'No bundles yet — check "This is a bundle" on a product to list it here.' : 'No listings yet.'

  useEffect(() => {
    const s = searchParams.get('status') as typeof statusFilter | null
    if (s && ['active', 'draft', 'sold_out', 'inactive', 'all'].includes(s)) setStatusFilter(s)
  }, [searchParams])

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
    const { error } = await supabase.storage.from('patterns').upload(`${productId}.pdf`, file, {
      upsert: true,
      contentType: 'application/pdf',
      metadata: { originalName: file.name },
    })
    if (!error) {
      await supabase.from('products').update({ pdf_filename: file.name }).eq('id', productId)
      setPdfUploaded(true)
      setPdfInfo({ sizeKb: Math.round(file.size / 1024), date: new Date().toLocaleString(), originalName: file.name })
    } else {
      alert(`PDF upload failed: ${error.message}`)
    }
    setUploadingPdf(false)
  }


  const [counts, setCounts] = useState<Record<string, { wishlist: number; sales: number }>>({})

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyProductFilters = (query: any) => {
    let q = query.is('deleted_at', null)
    if (mode === 'free' || typeFilter === 'free') q = q.eq('price', 0)
    else if (mode === 'bundles' || typeFilter === 'bundles') q = q.eq('is_bundle', true)
    else if (mode === 'listings' && typeFilter === 'paid') q = q.gt('price', 0)
    else if (mode === 'all') q = q.gt('price', 0)

    if (statusFilter === 'active') q = q.eq('active', true).eq('sold_out', false)
    else if (statusFilter === 'draft' || statusFilter === 'inactive') q = q.eq('active', false)
    else if (statusFilter === 'sold_out') q = q.eq('sold_out', true)

    if (search.trim()) q = q.ilike('title', `%${search.trim()}%`)
    return q
  }

  const loadStatusCounts = async () => {
    const base = () => supabase.from('products').select('id', { count: 'exact', head: true }).is('deleted_at', null)
    const [{ count: active }, { count: draft }, { count: sold_out }] = await Promise.all([
      base().eq('active', true).eq('sold_out', false),
      base().eq('active', false),
      base().eq('sold_out', true),
    ])
    setStatusCounts({
      active: active ?? 0,
      draft: draft ?? 0,
      sold_out: sold_out ?? 0,
      inactive: draft ?? 0,
    })
  }

  const load = () => {
    let query = supabase.from('products').select('*').order('created_at', { ascending: false })
    query = applyProductFilters(query)
    query.range(0, PAGE_SIZE - 1).then(({ data }) => {
      setProducts((data as Product[]) ?? [])
      setHasMore((data?.length ?? 0) === PAGE_SIZE)
    })
    loadStatusCounts()
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
    let query = supabase.from('products').select('*').order('created_at', { ascending: false })
    query = applyProductFilters(query)
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
  }, [mode, statusFilter, typeFilter])

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
        subtitle: p.subtitle ?? '',
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
        card_badge: p.card_badge ?? '',
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
          const metaName = (match.metadata as { originalName?: string } | null)?.originalName
          setPdfInfo({
            sizeKb: Math.round((match.metadata?.size ?? 0) / 1024),
            date: new Date(match.updated_at ?? match.created_at ?? Date.now()).toLocaleString(),
            originalName: p.pdf_filename || metaName || `${p.title}.pdf`,
          })
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
      subtitle: p.subtitle ?? '',
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
      card_badge: p.card_badge ?? '',
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
      subtitle: form.subtitle.trim() || null,
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
      card_badge: form.card_badge || null,
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

  const setFeatured = async (p: Product) => {
    await supabase.from('products').update({ featured: !p.featured }).eq('id', p.id)
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
    const tabLabels: Record<'general' | 'media' | 'pricing' | 'seo', string> = { general: 'Details', media: 'Photos & files', pricing: 'Pricing', seo: 'SEO' }
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
      <div className="max-w-3xl mx-auto pb-24">
        <div className="sticky top-0 z-20 -mx-4 md:-mx-8 px-4 md:px-8 py-3 mb-6 border-b border-[#e4e1db] flex flex-wrap items-center gap-2" style={{ background: SHELL_BG }}>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink truncate">{form.title || (form.id ? 'Edit listing' : 'New listing')}</p>
            {form.id && (
              <p className="text-[12px] text-ink-soft">{form.active ? 'Published' : 'Draft'}</p>
            )}
          </div>
          {form.slug && (
            <a href={`/pattern/${form.slug}`} target="_blank" rel="noreferrer" className="px-3 py-2 text-[13px] border border-[#d9d5ce] rounded-full bg-white hover:bg-[#f3f1ec]">
              Preview
            </a>
          )}
          <button
            onClick={async () => { const id = await save(false); if (id) setEditing(false) }}
            disabled={saving}
            className="px-3 py-2 text-[13px] border border-[#d9d5ce] rounded-full bg-white hover:bg-[#f3f1ec] disabled:opacity-50"
          >
            Save as draft
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-2 text-[13px] text-ink-soft hover:text-ink">Cancel</button>
          <button
            onClick={async () => { const id = await save(true); if (id) setEditing(false) }}
            disabled={saving || !canPublish}
            className="px-4 py-2 text-[13px] font-medium rounded-full text-white disabled:opacity-40"
            style={{ background: '#222' }}
          >
            {saving ? 'Saving…' : 'Publish'}
          </button>
        </div>

        <div className="flex gap-1 border-b border-[#e4e1db] mb-6 overflow-x-auto">
          {tabs.map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-[13px] whitespace-nowrap -mb-px border-b-2 transition-colors ${activeTab === key ? 'border-[#1f249c] text-ink font-medium' : 'border-transparent text-ink-soft hover:text-ink'}`}
            >
              {tabLabels[key]}
            </button>
          ))}
        </div>

        <div className="bg-white border border-[#e4e1db] rounded-xl overflow-hidden">
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="grid gap-5">
                <h2 className="text-[16px] font-semibold">Listing details</h2>
                <Field label="Title"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} onBlur={() => !form.slug && setForm((f) => ({ ...f, slug: slugify(f.title) }))} className="input" /></Field>
                {!form.id && form.images.length > 0 && (
                  <p className="text-[12px] text-ink-soft -mt-2">Duplicated from another product — images and details copied, but you&apos;ll need a new Lemon Squeezy checkout ID and PDF before publishing.</p>
                )}
                <Field label="Slug (URL)"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" placeholder="granny-stripe-top" /></Field>
                <Field label={`Subtitle (${form.subtitle.length}/150)`}>
                  <input
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value.slice(0, 150) })}
                    className="input"
                    maxLength={150}
                    placeholder="Short line under the title on the product page"
                  />
                  <p className="text-[12px] text-ink-soft mt-1.5">Aim for 100–150 characters, unique from your description, include a keyword.</p>
                </Field>
                <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={5} /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Skill level">
                    <select value={form.skill_level} onChange={(e) => setForm({ ...form, skill_level: e.target.value as typeof form.skill_level })} className="input">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </Field>
                  <Field label="Category">
                    <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input">
                      <option value="">—</option>
                      {sortedForDropdown(categories).map((c) => (
                        <option key={c.id} value={c.id}>{c.parent_id ? `— ${c.name}` : c.name}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Type">
                  <div className="flex gap-4 text-[13px]">
                    <label className="flex items-center gap-2"><input type="radio" checked={form.itemType === 'paid'} onChange={() => setForm({ ...form, itemType: 'paid', price: form.price === '0' ? '' : form.price })} /> Digital — paid</label>
                    <label className="flex items-center gap-2"><input type="radio" checked={form.itemType === 'free'} onChange={() => setForm({ ...form, itemType: 'free', price: '0', is_bundle: false })} /> Free download</label>
                  </div>
                </Field>
                <label className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured on homepage
                </label>
                <Field label="Card badge">
                  <select
                    value={form.card_badge}
                    onChange={(e) => setForm({ ...form, card_badge: e.target.value as typeof form.card_badge })}
                    className="input"
                  >
                    <option value="">None (default)</option>
                    <option value="sale">SALE</option>
                    <option value="new">NEW</option>
                    <option value="featured">FEATURED</option>
                  </select>
                </Field>
                <p className="text-[12px] text-ink-soft -mt-3">Shown on shop cards and the product page. Leave as None unless you want a badge.</p>
                <label className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={form.sold_out} onChange={(e) => setForm({ ...form, sold_out: e.target.checked })} /> Mark as sold out
                </label>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="grid gap-5">
                <h2 className="text-[16px] font-semibold">Photos &amp; files</h2>
                <DropzoneUpload
                  label="Photos (first image is primary — drag to reorder)"
                  sizeHint="Resized to ≤1600px long edge, saved as WebP at ~80% quality (micro→full variants)"
                  urls={form.images}
                  accept="image/jpeg,image/png"
                  acceptLabel="JPEG or PNG"
                  uploading={uploadingImages}
                  onAdd={(files) => uploadImages(files)}
                  onRemove={removeImage}
                  onReorder={reorderImages}
                />
                <Field label="PDF pages"><input value={form.pdf_pages} onChange={(e) => setForm({ ...form, pdf_pages: e.target.value })} className="input" /></Field>
                <Field label="Materials needed (one per line)">
                  <textarea value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} rows={4} className="input" placeholder={"5mm (US H/8) crochet hook\nDK weight yarn, approx 400 yds"} />
                </Field>
                <div className="pt-2 border-t border-[#e4e1db]">
                  <p className="text-[14px] font-semibold mb-2">Digital files</p>
                  {form.id ? (
                    <PdfDropzone uploading={uploadingPdf} uploaded={pdfUploaded} info={pdfInfo} productId={form.id} productTitle={form.title} onSelect={(file) => uploadPdf(file, form.id)} />
                  ) : (
                    <p className="text-[12px] text-ink-soft">Save the listing once first — then you can upload the PDF.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="grid gap-5">
                <h2 className="text-[16px] font-semibold">Inventory and pricing</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Price (USD)"><input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" placeholder="6.50" /></Field>
                  <Field label="Compare-at (optional)"><input value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} className="input" /></Field>
                </div>
                {form.compare_at_price && parseFloat(form.compare_at_price) <= (parseFloat(form.price) || 0) && (
                  <p className="text-[12px] text-madder -mt-2">Compare-at should be higher than the price to show a strikethrough.</p>
                )}
                <p className="text-[12px] text-ink-soft -mt-2">Compare-at only affects the strikethrough price. To show a SALE badge, set Card badge under Details.</p>
                <Field label="Lemon Squeezy checkout ID"><input value={form.lemon_variant_id} onChange={(e) => setForm({ ...form, lemon_variant_id: e.target.value })} className="input" placeholder="a208e95b-8f17-407f-b7a7-115583bed5a5" /></Field>
                <Field label="Lemon Squeezy numeric variant ID"><input value={form.lemon_numeric_variant_id} onChange={(e) => setForm({ ...form, lemon_numeric_variant_id: e.target.value })} className="input" placeholder="1255414" /></Field>
                <div>
                  <span className="block text-[12px] text-ink-soft mb-1.5">Checkout style</span>
                  <div className="flex border border-[#d9d5ce] w-fit text-[12px] rounded-lg overflow-hidden bg-white">
                    <button onClick={() => setForm({ ...form, checkout_mode: 'overlay' })} className={`px-4 py-2 ${form.checkout_mode === 'overlay' ? 'bg-[#222] text-white' : 'text-ink-soft hover:text-ink'}`}>Overlay</button>
                    <button onClick={() => setForm({ ...form, checkout_mode: 'hosted' })} className={`px-4 py-2 border-l border-[#d9d5ce] ${form.checkout_mode === 'hosted' ? 'bg-[#222] text-white' : 'text-ink-soft hover:text-ink'}`}>Hosted</button>
                  </div>
                </div>
                <div className="border-t border-[#e4e1db] pt-4">
                  <label className="flex items-center gap-2 text-[13px] mb-3">
                    <input type="checkbox" checked={form.is_bundle} onChange={(e) => setForm({ ...form, is_bundle: e.target.checked })} /> This is a bundle
                  </label>
                  {form.is_bundle && (
                    <div className="space-y-3">
                      <p className="text-[12px] text-ink-soft">What&apos;s included — one line per pattern.</p>
                      {form.bundle_includes.map((line, i) => (
                        <div key={i} className="flex gap-2">
                          <input value={line} onChange={(e) => { const next = [...form.bundle_includes]; next[i] = e.target.value; setForm({ ...form, bundle_includes: next }) }} className="input flex-1" placeholder="Pattern name" />
                          <button onClick={() => setForm({ ...form, bundle_includes: form.bundle_includes.filter((_, idx) => idx !== i) })} className="px-3 text-[12px] text-ink-soft hover:text-madder">✕</button>
                        </div>
                      ))}
                      <button onClick={() => setForm({ ...form, bundle_includes: [...form.bundle_includes, ''] })} className="text-[13px] text-[#1f249c] hover:underline">+ Add included pattern</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="grid gap-5">
                <h2 className="text-[16px] font-semibold">SEO &amp; visibility</h2>
                <p className="text-[12px] text-ink-soft -mt-2">Optional — leave blank to use the product title and description.</p>
                <Field label={`Meta title (${form.meta_title.length}/60)`}>
                  <input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} className="input" placeholder={form.title || 'Product title'} maxLength={70} />
                </Field>
                <Field label={`Meta description (${form.meta_description.length}/155)`}>
                  <textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} className="input" rows={3} maxLength={200} placeholder={form.description ? form.description.slice(0, 155) : 'Product description'} />
                </Field>
                <div className="border border-[#e4e1db] rounded-lg p-4 bg-[#f9f8f6]">
                  <p className="text-[11px] text-ink-soft mb-2">Search preview</p>
                  <p className="text-[17px] leading-tight" style={{ color: '#1a0dab' }}>{form.meta_title || form.title || 'Product title'}</p>
                  <p className="text-[12px] text-ink-soft mt-0.5">notioncreativeart.com/pattern/{form.slug || slugify(form.title) || 'product-slug'}</p>
                  <p className="text-[13px] mt-1 leading-snug">{(form.meta_description || form.description || 'Product description').slice(0, 155)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#e4e1db] bg-[#f9f8f6]">
            {saveError && <p className="text-[12px] text-madder mb-2">{saveError}</p>}
            {!canPublish && (
              <p className="text-[12px] text-madder mb-2">Still needed to publish: {missingFields.join(', ')}.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <button onClick={async () => { const id = await save(false); if (id) setEditing(false) }} disabled={saving} className="px-4 py-2 border border-[#d9d5ce] text-[13px] rounded-full bg-white disabled:opacity-50">Save as draft</button>
              {!isLastTab && (
                <button onClick={async () => { const id = await save(false); if (id) setActiveTab(tabs[tabs.indexOf(activeTab) + 1]) }} disabled={saving} className="px-4 py-2 text-[13px] rounded-full text-white disabled:opacity-50" style={{ background: '#222' }}>
                  Save &amp; continue
                </button>
              )}
              {isLastTab && (
                <button onClick={async () => { const id = await save(true); if (id) setEditing(false) }} disabled={saving || !canPublish} className="px-4 py-2 text-[13px] rounded-full text-white disabled:opacity-40" style={{ background: '#222' }}>Publish</button>
              )}
            </div>
          </div>
        </div>
        <style>{`.input { width: 100%; border: 1px solid #d9d5ce; padding: 10px 12px; font-size: 13px; background: white; border-radius: 8px; } .input:focus { outline: none; border-color: #222; }`}</style>
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
    <div className="flex gap-6 items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
          <h1 className="text-[28px] font-semibold text-ink shrink-0">{pageTitle}</h1>
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <MaterialIcon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title…"
                className="w-full border border-[#d9d5ce] rounded-full pl-10 pr-9 py-2.5 text-[13px] bg-white focus:outline-none focus:border-ink"
              />
              {search && (
                <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-[13px]">✕</button>
              )}
            </div>
          </div>
          <button onClick={() => startEdit()} className="shrink-0 px-4 py-2.5 text-[13px] font-medium rounded-full text-white whitespace-nowrap" style={{ background: '#222' }}>
            + Add a listing
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <label className="flex items-center gap-2 px-3 py-1.5 border border-[#d9d5ce] rounded-full bg-white text-[13px]">
            <input type="checkbox" checked={selected.size === products.length && products.length > 0} onChange={toggleSelectAll} />
          </label>
          <button disabled={selected.size === 0 || bulkWorking} onClick={() => bulkSetActive(true)} className="px-3 py-1.5 border border-[#d9d5ce] rounded-full bg-white text-[13px] disabled:opacity-40">Activate</button>
          <button disabled={selected.size === 0 || bulkWorking} onClick={() => bulkSetActive(false)} className="px-3 py-1.5 border border-[#d9d5ce] rounded-full bg-white text-[13px] disabled:opacity-40">Deactivate</button>
          <button disabled={selected.size === 0 || bulkWorking} onClick={bulkTrash} className="px-3 py-1.5 border border-[#d9d5ce] rounded-full bg-white text-[13px] disabled:opacity-40">Delete</button>
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-[13px] text-ink-soft hover:text-ink ml-1">Clear ({selected.size})</button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="bg-white border border-[#e4e1db] rounded-xl py-16 text-center text-[14px] text-ink-soft">
            {search ? `No listings match "${search}".` : emptyMessage}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((p) => {
              const c = counts[p.id] ?? { wishlist: 0, sales: 0 }
              const isDuplicateVariant = !!p.lemon_variant_id && variantCounts[p.lemon_variant_id] > 1
              return (
                <div key={p.id} className={`bg-white border rounded-xl overflow-hidden ${selected.has(p.id) ? 'border-[#1f249c]' : 'border-[#e4e1db]'}`}>
                  <div className="relative aspect-[4/3] bg-[#f3f1ec]">
                    {p.images?.[0] ? (
                      <img src={deriveVariantUrl(p.images[0], 'thumb')} alt="" className="w-full h-full object-cover" />
                    ) : null}
                    <span className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded bg-white/90 border border-[#e4e1db]">Digital</span>
                    {p.featured && <MaterialIcon name="star" size={18} color="#c9a227" className="absolute top-2 right-2" />}
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] font-medium text-ink truncate mb-1">{p.title}</p>
                    <p className="text-[12px] text-ink-soft mb-2">
                      {p.price === 0 ? 'Free' : `USD ${p.price.toFixed(2)}`}
                      {p.category_id ? ` · ${categoryById.get(p.category_id) ?? ''}` : ''}
                    </p>
                    {isDuplicateVariant && <p className="text-[11px] text-madder mb-1">Duplicate checkout ID</p>}
                    {showStats && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-ink-soft border-t border-[#e4e1db] pt-2 mb-2">
                        <div>
                          <p className="font-semibold text-[10px] tracking-wide text-[#888] mb-0.5">ALL TIME</p>
                          <p>{c.sales} sales</p>
                          <p>{c.wishlist} favourites</p>
                        </div>
                        <div>
                          <p className="font-semibold text-[10px] tracking-wide text-[#888] mb-0.5">STATUS</p>
                          <p>{p.active ? 'Active' : 'Draft'}{p.sold_out ? ' · Sold out' : ''}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 relative">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="accent-ink" />
                      <button onClick={() => setFeatured(p)} className="p-1 text-ink-soft hover:text-ink" aria-label="Toggle featured">
                        <MaterialIcon name={p.featured ? 'star' : 'star_border'} size={18} color={p.featured ? '#c9a227' : undefined} />
                      </button>
                      <div className="ml-auto relative">
                        <button onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)} className="p-1.5 rounded-full hover:bg-[#f3f1ec]" aria-label="Listing options">
                          <MaterialIcon name="settings" size={18} />
                        </button>
                        {menuOpenId === p.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                            <div className="absolute right-0 bottom-full mb-1 z-20 w-44 bg-white border border-[#e4e1db] rounded-lg shadow-lg py-1 text-[13px]">
                              <a href={`/pattern/${p.slug}`} target="_blank" rel="noreferrer" className="block px-3 py-2 hover:bg-[#f3f1ec]">View on shop</a>
                              <button onClick={() => { setMenuOpenId(null); startEdit(p) }} className="block w-full text-left px-3 py-2 hover:bg-[#f3f1ec]">Edit</button>
                              <button onClick={() => { setMenuOpenId(null); duplicateProduct(p) }} className="block w-full text-left px-3 py-2 hover:bg-[#f3f1ec]">Copy</button>
                              <button onClick={() => { setMenuOpenId(null); setActive(p, !p.active) }} className="block w-full text-left px-3 py-2 hover:bg-[#f3f1ec]">{p.active ? 'Deactivate' : 'Activate'}</button>
                              <button onClick={() => { setMenuOpenId(null); trash(p.id) }} className="block w-full text-left px-3 py-2 hover:bg-[#f3f1ec] text-madder">Delete</button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white border border-[#e4e1db] rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#e4e1db] text-left text-[11px] text-ink-soft">
                  <th className="px-4 py-3 w-10"><input type="checkbox" checked={selected.size === products.length && products.length > 0} onChange={toggleSelectAll} /></th>
                  <th className="px-4 py-3 font-medium">Listing</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Sales</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e1db]">
                {products.map((p) => {
                  const c = counts[p.id] ?? { wishlist: 0, sales: 0 }
                  return (
                    <tr key={p.id} className={selected.has(p.id) ? 'bg-[#f3f1ec]/70' : 'hover:bg-[#f9f8f6]'}>
                      <td className="px-4 py-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f3f1ec] shrink-0">
                            {p.images?.[0] && <img src={deriveVariantUrl(p.images[0], 'micro')} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <p className="font-medium truncate">{p.title}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{p.price === 0 ? 'Free' : `$${p.price.toFixed(2)}`}</td>
                      <td className="px-4 py-3">{p.active ? 'Active' : 'Draft'}</td>
                      <td className="px-4 py-3 text-ink-soft">{c.sales} · {c.wishlist} fav</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => startEdit(p)} className="text-[#1f249c] hover:underline">Edit</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-6">
            <button onClick={loadMore} disabled={loadingMore} className="px-5 py-2 border border-[#d9d5ce] text-[13px] rounded-full hover:bg-white bg-white disabled:opacity-50">
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>

      {/* Right filter panel */}
      <aside className="hidden lg:block w-[220px] shrink-0 sticky top-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-ink">Stats</span>
          <button
            type="button"
            role="switch"
            aria-checked={showStats}
            onClick={() => setShowStats((v) => !v)}
            className={`w-9 h-5 rounded-full transition-colors relative ${showStats ? 'bg-[#222]' : 'bg-[#d9d5ce]'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showStats ? 'left-4' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md border ${viewMode === 'grid' ? 'border-ink bg-white' : 'border-[#d9d5ce] bg-white'}`} aria-label="Grid view">
            <MaterialIcon name="grid_view" size={18} />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-md border ${viewMode === 'list' ? 'border-ink bg-white' : 'border-[#d9d5ce] bg-white'}`} aria-label="List view">
            <MaterialIcon name="view_list" size={18} />
          </button>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-ink mb-2">Listing status</p>
          <div className="space-y-1.5 text-[13px]">
            {([
              { id: 'active' as const, label: 'Active', count: statusCounts.active },
              { id: 'draft' as const, label: 'Draft', count: statusCounts.draft },
              { id: 'sold_out' as const, label: 'Sold out', count: statusCounts.sold_out },
              { id: 'all' as const, label: 'All', count: statusCounts.active + statusCounts.draft },
            ]).map((s) => (
              <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" checked={statusFilter === s.id} onChange={() => setStatusFilter(s.id)} />
                <span className="flex-1">{s.label}</span>
                <span className="text-ink-soft">({s.count})</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-semibold text-ink mb-2">Type</p>
          <div className="space-y-1.5 text-[13px]">
            {([
              { id: 'all' as const, label: 'All listings' },
              { id: 'paid' as const, label: 'Paid' },
              { id: 'free' as const, label: 'Free patterns' },
              { id: 'bundles' as const, label: 'Bundles' },
            ]).map((t) => (
              <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="type" checked={typeFilter === t.id} onChange={() => setTypeFilter(t.id)} />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-semibold text-ink">Sections</p>
            <Link href="/admin/categories" className="text-[12px] text-[#1f249c] hover:underline">Manage</Link>
          </div>
          <p className="text-[12px] text-ink-soft">Filter by category from the listing editor, or manage shop sections in Categories.</p>
        </div>
      </aside>
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
    const compressed = await compressImage(file, IMAGE_MAX.category, 0.8)
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

function PdfDropzone({ uploading, uploaded, info, productId, productTitle, onSelect }: {
  uploading: boolean
  uploaded: boolean
  info: { sizeKb: number; date: string; originalName: string } | null
  productId: string
  productTitle: string
  onSelect: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const displayName = info?.originalName || fileName || (productTitle ? `${productTitle}.pdf` : null)

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
    const ok = await triggerPdfDownload(productId, displayName?.replace(/\.pdf$/i, '') || productTitle || 'pattern')
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
      {uploading && <p className="text-[11px] text-ink-soft mt-1">Uploading…</p>}
      {uploaded && !uploading && (
        <div className="text-[11px] text-ink-soft mt-1">
          <p>
            PDF uploaded — customers who buy this pattern can now download it.{' '}
            <button onClick={testDownload} disabled={testing} className="underline underline-offset-2 hover:text-ink disabled:opacity-50">
              {testing ? 'Testing…' : 'Test download'}
            </button>
          </p>
          {info && (
            <p className="mt-1 text-ink font-medium">
              {displayName} · {info.sizeKb} KB · uploaded {info.date}
            </p>
          )}
        </div>
      )}
      {!uploaded && fileName && !uploading && <p className="text-[11px] mt-2 text-ink font-medium">{fileName}</p>}
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
