'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { processAndUploadImage, validateImageFile, sanitizeFilename, deriveVariantUrl, PRODUCT_IMAGE_CACHE_CONTROL } from '../lib/imageVariants'
import { validatePdfFile } from '../lib/uploadValidation'
import { useAuth } from '../context/AuthContext'
import type { Product, Category } from '../lib/types'
import { profileDisplayName } from '../lib/profileName'
import { HomepageAdmin } from './AdminHomepage'
import { AdminDashboard } from './AdminDashboard'
import { AdminShell } from './AdminShell'
import { ProductEditor } from './AdminProductEditor'
import { AdminOrders } from './AdminOrders'
import { AdminCategories, AdminSubscribers, AdminTrash } from './AdminCatalog'
import { Btn, Chip, Empty, PageHeader, SearchBox, Tabs, Toggle, useAdminUi } from '../components/adminUi'
import { AdminToday } from './AdminToday'
import { InsightsOverview, InsightsCustomers, InsightsSaved, InsightsProducts, InsightsTraffic, InsightsSetup } from './AdminInsights'
import { AdminBulkUpload } from './AdminBulkUpload'
import { AdminReviews } from './AdminReviews'
import { ProductExportModal } from '../components/ProductExportModal'
import { revalidateStorefront } from '../lib/actions/revalidateStorefront'
import { clearHomeCatalogCache } from '../lib/homeCatalogCache'

export function Admin() {
  const { user, profile, loading, signOut } = useAuth()
  const pathname = usePathname()
  const [pendingReviewCount, setPendingReviewCount] = useState(0)
  const shopLabel = profileDisplayName(profile, 'Notion Creative Art')

  useEffect(() => {
    if (!profile?.is_admin) return
    supabase.rpc('get_pending_review_count').then(({ data }) => setPendingReviewCount(Number(data) || 0))
  }, [profile?.is_admin, pathname])

  if (loading) return null
  if (!user || !profile?.is_admin) {
    return (
      <div className="max-w-site w-full mx-auto page-gutter py-16 text-center">
        <p className="type-h2 text-ink mb-4">Not authorized.</p>
        <Link href="/" className="text-[14px] font-semibold text-primary hover:underline">Back to home</Link>
      </div>
    )
  }

  return (
    <AdminShell pendingReviews={pendingReviewCount} email={user.email} name={shopLabel} onSignOut={signOut}>
      <AdminContent name={shopLabel} />
    </AdminShell>
  )
}

/** Renders the correct admin sub-page based on the current URL pathname. */
function AdminContent({ name }: { name: string }) {
  const pathname = usePathname()
  switch (pathname) {
    case '/admin':
    case '/admin/':
      return <AdminToday name={name} />
    case '/admin/analytics':
      return <InsightsOverview />
    case '/admin/classic':
      return <AdminDashboard />
    case '/admin/customers':
      return <InsightsCustomers />
    case '/admin/saved':
      return <InsightsSaved />
    case '/admin/products':
      return <InsightsProducts />
    case '/admin/traffic':
      return <InsightsTraffic />
    case '/admin/setup':
      return <InsightsSetup />
    case '/admin/categories':
      return <AdminCategories />
    case '/admin/listings':
      return <ProductsAdmin mode="listings" />
    case '/admin/bulk-upload':
      return <AdminBulkUpload />
    case '/admin/free-patterns':
      return <ProductsAdmin mode="free" />
    case '/admin/bundles':
      return <ProductsAdmin mode="bundles" />
    case '/admin/homepage':
      return <HomepageAdmin />
    case '/admin/orders':
      return <AdminOrders />
    case '/admin/reviews':
      return <AdminReviews />
    case '/admin/subscribers':
      return <AdminSubscribers />
    case '/admin/trash':
      return <AdminTrash />
    default:
      return <AdminToday name={name} />
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

export function ProductsAdmin({ mode }: { mode: 'all' | 'free' | 'bundles' | 'listings' }) {
  const PAGE_SIZE = 25
  const { confirm, toast } = useAdminUi()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [statusCounts, setStatusCounts] = useState({ active: 0, draft: 0, sold_out: 0, inactive: 0 })
  const [showExportModal, setShowExportModal] = useState(false)

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
        toast(`${file.name}: ${validation.reason}`, 'error')
        continue
      }
      const basePath = `${crypto.randomUUID()}-${sanitizeFilename(file.name)}`
      try {
        const result = await processAndUploadImage(file, async (path, blob) => {
          const { error } = await supabase.storage.from('product-images').upload(path, blob, { cacheControl: PRODUCT_IMAGE_CACHE_CONTROL, contentType: blob.type })
          if (error) throw error
          return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
        }, basePath)
        urls.push(result.url)
        if (result.usedFallback) console.warn('WebP compression failed; used JPEG fallback:', result.fallbackReason)
      } catch (err) {
        console.error('Image upload failed:', err)
        toast(`${file.name} didn’t upload. Please try again.`, 'error')
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
    const validation = await validatePdfFile(file)
    if (!validation.ok) {
      toast(validation.reason, 'error')
      setUploadingPdf(false)
      return
    }
    const { error } = await supabase.storage.from('patterns').upload(`${productId}.pdf`, file, {
      upsert: true,
      contentType: 'application/pdf',
      metadata: { originalName: file.name },
    })
    if (!error) {
      await supabase.from('products').update({ pdf_filename: file.name }).eq('id', productId)
      setPdfUploaded(true)
      setPdfInfo({ sizeKb: Math.round(file.size / 1024), date: new Date().toLocaleString(), originalName: file.name })
      toast('PDF uploaded')
    } else {
      toast(`PDF upload failed: ${error.message}`, 'error')
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

  const bustStorefrontCache = async (slug?: string | null) => {
    clearHomeCatalogCache()
    try {
      await revalidateStorefront(slug)
    } catch (err) {
      console.warn('Storefront revalidation failed:', err)
    }
  }

  const bulkSetActive = async (active: boolean) => {
    setBulkWorking(true)
    await supabase.from('products').update({ active }).in('id', [...selected])
    setBulkWorking(false)
    setSelected(new Set())
    await bustStorefrontCache()
    load()
  }

  const bulkTrash = async () => {
    if (!(await confirm({ title: `Move ${selected.size} pattern${selected.size === 1 ? '' : 's'} to trash?`, body: 'They disappear from the shop. You can restore them from Trash.', confirmLabel: 'Move to trash', tone: 'danger' }))) return
    setBulkWorking(true)
    await supabase.from('products').update({ deleted_at: new Date().toISOString(), active: false }).in('id', [...selected])
    setBulkWorking(false)
    setSelected(new Set())
    await bustStorefrontCache()
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
    await bustStorefrontCache(slug)
    load()
    return savedId || null
  }

  const setActive = async (p: Product, active: boolean) => {
    await supabase.from('products').update({ active }).eq('id', p.id)
    await bustStorefrontCache(p.slug)
    load()
  }

  const setFeatured = async (p: Product) => {
    await supabase.from('products').update({ featured: !p.featured }).eq('id', p.id)
    await bustStorefrontCache(p.slug)
    load()
  }

  const trash = async (id: string): Promise<boolean> => {
    const target = products.find((p) => p.id === id)
    if (!(await confirm({ title: `Move “${target?.title ?? form.title ?? 'this pattern'}” to trash?`, body: 'It disappears from the shop. You can restore it from Trash.', confirmLabel: 'Move to trash', tone: 'danger' }))) return false
    await supabase.from('products').update({ deleted_at: new Date().toISOString(), active: false }).eq('id', id)
    await bustStorefrontCache(target?.slug ?? form.slug)
    toast('Moved to trash')
    load()
    return true
  }

  if (editing) {
    return (
      <ProductEditor
        form={form}
        setForm={setForm}
        categories={categories}
        saving={saving}
        saveError={saveError}
        uploadingImages={uploadingImages}
        uploadingPdf={uploadingPdf}
        pdfUploaded={pdfUploaded}
        pdfInfo={pdfInfo}
        onUploadImages={uploadImages}
        onRemoveImage={removeImage}
        onReorderImages={reorderImages}
        onUploadPdf={uploadPdf}
        onSave={save}
        onClose={() => setEditing(false)}
        onTrash={async (id) => {
          if (await trash(id)) setEditing(false)
        }}
      />
    )
  }

  const variantCounts = products.reduce<Record<string, number>>((acc, p) => {
    if (!p.lemon_variant_id) return acc
    acc[p.lemon_variant_id] = (acc[p.lemon_variant_id] ?? 0) + 1
    return acc
  }, {})
  const categoryById = new Map(categories.map((c) => [c.id, c.name]))
  const allCount = statusCounts.active + statusCounts.draft + statusCounts.sold_out

  const rowMenu = (p: Product) => (
    <div className="relative">
      <button onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)} className="grid h-9 w-9 place-items-center rounded-full text-[#6b7280] hover:bg-[#F1F2F4]" aria-label={`Options for ${p.title}`} aria-haspopup="menu">⋯</button>
      {menuOpenId === p.id && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
          <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-[#E5E7EB] bg-white py-1 text-[14px] shadow-xl">
            <a href={`/pattern/${p.slug}`} target="_blank" rel="noreferrer" className="block px-4 py-2.5 hover:bg-[#F6F6F7]">View on shop ↗</a>
            <button onClick={() => { setMenuOpenId(null); duplicateProduct(p) }} className="block w-full px-4 py-2.5 text-left hover:bg-[#F6F6F7]">Duplicate</button>
            <button onClick={() => { setMenuOpenId(null); setFeatured(p) }} className="block w-full px-4 py-2.5 text-left hover:bg-[#F6F6F7]">{p.featured ? 'Remove from homepage' : 'Show on homepage'}</button>
            <button onClick={() => { setMenuOpenId(null); trash(p.id) }} className="block w-full px-4 py-2.5 text-left text-[#B42318] hover:bg-[#FEF3F2]">Move to trash</button>
          </div>
        </>
      )}
    </div>
  )

  const statusChip = (p: Product) =>
    p.sold_out ? <Chip tone="amber">Sold out</Chip> : p.active ? <Chip tone="green">Live</Chip> : <Chip>Draft</Chip>

  return (
    <div>
      <PageHeader
        title={pageTitle}
        desc="Your patterns. Click one to edit it, or flip the switch to take it off the shop."
        actions={
          <>
            <Btn onClick={() => setShowExportModal(true)}>Export CSV</Btn>
            <Link href="/admin/bulk-upload" className="inline-flex min-h-11 items-center rounded-full border border-[#D1D5DB] bg-white px-5 text-[14px] font-medium hover:bg-[#F6F6F7]">Bulk upload</Link>
            <Btn variant="primary" onClick={() => startEdit()}>+ Add listing</Btn>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          items={[
            { id: 'active', label: 'Live', count: statusCounts.active },
            { id: 'draft', label: 'Drafts', count: statusCounts.draft },
            { id: 'sold_out', label: 'Sold out', count: statusCounts.sold_out },
            { id: 'all', label: 'All', count: allCount },
          ]}
        />
        <div className="flex-1" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} aria-label="Type" className="h-11 rounded-full border border-[#D1D5DB] bg-white px-4 text-[14px]">
          <option value="all">All types</option>
          <option value="paid">Paid</option>
          <option value="free">Free</option>
          <option value="bundles">Bundles</option>
        </select>
        <SearchBox value={search} onChange={setSearch} placeholder="Search patterns" />
      </div>

      {selected.size > 0 && (
        <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-ink px-4 py-2.5 text-white shadow-lg">
          <span className="text-[14px] font-medium">{selected.size} selected</span>
          <div className="flex-1" />
          <button disabled={bulkWorking} onClick={() => bulkSetActive(true)} className="min-h-9 rounded-full bg-white/15 px-4 text-[13px] hover:bg-white/25 disabled:opacity-50">Make live</button>
          <button disabled={bulkWorking} onClick={() => bulkSetActive(false)} className="min-h-9 rounded-full bg-white/15 px-4 text-[13px] hover:bg-white/25 disabled:opacity-50">Make draft</button>
          <button disabled={bulkWorking} onClick={bulkTrash} className="min-h-9 rounded-full bg-[#B42318] px-4 text-[13px] hover:opacity-90 disabled:opacity-50">Move to trash</button>
          <button onClick={() => setSelected(new Set())} className="min-h-9 px-3 text-[13px] text-white/70 hover:text-white">Clear</button>
        </div>
      )}

      {showExportModal && <ProductExportModal categories={categories} onClose={() => setShowExportModal(false)} />}

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        {products.length === 0 ? (
          search ? (
            <Empty icon="search" title={`No patterns match “${search}”`} action={<Btn onClick={() => setSearch('')}>Clear search</Btn>} />
          ) : statusFilter === 'active' && allCount === 0 ? (
            <Empty icon="sell" title="Add your first pattern" body="Upload a photo and the PDF, set a price, and it’s on the shop." action={<Btn variant="primary" onClick={() => startEdit()}>+ Add listing</Btn>} />
          ) : (
            <Empty icon="sell" title={`No ${statusFilter === 'all' ? '' : statusFilter === 'active' ? 'live ' : statusFilter === 'draft' ? 'draft ' : 'sold-out '}patterns`} body={emptyMessage} />
          )
        ) : (
          <>
            <div className="hidden items-center gap-3 border-b border-[#EEF0F2] px-4 py-2.5 text-[12px] font-semibold text-[#6b7280] md:flex">
              <input type="checkbox" aria-label="Select all" checked={selected.size === products.length && products.length > 0} onChange={toggleSelectAll} className="h-4 w-4" />
              <span className="flex-1">Pattern</span>
              <span className="w-24">Status</span>
              <span className="w-20 text-right">Price</span>
              <span className="w-28 text-right">Sales · Saved</span>
              <span className="w-20 text-center">Live</span>
              <span className="w-[116px]" />
            </div>
            <ul className="divide-y divide-[#EEF0F2]">
              {products.map((p) => {
                const c = counts[p.id] ?? { wishlist: 0, sales: 0 }
                const dup = !!p.lemon_variant_id && variantCounts[p.lemon_variant_id] > 1
                return (
                  <li key={p.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap ${selected.has(p.id) ? 'bg-[#F6F6F7]' : ''}`}>
                    <input type="checkbox" aria-label={`Select ${p.title}`} checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="h-4 w-4 shrink-0" />
                    <button onClick={() => startEdit(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F1F2F4]">
                        {p.images?.[0] && <img src={deriveVariantUrl(p.images[0], 'micro')} alt="" className="h-full w-full object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-medium">{p.title}</span>
                        <span className="block truncate text-[12px] text-[#6b7280]">
                          {p.category_id ? categoryById.get(p.category_id) ?? 'No category' : 'No category'}
                          {p.is_bundle ? ' · Bundle' : ''}
                          {p.featured ? ' · On homepage' : ''}
                        </span>
                        {dup && <span className="block text-[12px] text-[#B42318]">Same checkout ID as another listing</span>}
                      </span>
                    </button>
                    <span className="w-24">{statusChip(p)}</span>
                    <span className="w-20 text-right text-[14px] font-medium tabular-nums">{p.price === 0 ? 'Free' : `$${p.price.toFixed(2)}`}</span>
                    <span className="w-28 text-right text-[13px] text-[#6b7280] tabular-nums">{c.sales} · {c.wishlist}</span>
                    <span className="flex w-20 justify-center"><Toggle label={`${p.title} is live`} checked={p.active} onChange={(v) => setActive(p, v)} /></span>
                    <span className="flex w-[116px] items-center justify-end gap-1">
                      <Btn size="sm" onClick={() => startEdit(p)}>Edit</Btn>
                      {rowMenu(p)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {hasMore && (
        <div className="mt-5 text-center">
          <Btn onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}</Btn>
        </div>
      )}
    </div>
  )
}
