'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/imageCompress'
import { IMAGE_MAX, validateImageFile, PRODUCT_IMAGE_CACHE_CONTROL } from '../lib/imageVariants'
import type {
  HeroContent,
  ChapterContent,
  AnnouncementsContent,
  SiteSeoContent,
  FreePatternsBannerContent,
  HomeCopy,
  Product,
} from '../lib/types'
import {
  DEFAULT_ANNOUNCEMENT_COLORS,
  DEFAULT_FREE_PATTERNS_BANNER,
  DEFAULT_HOME_COPY,
  normalizeAnnouncements,
  normalizeFreePatternsBanner,
  normalizeHomeCopy,
} from '../lib/types'
import { DEFAULT_SITE_SEO } from '../lib/seoSettings'
import { DropzoneUpload } from '../components/DropzoneUpload'
import { revalidateStorefront } from '../lib/actions/revalidateStorefront'
import { clearHomeCatalogCache } from '../lib/homeCatalogCache'

const FREE_COLLAGE_MAX = 4

type SettingKey = 'hero' | 'chapters' | 'announcements' | 'seo' | 'free_patterns' | 'homepage_copy'
type SaveState = { key: SettingKey; status: 'saving' | 'saved' | 'error'; message?: string } | null

const EMPTY_HERO: HeroContent = { eyebrow: '', title: '', images: [], cta_text: '', cta_link: '/shop?price=paid', secondary_cta_text: '', secondary_cta_link: '/shop?price=free' }

export function HomepageAdmin() {
  const [hero, setHero] = useState<HeroContent>(EMPTY_HERO)
  const [copy, setCopy] = useState<HomeCopy>(DEFAULT_HOME_COPY)
  const [chapters, setChapters] = useState<ChapterContent[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementsContent | null>(null)
  const [seo, setSeo] = useState<SiteSeoContent>({ ...DEFAULT_SITE_SEO })
  const [freePatterns, setFreePatterns] = useState<FreePatternsBannerContent>(DEFAULT_FREE_PATTERNS_BANNER)
  const [freeProductOptions, setFreeProductOptions] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>(null)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string>('hero')

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['hero', 'chapters', 'announcements', 'seo', 'free_patterns', 'homepage_copy'])
      .then(({ data }) => {
        let foundAnnouncements = false
        for (const row of data ?? []) {
          if (row.key === 'hero') setHero({ ...EMPTY_HERO, ...(row.value as HeroContent) })
          if (row.key === 'chapters') setChapters(row.value as ChapterContent[])
          if (row.key === 'homepage_copy') setCopy(normalizeHomeCopy(row.value))
          if (row.key === 'announcements') {
            setAnnouncements(normalizeAnnouncements(row.value))
            foundAnnouncements = true
          }
          if (row.key === 'free_patterns') setFreePatterns(normalizeFreePatternsBanner(row.value))
          if (row.key === 'seo') setSeo({ ...DEFAULT_SITE_SEO, ...(row.value as Partial<SiteSeoContent>) })
        }
        if (!foundAnnouncements) setAnnouncements(normalizeAnnouncements({ enabled: false, messages: [''] }))
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    supabase
      .from('products')
      .select('id, title, images, price, active, created_at')
      .eq('active', true)
      .eq('price', 0)
      .order('created_at', { ascending: false })
      .limit(80)
      .then(({ data }) => setFreeProductOptions(((data as Product[]) ?? []).filter((p) => p.images?.[0])))
  }, [])

  // Ensure already-selected collage products appear even if missing from the free options query
  useEffect(() => {
    const missing = freePatterns.product_ids.filter((id) => !freeProductOptions.some((p) => p.id === id))
    if (missing.length === 0) return
    supabase
      .from('products')
      .select('id, title, images, price, active')
      .in('id', missing)
      .then(({ data }) => {
        const extras = ((data as Product[]) ?? []).filter((p) => p.images?.[0])
        if (extras.length === 0) return
        setFreeProductOptions((prev) => {
          const seen = new Set(prev.map((p) => p.id))
          return [...prev, ...extras.filter((p) => !seen.has(p.id))]
        })
      })
  }, [freePatterns.product_ids, freeProductOptions])

  const save = async (key: SettingKey, value: unknown): Promise<boolean> => {
    setSaveState({ key, status: 'saving' })
    const { error } = await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() })
    if (error) {
      setSaveState({ key, status: 'error', message: error.message })
      return false
    }
    clearHomeCatalogCache()
    try {
      await revalidateStorefront()
    } catch {
      /* the page still refreshes within a minute */
    }
    setSaveState({ key, status: 'saved' })
    setTimeout(() => setSaveState((s) => (s?.key === key && s.status === 'saved' ? null : s)), 4000)
    return true
  }

  const uploadImages = async (files: File[], onDone: (urls: string[]) => void, tag: string) => {
    setUploadingKey(tag)
    const maxDim =
      tag === 'hero' ? IMAGE_MAX.hero
      : tag === 'seo-og' ? 1200
      : tag.startsWith('chapter') ? IMAGE_MAX.chapter
      : IMAGE_MAX.general
    const urls: string[] = []
    for (const rawFile of files) {
      const validation = await validateImageFile(rawFile)
      if (!validation.ok) {
        alert(`${rawFile.name}: ${validation.reason}`)
        continue
      }
      const file = await compressImage(rawFile, maxDim, 0.8)
      const path = `homepage/${tag}-${crypto.randomUUID()}-${file.name}`
      const { error } = await supabase.storage.from('product-images').upload(path, file, {
        cacheControl: PRODUCT_IMAGE_CACHE_CONTROL,
        contentType: file.type || 'image/webp',
      })
      if (!error) {
        urls.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)
      } else {
        alert(`${rawFile.name} failed to upload: ${error.message}`)
      }
    }
    if (urls.length) onDone(urls)
    setUploadingKey(null)
  }

  if (loading) return <p className="text-ink-soft text-sm">Loading…</p>

  const setC = (k: keyof HomeCopy) => (v: string) => setCopy({ ...copy, [k]: v })
  const bar = (key: SettingKey, onSave: () => void) => <SaveBar state={saveState?.key === key ? saveState : null} onSave={onSave} />
  const card = (id: string, title: string, where: string, children: ReactNode) => (
    <Card id={id} title={title} where={where} open={openId === id} onToggle={() => setOpenId(openId === id ? '' : id)}>{children}</Card>
  )

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-[22px] md:text-[24px] font-bold leading-tight text-ink">Homepage</h1>
          <p className="mt-1 text-[13px] text-[#777]">Each card matches a section of the live homepage, top to bottom. Changes go live as soon as you press Save.</p>
        </div>
        <Link href="/" target="_blank" className="min-h-10 inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-4 text-[13px] text-ink">View homepage ↗</Link>
      </div>

      {card('hero', '1 · Top banner', 'First thing visitors see: headline, buttons and photos', (
        <>
          <DropzoneUpload
            label="Banner photos (first one is the big photo; others fill the small tiles)"
            sizeHint="1920×1000px, landscape, at least 1600px wide"
            urls={hero.images ?? []}
            accept="image/jpeg,image/png"
            acceptLabel="JPEG or PNG"
            uploading={uploadingKey === 'hero'}
            onAdd={(files) => uploadImages(files, (urls) => setHero({ ...hero, images: [...(hero.images ?? []), ...urls] }), 'hero')}
            onRemove={(url) => setHero({ ...hero, images: (hero.images ?? []).filter((u) => u !== url) })}
            onReorder={(from, to) => {
              const next = [...(hero.images ?? [])]
              const [moved] = next.splice(from, 1)
              next.splice(to, 0, moved)
              setHero({ ...hero, images: next })
            }}
          />
          <TextField label="Small label above the headline" value={copy.hero_eyebrow} onChange={setC('hero_eyebrow')} />
          <TextField label="Headline (new line = new row; put *stars* around the highlighted word)" value={copy.hero_title} onChange={setC('hero_title')} multiline />
          <TextField label="Text under the headline" value={copy.hero_subtitle} onChange={setC('hero_subtitle')} multiline />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="Button 1 text" value={copy.hero_cta} onChange={setC('hero_cta')} />
            <TextField label="Button 1 goes to" value={hero.cta_link} onChange={(v) => setHero({ ...hero, cta_link: v })} />
            <TextField label="Button 2 text" value={copy.hero_cta2} onChange={setC('hero_cta2')} />
            <TextField label="Button 2 goes to" value={hero.secondary_cta_link ?? ''} onChange={(v) => setHero({ ...hero, secondary_cta_link: v })} />
          </div>
          <p className="text-[11px] text-ink-soft">Paid patterns: /shop?price=paid · Free patterns: /shop?price=free</p>
          {bar('homepage_copy', async () => {
            if (await save('hero', hero)) await save('homepage_copy', copy)
          })}
        </>
      ))}

      {card('collections', '2 · Collections photos', 'The three cards (Beginner / Intermediate / Advanced). Photo and title come from your patterns; upload a photo here to override it.', (
        <>
          {chapters.length === 0 && <p className="text-[13px] text-ink-soft">Nothing to edit yet — the cards use photos of your featured patterns automatically.</p>}
          {chapters.map((c, i) => (
            <DropzoneUpload
              key={c.level}
              label={`${c.level[0].toUpperCase()}${c.level.slice(1)} card photo`}
              sizeHint="1200×900px, landscape (4:3)"
              urls={c.image ? [c.image] : []}
              accept="image/jpeg,image/png"
              acceptLabel="JPEG or PNG"
              multiple={false}
              uploading={uploadingKey === `chapter-${i}`}
              onAdd={(files) => uploadImages(files, (urls) => { const next = [...chapters]; next[i] = { ...c, image: urls[0] }; setChapters(next) }, `chapter-${i}`)}
              onRemove={() => { const next = [...chapters]; next[i] = { ...c, image: '' }; setChapters(next) }}
              onReorder={() => {}}
            />
          ))}
          {chapters.length > 0 && bar('chapters', () => save('chapters', chapters))}
        </>
      ))}

      {card('story', '3 · Our story', 'The text beside the photo collage (photos are picked from your featured patterns)', (
        <>
          <TextField label="Small label" value={copy.story_eyebrow} onChange={setC('story_eyebrow')} />
          <TextField label="Heading" value={copy.story_title} onChange={setC('story_title')} />
          <TextField label="Paragraph 1" value={copy.story_p1} onChange={setC('story_p1')} multiline />
          <TextField label="Paragraph 2" value={copy.story_p2} onChange={setC('story_p2')} multiline />
          <TextField label="Button text (goes to the shop)" value={copy.story_cta} onChange={setC('story_cta')} />
          {bar('homepage_copy', () => save('homepage_copy', copy))}
        </>
      ))}

      {card('free', '4 · Start with free', 'Pick 2–4 free patterns for the photo collage. Mobile shows 1, tablet 2, desktop up to 4.', (
        <>
          <FreePatternsCollagePicker selectedIds={freePatterns.product_ids} options={freeProductOptions} onChange={(product_ids) => setFreePatterns({ product_ids })} />
          {bar('free_patterns', () => save('free_patterns', normalizeFreePatternsBanner(freePatterns)))}
        </>
      ))}

      {card('reviews', '5 · Reviews', 'Shows real approved customer reviews only — manage them under Reviews.', (
        <Link href="/admin/reviews" className="inline-flex min-h-10 items-center rounded-full border border-[#E5E7EB] px-4 text-[13px]">Go to Reviews →</Link>
      ))}

      {announcements && card('announcement', 'Announcement bar', 'The thin strip above the header on every page', (
        <>
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-[13px] font-medium text-ink">Show announcement bar on site</span>
              <button
                type="button"
                role="switch"
                aria-checked={announcements.enabled}
                onClick={() => setAnnouncements({ ...announcements, enabled: !announcements.enabled })}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${announcements.enabled ? 'bg-ink' : 'bg-[#D1D5DB]'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${announcements.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </label>
            <p className="text-[11px] text-ink-soft -mt-2">
              Off = bar is completely hidden. On with empty text lines also hides the bar (nothing renders).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-[12px] text-ink-soft">
                Background color
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="color"
                    value={announcements.bg_color}
                    onChange={(e) => setAnnouncements({ ...announcements, bg_color: e.target.value })}
                    className="w-10 h-10 rounded border border-line cursor-pointer bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={announcements.bg_color}
                    onChange={(e) => setAnnouncements({ ...announcements, bg_color: e.target.value })}
                    className="flex-1 border border-line px-3 py-2 text-[13px] bg-canvas focus:outline-none focus:border-ink font-mono"
                    placeholder={DEFAULT_ANNOUNCEMENT_COLORS.bg_color}
                  />
                </div>
              </label>
              <label className="block text-[12px] text-ink-soft">
                Text color
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="color"
                    value={announcements.text_color}
                    onChange={(e) => setAnnouncements({ ...announcements, text_color: e.target.value })}
                    className="w-10 h-10 rounded border border-line cursor-pointer bg-transparent p-0.5"
                  />
                  <input
                    type="text"
                    value={announcements.text_color}
                    onChange={(e) => setAnnouncements({ ...announcements, text_color: e.target.value })}
                    className="flex-1 border border-line px-3 py-2 text-[13px] bg-canvas focus:outline-none focus:border-ink font-mono"
                    placeholder={DEFAULT_ANNOUNCEMENT_COLORS.text_color}
                  />
                </div>
              </label>
            </div>

            <div
              className="rounded-lg px-4 py-2.5 text-center text-[12px] tracking-[0.04em]"
              style={{ background: announcements.bg_color, color: announcements.text_color }}
            >
              {announcements.messages.map((m) => m.trim()).filter(Boolean).join(' · ') || 'Preview — add a message below'}
            </div>

            <p className="text-[11px] text-ink-soft">Messages (rotates every 4 seconds when more than one)</p>
            {announcements.messages.map((msg, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={msg}
                  onChange={(e) => {
                    const next = [...announcements.messages]
                    next[i] = e.target.value
                    setAnnouncements({ ...announcements, messages: next })
                  }}
                  className="flex-1 border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink"
                  placeholder="Announcement text"
                />
                <button
                  type="button"
                  onClick={() => setAnnouncements({ ...announcements, messages: announcements.messages.filter((_, idx) => idx !== i) })}
                  className="px-3 text-[11px] text-ink-soft hover:text-madder"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAnnouncements({ ...announcements, messages: [...announcements.messages, ''] })}
              className="text-[11px] tracking-[0.1em] border-b border-ink pb-0.5"
            >
              + ADD LINE
            </button>
          {bar('announcements', () => save('announcements', announcements))}
        </>
      ))}

      {card('seo', 'Google & social sharing', 'How the homepage looks in Google results and when a link is shared', (
        <>
          <TextField label={`Page title (${seo.homepage_meta_title.length}/70)`} value={seo.homepage_meta_title} onChange={(v) => setSeo({ ...seo, homepage_meta_title: v })} />
          <TextField label={`Page description (${seo.homepage_meta_description.length}/160)`} value={seo.homepage_meta_description} onChange={(v) => setSeo({ ...seo, homepage_meta_description: v })} multiline />
          <DropzoneUpload
            label="Share image"
            sizeHint="1200×630px, landscape — used by Facebook, WhatsApp, Pinterest and other link previews"
            urls={seo.og_image ? [seo.og_image] : []}
            accept="image/jpeg,image/png"
            acceptLabel="JPEG or PNG"
            multiple={false}
            uploading={uploadingKey === 'seo-og'}
            onAdd={(files) => uploadImages(files, (urls) => setSeo({ ...seo, og_image: urls[0] ?? '' }), 'seo-og')}
            onRemove={() => setSeo({ ...seo, og_image: '' })}
            onReorder={() => {}}
          />
          <p className="text-[11px] text-ink-soft">No share image set? The first banner photo is used. Product pages use their own photo.</p>
          {bar('seo', () => save('seo', seo))}
        </>
      ))}
    </div>
  )
}

function Card({ id, title, where, open, onToggle, children }: { id: string; title: string; where: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`hp-${id}`} className="flex w-full min-h-14 items-center justify-between gap-3 px-5 py-3 text-left">
        <span>
          <span className="block text-[15px] font-semibold text-ink">{title}</span>
          <span className="block text-[12px] text-[#777]">{where}</span>
        </span>
        <span aria-hidden className={`text-[#888] transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open && <div id={`hp-${id}`} className="space-y-4 border-t border-[#EEF0F2] p-5">{children}</div>}
    </section>
  )
}

function SaveBar({ state, onSave }: { state: SaveState; onSave: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onSave} disabled={state?.status === 'saving'} className="min-h-11 rounded-full bg-ink px-6 text-[13px] font-medium text-white disabled:opacity-50">
        {state?.status === 'saving' ? 'Saving…' : 'Save'}
      </button>
      <span role="status" aria-live="polite" className="text-[13px]">
        {state?.status === 'saved' && <span className="text-deal font-medium">Saved ✓ — live on the site</span>}
        {state?.status === 'error' && <span className="text-sale">Could not save: {state.message}</span>}
      </span>
    </div>
  )
}

function FreePatternsCollagePicker({
  selectedIds,
  options,
  onChange,
}: {
  selectedIds: string[]
  options: Product[]
  onChange: (ids: string[]) => void
}) {
  const byId = new Map(options.map((p) => [p.id, p]))
  // Keep selected products that may not be in the latest free list (inactive/price change)
  const selected = selectedIds
    .map((id) => byId.get(id))
    .filter((p): p is Product => !!p)

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
      return
    }
    if (selectedIds.length >= FREE_COLLAGE_MAX) return
    onChange([...selectedIds, id])
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= selectedIds.length) return
    const next = [...selectedIds]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] tracking-[0.1em] text-ink-soft mb-2">
          SELECTED ({selectedIds.length}/{FREE_COLLAGE_MAX}) — drag order via arrows
        </p>
        {selected.length === 0 ? (
          <p className="text-[13px] text-ink-soft">None selected — homepage falls back to the newest free pattern photo.</p>
        ) : (
          <ul className="space-y-2">
            {selected.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 border border-line rounded-xl p-2 bg-surface/40">
                <img src={p.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                <span className="text-[13px] flex-1 min-w-0 truncate">{p.title}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                    className="px-2 py-1 text-[11px] border border-line rounded disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={i === selected.length - 1}
                    onClick={() => move(i, i + 1)}
                    className="px-2 py-1 text-[11px] border border-line rounded disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    className="px-2 py-1 text-[11px] text-ink-soft hover:text-madder"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-[10px] tracking-[0.1em] text-ink-soft mb-2">FREE PATTERNS WITH PHOTOS</p>
        {options.length === 0 ? (
          <p className="text-[13px] text-ink-soft">No free products with images found.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[320px] overflow-y-auto pr-1">
            {options.map((p) => {
              const on = selectedIds.includes(p.id)
              const full = !on && selectedIds.length >= FREE_COLLAGE_MAX
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={full}
                  onClick={() => toggle(p.id)}
                  title={p.title}
                  className={`relative rounded-xl overflow-hidden border text-left disabled:opacity-40 ${
                    on ? 'border-ink ring-2 ring-ink/20' : 'border-line hover:border-ink/40'
                  }`}
                >
                  <img src={p.images[0]} alt="" className="aspect-square w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[10px] px-1.5 py-1 truncate">
                    {p.title}
                  </span>
                  {on && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-ink text-canvas text-[10px] flex items-center justify-center">
                      {selectedIds.indexOf(p.id) + 1}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[10px] tracking-[0.1em] text-ink-soft mb-1.5">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-line px-3 py-2.5 text-[13px] bg-canvas focus:outline-none focus:border-ink" />
      )}
    </label>
  )
}
