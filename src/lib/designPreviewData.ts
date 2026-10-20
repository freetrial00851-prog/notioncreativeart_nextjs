/** DESIGN PREVIEW ONLY (hidden, noindex route). Mock listings with the owner's own vertical photos — not real products. */
import type { Product } from './types'

const IMG = {
  cardigan: ['/design-preview/cardigan-1.webp', '/design-preview/cardigan-2.webp'],
  sweater: ['/design-preview/sweater-1.webp', '/design-preview/sweater-2.webp', '/design-preview/sweater-3.webp'],
  scarf: ['/design-preview/scarf-1.webp'],
}

function mock(i: number, over: Partial<Product> & Pick<Product, 'title' | 'slug' | 'images'>): Product {
  return {
    id: `00000000-0000-4000-8000-0000000000${String(10 + i)}`,
    subtitle: 'Design preview — shows how a vertical photo fills the listing',
    description:
      'This is a design preview, not a real listing. It shows how a portrait photo looks on the shop card and on the product page.\n\nIncludes a materials list, abbreviations, pattern notes and row-by-row instructions with stitch counts.\n\nThis is a digital PDF pattern only. Listing photos are AI-generated and may vary slightly from your finished result.',
    skill_level: 'intermediate',
    price: 5.43,
    compare_at_price: 7.99,
    category_id: null,
    pdf_pages: 12,
    materials: 'Medium weight (4) cotton yarn — about 800 yds\nSize I/9 (5.5 mm) crochet hook\nStitch markers\nYarn needle',
    wishlist_count: 0,
    lemon_variant_id: '',
    lemon_numeric_variant_id: null,
    active: true,
    featured: false,
    card_badge: null,
    sold_out: false,
    checkout_mode: 'overlay',
    is_bundle: false,
    bundle_includes: [],
    meta_title: null,
    meta_description: null,
    pdf_filename: null,
    created_at: new Date('2026-10-01').toISOString(),
    deleted_at: null,
    ...over,
  }
}

export const DESIGN_PREVIEW_PRODUCTS: Product[] = [
  mock(1, { title: 'Beachside Cardigan Crochet Pattern PDF', slug: 'preview-beachside-cardigan', images: [...IMG.cardigan], skill_level: 'intermediate' }),
  mock(2, { title: 'Fringe Festival Crochet Sweater Pattern PDF', slug: 'preview-fringe-sweater', images: [...IMG.sweater], skill_level: 'intermediate' }),
  mock(3, { title: 'XOXO Crochet Scarf Pattern PDF', slug: 'preview-xoxo-scarf', images: [...IMG.scarf], skill_level: 'beginner', price: 0, compare_at_price: null }),
  mock(4, { title: 'Beachside Cardigan, Second Photo Set', slug: 'preview-beachside-cardigan-b', images: [IMG.cardigan[1], IMG.cardigan[0]], skill_level: 'beginner' }),
  mock(5, { title: 'Fringe Sweater Alternate Cover', slug: 'preview-fringe-sweater-b', images: [IMG.sweater[1], IMG.sweater[0], IMG.sweater[2]], skill_level: 'advanced' }),
  mock(6, { title: 'Cardigan With A Much Longer Title To Check One-Line Truncation PDF', slug: 'preview-long-title', images: [IMG.cardigan[0]], skill_level: 'intermediate' }),
  mock(7, { title: 'Sweater Pattern PDF', slug: 'preview-sweater-c', images: [IMG.sweater[2]], skill_level: 'beginner' }),
  mock(8, { title: 'Scarf Pattern PDF', slug: 'preview-scarf-b', images: [IMG.scarf[0]], skill_level: 'beginner', price: 4.33, compare_at_price: 5.97 }),
]
