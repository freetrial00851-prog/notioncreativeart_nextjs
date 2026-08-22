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
  active: boolean
  featured: boolean
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
  messages: string[]
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
  order?: { lemon_order_id: string; status: string; amount: number; currency: string }
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
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  is_admin: boolean
  billing_country: string | null
  billing_zip: string | null
  billing_address_line1: string | null
  billing_city: string | null
  billing_state: string | null
  name_changed_at: string | null
}
