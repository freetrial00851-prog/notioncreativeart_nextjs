export type Category = {
  id: string
  name: string
  slug: string
  sort_order: number
  parent_id: string | null
  image: string | null
}

export type Product = {
  id: string
  title: string
  slug: string
  /** Short blurb under the product title (~100–150 chars); distinct from description. */
  subtitle: string | null
  description: string | null
  skill_level: 'beginner' | 'intermediate' | 'advanced' | null
  price: number
  compare_at_price: number | null
  category_id: string | null
  images: string[]
  pdf_pages: number | null
  materials: string | null
  wishlist_count: number
  lemon_variant_id: string
  lemon_numeric_variant_id: string | null
  /** Which payment provider sells this pattern. null/undefined = the site default (Lemon Squeezy). */
  checkout_provider?: 'lemonsqueezy' | 'paddle' | null
  /** Paddle price ids (pri_...): live and sandbox are separate Paddle accounts. */
  paddle_price_id?: string | null
  paddle_price_id_sandbox?: string | null
  paddle_product_id?: string | null
  active: boolean
  featured: boolean
  /** Optional card badge. null = none. Admin-controlled; default none. */
  card_badge: 'sale' | 'new' | 'featured' | null
  sold_out: boolean
  checkout_mode: 'overlay' | 'hosted'
  is_bundle: boolean
  bundle_includes: string[]
  meta_title: string | null
  meta_description: string | null
  pdf_filename: string | null
  created_at: string
  deleted_at: string | null
}

export type AnnouncementsContent = {
  /** When false, the bar is not rendered at all. */
  enabled: boolean
  messages: string[]
  /** CSS color for the bar background (default #111111). */
  bg_color: string
  /** CSS color for the bar text (default #ffffff). */
  text_color: string
}

export const DEFAULT_ANNOUNCEMENT_COLORS = {
  bg_color: '#111111',
  text_color: '#ffffff',
} as const

/** Normalize legacy `{ messages }` rows and apply color/enabled defaults. */
export function normalizeAnnouncements(raw: unknown): AnnouncementsContent {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<AnnouncementsContent>
  const messages = Array.isArray(value.messages) ? value.messages.map(String) : []
  const hasText = messages.some((m) => m.trim().length > 0)
  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : hasText,
    messages,
    bg_color: value.bg_color?.trim() || DEFAULT_ANNOUNCEMENT_COLORS.bg_color,
    text_color: value.text_color?.trim() || DEFAULT_ANNOUNCEMENT_COLORS.text_color,
  }
}

export function activeAnnouncementMessages(content: AnnouncementsContent): string[] {
  return content.messages.map((m) => m.trim()).filter(Boolean)
}

/** Bar renders only when enabled AND at least one non-empty message (on+empty ≡ hidden). */
export function shouldShowAnnouncementBar(content: AnnouncementsContent | null | undefined): boolean {
  if (!content?.enabled) return false
  return activeAnnouncementMessages(content).length > 0
}

export type LayoutSection = {
  id: 'hero' | 'trust' | 'categories' | 'chapters' | 'skill_browse' | 'trending' | 'new_arrivals' | 'free_patterns' | 'bundles' | 'why_us' | 'testimonials' | 'newsletter'
  label: string
  visible: boolean
}

export type SocialContent = {
  instagram: string
  youtube: string
  pinterest?: string
  facebook?: string
}

export type Purchase = {
  id: string
  user_id: string
  product_id: string
  order_id: string | null
  purchase_date: string
  product?: Product
  order?: { lemon_order_id: string | null; display_order_number?: string | null; status: string; amount: number; currency: string }
}

export type WishlistItem = {
  user_id: string
  product_id: string
  created_at: string
  product?: Product
}

export type HeroContent = {
  eyebrow: string
  title: string
  images: string[]
  cta_text: string
  cta_link: string
  secondary_cta_text?: string
  secondary_cta_link?: string
}

/**
 * Homepage "Start With Free" collage — site_settings key: `free_patterns`.
 * Ordered product IDs (2–4 recommended); primary image of each is shown.
 */
export type FreePatternsBannerContent = {
  product_ids: string[]
}

export const DEFAULT_FREE_PATTERNS_BANNER: FreePatternsBannerContent = {
  product_ids: [],
}

export function normalizeFreePatternsBanner(raw: unknown): FreePatternsBannerContent {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<FreePatternsBannerContent>
  const ids = Array.isArray(value.product_ids)
    ? value.product_ids.map(String).filter(Boolean).slice(0, 4)
    : []
  return { product_ids: ids }
}

/**
 * Editable homepage text — site_settings key: `homepage_copy`.
 * Empty / missing fields fall back to DEFAULT_HOME_COPY, so the page never shows blanks.
 * `hero_title`: one line per row; wrap the accent word in *asterisks*.
 */
export type HomeCopy = {
  hero_eyebrow: string
  hero_title: string
  hero_subtitle: string
  hero_cta: string
  hero_cta2: string
  story_eyebrow: string
  story_title: string
  story_p1: string
  story_p2: string
  story_cta: string
}

export const DEFAULT_HOME_COPY: HomeCopy = {
  hero_eyebrow: 'Crochet patterns, instant PDF downloads',
  hero_title: 'Crochet patterns\nto make something\n*lovely.*',
  hero_subtitle:
    'Amigurumi, wearables and free crochet patterns for every skill level. Download the PDF instantly and start stitching today.',
  hero_cta: 'Explore patterns',
  hero_cta2: 'Browse free patterns',
  story_eyebrow: 'A slower, lovelier way to create',
  story_title: 'Made for the joy of making.',
  story_p1:
    "We believe the best projects aren't just about what you finish. They're about the quiet moments, the little discoveries, and the happiness of making something with your own hands.",
  story_p2:
    "Our pattern collection is here to help you find that feeling, whether you're learning your first stitch or adding another lovely project to your list.",
  story_cta: 'Find your next project',
}

export function normalizeHomeCopy(raw: unknown): HomeCopy {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out = { ...DEFAULT_HOME_COPY }
  for (const key of Object.keys(out) as (keyof HomeCopy)[]) {
    const v = value[key]
    if (typeof v === 'string' && v.trim()) out[key] = v.trim().slice(0, 600)
  }
  return out
}

/** Homepage + site-wide social/SEO fields (site_settings key: `seo`). */
export type SiteSeoContent = {
  homepage_meta_title: string
  homepage_meta_description: string
  /** 1200×630 social share image URL; empty = fall back to hero image. */
  og_image: string
}

export type ChapterContent = {
  level: 'beginner' | 'intermediate' | 'advanced'
  label: string
  title: string
  copy: string
  image: string
  link: string
}

export type TestimonialContent = {
  quote: string
  name: string
  role: string
  photo?: string
}

export type CategoryContent = {
  name: string
  copy: string
  image: string
  link: string
}

export type Profile = {
  id: string
  name: string | null
  avatar_url: string | null
  is_admin: boolean
  billing_country: string | null
  billing_zip: string | null
  billing_address_line1: string | null
  billing_city: string | null
  billing_state: string | null
  name_changed_at: string | null
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export type Review = {
  id: string
  product_id: string
  user_id: string | null
  reviewer_name: string
  reviewer_email: string | null
  rating: number
  body: string
  is_verified: boolean
  purchase_id: string | null
  status: ReviewStatus
  created_at: string
  moderated_at: string | null
  moderated_by: string | null
}

export type ReviewStats = {
  averageRating: number
  reviewCount: number
}

/** First-party storefront visit recorded for Shop Manager Views stats. */
export type PageView = {
  id: string
  path: string
  created_at: string
}
