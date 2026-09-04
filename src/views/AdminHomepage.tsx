'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/imageCompress'
import { IMAGE_MAX, validateImageFile } from '../lib/imageVariants'
import type { HeroContent, ChapterContent, CategoryContent, AnnouncementsContent, SocialContent, LayoutSection, TestimonialContent, SiteSeoContent } from '../lib/types'
import { DEFAULT_ANNOUNCEMENT_COLORS, normalizeAnnouncements } from '../lib/types'
import { DEFAULT_SITE_SEO } from '../lib/seoSettings'
import { mergeLayout } from '../lib/defaultLayout'
import { DropzoneUpload } from '../components/DropzoneUpload'

export function HomepageAdmin() {
  const [hero, setHero] = useState<HeroContent | null>(null)
  const [chapters, setChapters] = useState<ChapterContent[]>([])
  const [categories, setCategories] = useState<CategoryContent[]>([])
  const [realCategories, setRealCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementsContent | null>(null)
  const [social, setSocial] = useState<SocialContent | null>(null)
  const [testimonials, setTestimonials] = useState<TestimonialContent[]>([])
  const [layout, setLayout] = useState<LayoutSection[] | null>(null)
  const [seo, setSeo] = useState<SiteSeoContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  const load = () => {
    supabase.from('site_settings').select('key, value').in('key', ['hero', 'chapters', 'categories', 'announcements', 'social', 'homepage_layout', 'testimonials', 'seo']).then(({ data }) => {
      let foundAnnouncements = false
      let foundSeo = false
      for (const row of data ?? []) {
        if (row.key === 'hero') setHero(row.value as HeroContent)
        if (row.key === 'chapters') setChapters(row.value as ChapterContent[])
        if (row.key === 'categories') setCategories(row.value as CategoryContent[])
        if (row.key === 'announcements') {
          setAnnouncements(normalizeAnnouncements(row.value))
          foundAnnouncements = true
        }
        if (row.key === 'social') setSocial(row.value as SocialContent)
        if (row.key === 'homepage_layout') setLayout(mergeLayout(row.value as LayoutSection[]))
        if (row.key === 'testimonials') setTestimonials(row.value as TestimonialContent[])
        if (row.key === 'seo') {
          setSeo({ ...DEFAULT_SITE_SEO, ...(row.value as Partial<SiteSeoContent>) })
          foundSeo = true
        }
      }
      if (!foundAnnouncements) {
        setAnnouncements(normalizeAnnouncements({ enabled: false, messages: [''] }))
      }
      if (!foundSeo) {
        setSeo({ ...DEFAULT_SITE_SEO })
      }
      setLoading(false)
    })
  }

  useEffect(load, [])
  useEffect(() => {
    supabase.from('categories').select('id, name, slug').order('sort_order').then(({ data }) => setRealCategories(data ?? []))
  }, [])

  const save = async (key: 'hero' | 'chapters' | 'categories' | 'announcements' | 'social' | 'homepage_layout' | 'testimonials' | 'seo', value: unknown) => {
    setSavingKey(key)
    await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() })
    setSavingKey(null)
  }

  const uploadImages = async (files: File[], onDone: (urls: string[]) => void, tag: string) => {
    setUploadingKey(tag)
    const maxDim =
      tag === 'hero' ? IMAGE_MAX.hero
      : tag === 'seo-og' ? 1200
      : tag.startsWith('chapter') ? IMAGE_MAX.chapter
      : tag.startsWith('testimonial') ? 400
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
        cacheControl: '31536000',
        contentType: file.type || 'image/webp',
      })
      if (!error) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(path)
        urls.push(data.publicUrl)
      } else {
        alert(`${rawFile.name} failed to upload: ${error.message}`)
      }
    }
    if (urls.length) onDone(urls)
    setUploadingKey(null)
  }

  if (loading) return <p className="text-ink-soft text-sm">Loading…</p>

  return (
    <div className="space-y-16 max-w-3xl">
      <h1 className="font-display font-semibold text-2xl">Homepage</h1>

      {/* SEO & SOCIAL */}
      {seo && (
        <div>
          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-4">SEO &amp; SOCIAL SHARING</p>
          <div className="space-y-4 border border-line rounded-2xl p-6 bg-white">
            <TextField
              label={`Homepage meta title (${seo.homepage_meta_title.length}/70)`}
              value={seo.homepage_meta_title}
              onChange={(v) => setSeo({ ...seo, homepage_meta_title: v })}
            />
            <TextField
              label={`Homepage meta description (${seo.homepage_meta_description.length}/160)`}
              value={seo.homepage_meta_description}
              onChange={(v) => setSeo({ ...seo, homepage_meta_description: v })}
              multiline
            />
            <DropzoneUpload
              label="Social share image (OG image)"
              sizeHint="1200×630px, landscape — used for Facebook, WhatsApp, Twitter, and other link previews site-wide"
              urls={seo.og_image ? [seo.og_image] : []}
              accept="image/jpeg,image/png"
              acceptLabel="JPEG or PNG"
              multiple={false}
              uploading={uploadingKey === 'seo-og'}
              onAdd={(files) => uploadImages(files, (urls) => setSeo({ ...seo, og_image: urls[0] ?? '' }), 'seo-og')}
              onRemove={() => setSeo({ ...seo, og_image: '' })}
              onReorder={() => {}}
            />
            <p className="text-[11px] text-ink-soft">
              If no social image is set, the first hero banner image is used. Product pages use their own primary photo when available.
            </p>
            <SaveButton onClick={() => save('seo', seo)} saving={savingKey === 'seo'} />
          </div>
        </div>
      )}

      {/* LAYOUT — reorder and show/hide sections */}
      {layout && (
        <div>
          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-4">HOMEPAGE LAYOUT (DRAG TO REORDER)</p>
          <LayoutBuilder layout={layout} onChange={setLayout} />
          <div className="mt-4"><SaveButton onClick={() => save('homepage_layout', layout)} saving={savingKey === 'homepage_layout'} /></div>
        </div>
      )}

      {/* HERO */}
      {hero && (
        <div>
          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-4">HERO BANNER</p>
          <div className="space-y-4 border border-line rounded-2xl p-6 bg-white">
            <DropzoneUpload
              label="Hero images (rotates automatically if more than one — first is shown first)"
              sizeHint="1920×1000px, landscape (~1.9:1), at least 1600px wide — this is a full-width banner that fills most of the screen height"
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
            <TextField label="Eyebrow (small label above title)" value={hero.eyebrow} onChange={(v) => setHero({ ...hero, eyebrow: v })} />
            <TextField label="Title" value={hero.title} onChange={(v) => setHero({ ...hero, title: v })} multiline />
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Button 1 text" value={hero.cta_text} onChange={(v) => setHero({ ...hero, cta_text: v })} />
              <TextField label="Button 1 link" value={hero.cta_link} onChange={(v) => setHero({ ...hero, cta_link: v })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Button 2 text" value={hero.secondary_cta_text ?? ''} onChange={(v) => setHero({ ...hero, secondary_cta_text: v })} />
              <TextField label="Button 2 link" value={hero.secondary_cta_link ?? ''} onChange={(v) => setHero({ ...hero, secondary_cta_link: v })} />
            </div>
            <SaveButton onClick={() => save('hero', hero)} saving={savingKey === 'hero'} />
          </div>
        </div>
      )}

      {/* CHAPTERS */}
      {chapters.length > 0 && (
        <div>
          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-4">CHAPTER CARDS (BEGINNER / INTERMEDIATE / ADVANCED)</p>
          <div className="space-y-6">
            {chapters.map((c, i) => (
              <div key={c.level} className="border border-line rounded-2xl p-6 space-y-4 bg-white">
                <p className="text-[11px] tracking-[0.1em] text-ink-soft">{c.level.toUpperCase()}</p>
                <DropzoneUpload
                  label="Card image"
                  sizeHint="1200×900px, landscape (4:3)"
                  urls={c.image ? [c.image] : []}
                  accept="image/jpeg,image/png"
                  acceptLabel="JPEG or PNG"
                  multiple={false}
                  uploading={uploadingKey === `chapter-${i}`}
                  onAdd={(files) => uploadImages(files, (urls) => {
                    const next = [...chapters]; next[i] = { ...c, image: urls[0] }; setChapters(next)
                  }, `chapter-${i}`)}
                  onRemove={() => { const next = [...chapters]; next[i] = { ...c, image: '' }; setChapters(next) }}
                  onReorder={() => {}}
                />
                <TextField label="Label" value={c.label} onChange={(v) => { const next = [...chapters]; next[i] = { ...c, label: v }; setChapters(next) }} />
                <TextField label="Title" value={c.title} onChange={(v) => { const next = [...chapters]; next[i] = { ...c, title: v }; setChapters(next) }} />
                <TextField label="Description" value={c.copy} onChange={(v) => { const next = [...chapters]; next[i] = { ...c, copy: v }; setChapters(next) }} multiline />
              </div>
            ))}
          </div>
          <div className="mt-4"><SaveButton onClick={() => save('chapters', chapters)} saving={savingKey === 'chapters'} /></div>
        </div>
      )}

      {/* CATEGORIES */}
      <div>
        <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-2">CATEGORY DESCRIPTIONS ("SHOP BY CATEGORY")</p>
        <p className="text-[11px] text-ink-soft/80 mb-4">
          Picture and name come from the real category (Admin → Categories) and stay in sync everywhere automatically — this is just optional homepage flavor text per category.
        </p>
        <div className="space-y-6">
          {categories.map((c, i) => (
            <div key={i} className="border border-line rounded-2xl p-6 space-y-4 bg-white">
              <div>
                <span className="block text-[10px] tracking-[0.1em] text-ink-soft mb-1.5">CATEGORY</span>
                <select
                  value={c.link}
                  onChange={(e) => { const next = [...categories]; next[i] = { ...c, link: e.target.value }; setCategories(next) }}
                  className="input"
                >
                  <option value="">— Select a category —</option>
                  {realCategories.map((rc) => (
                    <option key={rc.id} value={`/shop/${rc.slug}`}>{rc.name}</option>
                  ))}
                </select>
              </div>
              <TextField label="Description" value={c.copy} onChange={(v) => { const next = [...categories]; next[i] = { ...c, copy: v }; setCategories(next) }} />
              <button onClick={() => setCategories(categories.filter((_, idx) => idx !== i))} className="text-[11px] text-ink-soft hover:text-madder">✕ REMOVE</button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => setCategories([...categories, { name: '', copy: '', image: '', link: '' }])}
            className="text-[11px] tracking-[0.1em] border-b border-ink pb-0.5"
          >
            + ADD DESCRIPTION
          </button>
          <SaveButton onClick={() => save('categories', categories)} saving={savingKey === 'categories'} />
        </div>
      </div>

      {/* ANNOUNCEMENT BAR */}
      {announcements && (
        <div>
          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-4">ANNOUNCEMENT BAR</p>
          <div className="border border-line rounded-2xl p-6 space-y-4 bg-white">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-[13px] font-medium text-ink">Show announcement bar on site</span>
              <button
                type="button"
                role="switch"
                aria-checked={announcements.enabled}
                onClick={() => setAnnouncements({ ...announcements, enabled: !announcements.enabled })}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${announcements.enabled ? 'bg-ink' : 'bg-[#d4d0c8]'}`}
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
            <div>
              <SaveButton onClick={() => save('announcements', announcements)} saving={savingKey === 'announcements'} />
            </div>
          </div>
        </div>
      )}

      {/* TESTIMONIALS */}
      <div>
        <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-2">CUSTOMER TESTIMONIALS ("WHAT OUR MAKERS SAY")</p>
        <p className="text-[11px] text-ink-soft/80 mb-4">Only add real feedback from real customers — this shows publicly with their name. Leave empty to hide the testimonial slot.</p>
        <div className="border border-line rounded-2xl p-6 space-y-4 bg-white">
          {testimonials.map((t, i) => (
            <div key={i} className="border border-line rounded-xl p-4 space-y-3 bg-surface/40">
              <DropzoneUpload
                label="Photo (optional — shows a neutral placeholder if left empty)"
                sizeHint="200×200px, square"
                urls={t.photo ? [t.photo] : []}
                accept="image/jpeg,image/png"
                acceptLabel="JPEG or PNG"
                multiple={false}
                uploading={uploadingKey === `testimonial-${i}`}
                onAdd={(files) => uploadImages(files, (urls) => { const next = [...testimonials]; next[i] = { ...t, photo: urls[0] }; setTestimonials(next) }, `testimonial-${i}`)}
                onRemove={() => { const next = [...testimonials]; next[i] = { ...t, photo: undefined }; setTestimonials(next) }}
                onReorder={() => {}}
              />
              <TextField label="Quote" value={t.quote} onChange={(v) => { const next = [...testimonials]; next[i] = { ...t, quote: v }; setTestimonials(next) }} multiline />
              <TextField label="Customer name" value={t.name} onChange={(v) => { const next = [...testimonials]; next[i] = { ...t, name: v }; setTestimonials(next) }} />
              <TextField label="Role / context (e.g. Verified Buyer)" value={t.role} onChange={(v) => { const next = [...testimonials]; next[i] = { ...t, role: v }; setTestimonials(next) }} />
              <button onClick={() => setTestimonials(testimonials.filter((_, idx) => idx !== i))} className="text-[11px] text-ink-soft hover:text-madder">✕ REMOVE</button>
            </div>
          ))}
          <button
            onClick={() => setTestimonials([...testimonials, { quote: '', name: '', role: 'Verified Buyer' }])}
            className="text-[11px] tracking-[0.1em] border-b border-ink pb-0.5"
          >
            + ADD TESTIMONIAL
          </button>
          <div><SaveButton onClick={() => save('testimonials', testimonials)} saving={savingKey === 'testimonials'} /></div>
        </div>
      </div>

      {/* SOCIAL LINKS */}
      {social && (
        <div>
          <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-4">SOCIAL LINKS (FOOTER — LEAVE BLANK TO HIDE)</p>
          <div className="border border-line rounded-2xl p-6 space-y-4 bg-white">
            <TextField label="Instagram URL" value={social.instagram} onChange={(v) => setSocial({ ...social, instagram: v })} />
            <TextField label="Pinterest URL" value={social.pinterest ?? ''} onChange={(v) => setSocial({ ...social, pinterest: v })} />
            <TextField label="Facebook URL" value={social.facebook ?? ''} onChange={(v) => setSocial({ ...social, facebook: v })} />
            <TextField label="YouTube URL" value={social.youtube} onChange={(v) => setSocial({ ...social, youtube: v })} />
            <SaveButton onClick={() => save('social', social)} saving={savingKey === 'social'} />
          </div>
        </div>
      )}
    </div>
  )
}

function LayoutBuilder({ layout, onChange }: { layout: LayoutSection[]; onChange: (l: LayoutSection[]) => void }) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const reorder = (from: number, to: number) => {
    const next = [...layout]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  const toggleVisible = (i: number) => {
    const next = [...layout]
    next[i] = { ...next[i], visible: !next[i].visible }
    onChange(next)
  }

  return (
    <div className="border border-line rounded-2xl divide-y divide-line bg-white overflow-hidden">
      {layout.map((s, i) => (
        <div
          key={s.id}
          draggable
          onDragStart={() => setDraggedIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (draggedIndex !== null && draggedIndex !== i) reorder(draggedIndex, i)
            setDraggedIndex(null)
          }}
          className={`flex items-center gap-3 px-4 py-3.5 cursor-move bg-canvas ${!s.visible ? 'opacity-40' : ''}`}
        >
          <span className="text-ink-soft text-sm select-none" aria-hidden="true">⠿</span>
          <span className="text-[13px] flex-1">{s.label}</span>
          <button
            onClick={() => toggleVisible(i)}
            className={`px-3 py-1.5 text-[10px] tracking-[0.08em] rounded-full ${s.visible ? 'bg-ink text-canvas' : 'border border-line text-ink-soft'}`}
          >
            {s.visible ? 'VISIBLE' : 'HIDDEN'}
          </button>
        </div>
      ))}
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

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button onClick={onClick} disabled={saving} className="px-6 py-3 bg-ink text-canvas text-[11px] tracking-[0.12em] hover:opacity-85 disabled:opacity-50 rounded-full">
      {saving ? 'SAVING…' : 'SAVE'}
    </button>
  )
}
