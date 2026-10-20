'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DropzoneUpload } from '../components/DropzoneUpload'
import { compressImage } from '../lib/imageCompress'
import { IMAGE_MAX, PRODUCT_IMAGE_CACHE_CONTROL, deriveVariantUrl, validateImageFile } from '../lib/imageVariants'
import { revalidateStorefront } from '../lib/actions/revalidateStorefront'
import { clearHomeCatalogCache } from '../lib/homeCatalogCache'
import type { Category, Product } from '../lib/types'
import { Btn, Card, Chip, Drawer, Empty, Field, PageHeader, SearchBox, ago, downloadCsv, inputCls, textareaCls, slugify, useAdminUi } from '../components/adminUi'

/* ═════════════════ Categories ═════════════════ */

type CatForm = { name: string; slug: string; parent_id: string; image: string; intro: string }

export function AdminCategories() {
  const { confirm, toast } = useAdminUi()
  const [cats, setCats] = useState<Category[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null) // category id | 'new'
  const [form, setForm] = useState<CatForm>({ name: '', slug: '', parent_id: '', image: '', intro: '' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [moveTo, setMoveTo] = useState<{ cat: Category; count: number } | null>(null)
  const [moveTarget, setMoveTarget] = useState('')
  const [intros, setIntros] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    const [{ data }, { data: prods }, { data: introRow }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('category_id').is('deleted_at', null).limit(5000),
      supabase.from('site_settings').select('value').eq('key', 'category_intros').maybeSingle(),
    ])
    setIntros(((introRow?.value ?? {}) as Record<string, string>) || {})
    setCats((data as Category[]) ?? [])
    const t: Record<string, number> = {}
    for (const p of (prods ?? []) as { category_id: string | null }[]) if (p.category_id) t[p.category_id] = (t[p.category_id] ?? 0) + 1
    setCounts(t)
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const mains = useMemo(() => cats.filter((c) => !c.parent_id), [cats])
  const subsOf = (id: string) => cats.filter((c) => c.parent_id === id)
  const total = (c: Category) => (counts[c.id] ?? 0) + subsOf(c.id).reduce((s, x) => s + (counts[x.id] ?? 0), 0)

  const startNew = (parent = '') => {
    setError(null)
    setSlugTouched(false)
    setForm({ name: '', slug: '', parent_id: parent, image: '', intro: '' })
    setEditing('new')
  }
  const startEdit = (c: Category) => {
    setError(null)
    setSlugTouched(true)
    setForm({ name: c.name, slug: c.slug, parent_id: c.parent_id ?? '', image: c.image ?? '', intro: intros[c.slug] ?? '' })
    setEditing(c.id)
  }

  const bust = async () => {
    clearHomeCatalogCache()
    try {
      await revalidateStorefront()
    } catch {
      /* page refreshes within a minute anyway */
    }
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    const v = await validateImageFile(file)
    if (!v.ok) {
      toast(v.reason, 'error')
      setUploading(false)
      return
    }
    const compressed = await compressImage(file, IMAGE_MAX.category, 0.8)
    const path = `categories/${crypto.randomUUID()}-${compressed.name}`
    const { error: err } = await supabase.storage.from('product-images').upload(path, compressed, { cacheControl: PRODUCT_IMAGE_CACHE_CONTROL, contentType: compressed.type || 'image/webp' })
    if (err) toast(`Upload failed: ${err.message}`, 'error')
    else setForm((f) => ({ ...f, image: supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl }))
    setUploading(false)
  }

  const save = async () => {
    if (!form.name.trim()) return setError('Give the category a name.')
    const slug = form.slug.trim() || slugify(form.name)
    if (cats.some((c) => c.slug === slug && c.id !== editing)) return setError(`The web address “${slug}” is already used. Change the name or the address.`)
    setSaving(true)
    setError(null)
    const payload = { name: form.name.trim(), slug, parent_id: form.parent_id || null, image: form.image || null }
    const { error: err } =
      editing === 'new'
        ? await supabase.from('categories').insert({ ...payload, sort_order: cats.length + 1 })
        : await supabase.from('categories').update(payload).eq('id', editing)
    setSaving(false)
    if (err) return setError(err.message)
    // Category description for Google: kept in site_settings (no schema change), keyed by slug.
    const nextIntros = { ...intros }
    const oldSlug = editing && editing !== 'new' ? cats.find((c) => c.id === editing)?.slug : undefined
    if (oldSlug && oldSlug !== slug) delete nextIntros[oldSlug]
    if (form.intro.trim()) nextIntros[slug] = form.intro.trim()
    else delete nextIntros[slug]
    if (JSON.stringify(nextIntros) !== JSON.stringify(intros)) {
      await supabase.from('site_settings').upsert({ key: 'category_intros', value: nextIntros, updated_at: new Date().toISOString() })
    }
    toast('Category saved')
    setEditing(null)
    await load()
    bust()
  }

  const move = async (list: Category[], idx: number, dir: -1 | 1) => {
    const a = list[idx]
    const b = list[idx + dir]
    if (!a || !b) return
    // Swap sort_order values (renumber the whole level so ties can't happen).
    const order = [...list]
    order[idx] = b
    order[idx + dir] = a
    const base = Math.min(...list.map((c) => c.sort_order ?? 0), 1)
    await Promise.all(order.map((c, i) => supabase.from('categories').update({ sort_order: base + i }).eq('id', c.id)))
    await load()
    bust()
  }

  const remove = async (c: Category) => {
    if (subsOf(c.id).length > 0) {
      toast(`“${c.name}” still has sub-categories. Move or delete those first.`, 'error')
      return
    }
    const n = counts[c.id] ?? 0
    if (n > 0) {
      setMoveTarget('')
      setMoveTo({ cat: c, count: n })
      return
    }
    if (!(await confirm({ title: `Delete “${c.name}”?`, body: 'It’s empty, so no patterns are affected.', confirmLabel: 'Delete', tone: 'danger' }))) return
    await supabase.from('categories').delete().eq('id', c.id)
    toast('Category deleted')
    await load()
    bust()
  }

  const confirmMoveDelete = async () => {
    if (!moveTo) return
    const { cat } = moveTo
    await supabase.from('products').update({ category_id: moveTarget || null }).eq('category_id', cat.id)
    await supabase.from('categories').delete().eq('id', cat.id)
    setMoveTo(null)
    toast('Category deleted and patterns moved')
    await load()
    bust()
  }

  const row = (c: Category, list: Category[], idx: number, sub: boolean) => (
    <li key={c.id} className={`flex items-center gap-3 px-4 py-3 ${sub ? 'pl-10 md:pl-14' : ''}`}>
      <span className={`h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#F1F2F4] ${sub ? 'scale-90' : ''}`}>
        {c.image && <img src={c.image} alt="" className="h-full w-full object-cover" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">{c.name}</p>
        <p className="truncate text-[12px] text-[#6b7280]">
          {sub ? counts[c.id] ?? 0 : total(c)} pattern{(sub ? counts[c.id] ?? 0 : total(c)) === 1 ? '' : 's'} · /shop/{c.slug}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button disabled={idx === 0} onClick={() => move(list, idx, -1)} aria-label={`Move ${c.name} up`} className="grid h-9 w-9 place-items-center rounded-full text-[#6b7280] hover:bg-[#F1F2F4] disabled:opacity-30">↑</button>
        <button disabled={idx === list.length - 1} onClick={() => move(list, idx, 1)} aria-label={`Move ${c.name} down`} className="grid h-9 w-9 place-items-center rounded-full text-[#6b7280] hover:bg-[#F1F2F4] disabled:opacity-30">↓</button>
        <Btn size="sm" onClick={() => startEdit(c)}>Edit</Btn>
      </div>
    </li>
  )

  return (
    <div>
      <PageHeader
        title="Categories"
        desc="How your patterns are grouped in the shop menu. Use the arrows to change the order customers see."
        actions={<Btn variant="primary" onClick={() => startNew()}>+ New category</Btn>}
      />
      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        {loading ? (
          <div className="h-40 animate-pulse bg-[#F6F6F7]" />
        ) : mains.length === 0 ? (
          <Empty icon="category" title="Create your first category" body="For example Amigurumi, Baby or Wearables." action={<Btn variant="primary" onClick={() => startNew()}>+ New category</Btn>} />
        ) : (
          <ul className="divide-y divide-[#EEF0F2]">
            {mains.map((m, mi) => (
              <li key={m.id}>
                <ul>{row(m, mains, mi, false)}</ul>
                <ul className="divide-y divide-[#F4F5F7] border-t border-[#F4F5F7] bg-[#FCFCFC]">
                  {subsOf(m.id).map((s, si, arr) => row(s, arr, si, true))}
                  <li className="py-2 pl-10 md:pl-14">
                    <button onClick={() => startNew(m.id)} className="min-h-9 text-[13px] text-[#6b7280] hover:text-ink">+ Add a sub-category to {m.name}</button>
                  </li>
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Drawer
        open={editing != null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New category' : 'Edit category'}
        footer={
          <div className="flex items-center justify-between gap-2">
            {editing && editing !== 'new' ? (
              <Btn variant="danger" onClick={() => { const c = cats.find((x) => x.id === editing); if (c) { setEditing(null); remove(c) } }}>Delete</Btn>
            ) : <span />}
            <div className="flex gap-2">
              <Btn onClick={() => setEditing(null)}>Cancel</Btn>
              <Btn variant="primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</Btn>
            </div>
          </div>
        }
      >
        {error && <p role="alert" className="rounded-xl bg-[#FEF3F2] px-4 py-3 text-[14px] text-[#B42318]">{error}</p>}
        <Card>
          <div className="space-y-4">
            <Field label="Name">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugTouched ? form.slug : slugify(e.target.value) })} className={inputCls} autoFocus />
            </Field>
            <Field label="Inside" hint="Leave on “Top level” for a main category.">
              <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className={inputCls}>
                <option value="">Top level</option>
                {mains.filter((m) => m.id !== editing).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Web address" hint={editing !== 'new' ? 'Changing this breaks old links to this category.' : `notioncreativeart.com/shop/${form.slug || '…'}`}>
              <input value={form.slug} onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }) }} className={inputCls} />
            </Field>
          </div>
        </Card>
        <Card title="Description for Google" desc="Shows above the patterns on this category page. 2–4 sentences with the words people search for (e.g. “amigurumi crochet patterns”). Leave empty to show nothing.">
          <textarea
            value={form.intro}
            onChange={(e) => setForm({ ...form, intro: e.target.value })}
            rows={5}
            maxLength={900}
            className={`${textareaCls}`}
            placeholder="Beginner-friendly amigurumi crochet patterns you can download instantly…"
          />
          <p className="mt-1.5 text-right text-[12px] text-[#8a8f98]">{form.intro.length}/900</p>
        </Card>
        <Card title="Picture" desc="Optional. Shows in the shop menu. Square, around 200×200.">
          <DropzoneUpload
            label=""
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
        </Card>
      </Drawer>

      <Drawer
        open={!!moveTo}
        onClose={() => setMoveTo(null)}
        title="Delete category"
        footer={<div className="flex justify-end gap-2"><Btn onClick={() => setMoveTo(null)}>Cancel</Btn><Btn variant="danger" onClick={confirmMoveDelete}>Delete &amp; move patterns</Btn></div>}
      >
        {moveTo && (
          <Card>
            <p className="text-[14px]"><b>{moveTo.count}</b> pattern{moveTo.count === 1 ? ' is' : 's are'} in “{moveTo.cat.name}”. Where should they go?</p>
            <select value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)} className={`${inputCls} mt-3`}>
              <option value="">Leave them without a category</option>
              {cats.filter((c) => c.id !== moveTo.cat.id).map((c) => <option key={c.id} value={c.id}>{c.parent_id ? `— ${c.name}` : c.name}</option>)}
            </select>
          </Card>
        )}
      </Drawer>
    </div>
  )
}

/* ═════════════════ Newsletter ═════════════════ */

type Sub = { email: string; subscribed_at: string }

export function AdminSubscribers() {
  const { confirm, toast } = useAdminUi()
  const PAGE = 50
  const [subs, setSubs] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [stats, setStats] = useState<{ total: number; d7: number; d30: number } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    const day = 86400000
    const head = () => supabase.from('newsletter_subscribers').select('email', { count: 'exact', head: true })
    Promise.all([head(), head().gte('subscribed_at', new Date(Date.now() - 7 * day).toISOString()), head().gte('subscribed_at', new Date(Date.now() - 30 * day).toISOString())]).then(([a, b, c]) =>
      setStats({ total: a.count ?? 0, d7: b.count ?? 0, d30: c.count ?? 0 }),
    )
  }, [])

  useEffect(() => {
    let alive = true
    let query = supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false })
    if (q) query = query.ilike('email', `%${q.replace(/[%,()]/g, '')}%`)
    query.range(0, PAGE - 1).then(({ data }) => {
      if (!alive) return
      setSubs((data ?? []) as Sub[])
      setHasMore((data?.length ?? 0) === PAGE)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [q])

  const loadMore = async () => {
    let query = supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false })
    if (q) query = query.ilike('email', `%${q.replace(/[%,()]/g, '')}%`)
    const { data } = await query.range(subs.length, subs.length + PAGE - 1)
    setSubs((p) => [...p, ...((data ?? []) as Sub[])])
    setHasMore((data?.length ?? 0) === PAGE)
  }

  const exportCsv = async () => {
    const { data } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false })
    downloadCsv('newsletter-subscribers.csv', [['email', 'subscribed_at'], ...((data ?? []) as Sub[]).map((s) => [s.email, s.subscribed_at])])
  }

  const remove = async (s: Sub) => {
    if (!(await confirm({ title: `Remove ${s.email}?`, body: 'They’re taken off the list permanently. Use this for a privacy or deletion request.', confirmLabel: 'Remove', tone: 'danger' }))) return
    const { error } = await supabase.from('newsletter_subscribers').delete().eq('email', s.email)
    if (error) return toast('Couldn’t remove them: ' + error.message, 'error')
    setSubs((p) => p.filter((x) => x.email !== s.email))
    toast('Removed')
  }

  return (
    <div>
      <PageHeader title="Newsletter" desc="People who signed up for your emails." actions={<Btn onClick={exportCsv}>Export CSV</Btn>} />
      {stats && (
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[['Subscribers', stats.total], ['New this week', stats.d7], ['New this month', stats.d30]].map(([k, v]) => (
            <div key={String(k)} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
              <p className="text-[12px] text-[#6b7280]">{k}</p>
              <p className="mt-1 text-[22px] font-bold tabular-nums md:text-[26px]">{Number(v).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mb-4"><SearchBox value={search} onChange={setSearch} placeholder="Search by email" /></div>
      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        {loading ? (
          <div className="h-40 animate-pulse bg-[#F6F6F7]" />
        ) : subs.length === 0 ? (
          <Empty icon="mail" title={q ? 'No one matches' : 'No subscribers yet'} body={q ? 'Check the spelling or clear the search.' : 'Sign-ups from your homepage and checkout will appear here.'} />
        ) : (
          <ul className="divide-y divide-[#EEF0F2]">
            {subs.map((s) => (
              <li key={s.email} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F1F2F4] text-[13px] font-semibold text-[#4B5563]">{s.email[0]?.toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px]">{s.email}</span>
                  <span className="block text-[12px] text-[#6b7280]">Joined {ago(s.subscribed_at)}</span>
                </span>
                <Btn variant="ghost" size="sm" onClick={() => remove(s)}>Remove</Btn>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasMore && <div className="mt-5 text-center"><Btn onClick={loadMore}>Load more</Btn></div>}
    </div>
  )
}

/* ═════════════════ Trash ═════════════════ */

export function AdminTrash() {
  const { confirm, toast } = useAdminUi()
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })
    setItems((data as Product[]) ?? [])
    setLoading(false)
  }, [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const bust = async (slug: string) => {
    clearHomeCatalogCache()
    try {
      await revalidateStorefront(slug)
    } catch {
      /* ignore */
    }
  }

  const restore = async (p: Product) => {
    await supabase.from('products').update({ deleted_at: null, active: false }).eq('id', p.id)
    toast(`“${p.title}” restored as a draft`)
    await load()
    bust(p.slug)
  }

  const deleteForever = async (p: Product) => {
    const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true }).contains('product_ids', [p.id])
    const ok = await confirm({
      title: `Delete “${p.title}” forever?`,
      body: (
        <>
          The listing and its PDF are removed for good. <b>This can’t be undone.</b>
          {(count ?? 0) > 0 && <span className="mt-2 block text-[#B42318]">Careful: this pattern appears in {count} past order{count === 1 ? '' : 's'}. Customers may lose their download.</span>}
        </>
      ),
      confirmLabel: 'Delete forever',
      tone: 'danger',
      typeToConfirm: 'delete',
    })
    if (!ok) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) return toast('Couldn’t delete: ' + error.message, 'error')
    toast('Deleted for good')
    await load()
    bust(p.slug)
  }

  return (
    <div>
      <PageHeader title="Trash" desc="Deleted patterns wait here. Restoring one brings it back as a draft, so it won’t go live until you publish it." />
      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        {loading ? (
          <div className="h-40 animate-pulse bg-[#F6F6F7]" />
        ) : items.length === 0 ? (
          <Empty icon="delete" title="Trash is empty" body="Patterns you delete will show up here first." />
        ) : (
          <ul className="divide-y divide-[#EEF0F2]">
            {items.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#F1F2F4]">
                  {p.images?.[0] && <img src={deriveVariantUrl(p.images[0], 'micro')} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium">{p.title}</span>
                  <span className="block text-[12px] text-[#6b7280]">Deleted {ago(p.deleted_at)} {p.price === 0 ? <Chip>Free</Chip> : null}</span>
                </span>
                <div className="flex gap-2">
                  <Btn size="sm" onClick={() => restore(p)}>Restore</Btn>
                  <Btn size="sm" variant="danger" onClick={() => deleteForever(p)}>Delete forever</Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
