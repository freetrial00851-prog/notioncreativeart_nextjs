import type { SupabaseClient } from '@supabase/supabase-js'
import type { CategoryContent } from './types'

export type CategoryWithCount = CategoryContent & { id: string; count: number }

export async function getCategoriesWithProducts(supabase: SupabaseClient): Promise<CategoryWithCount[]> {
  // Real categories table is the source of truth — every real top-level
  // category shows automatically here, whether or not the admin has manually
  // added a homepage "card" (image/description) for it. Cards, when present,
  // are just an overlay for image/description; their absence never hides a
  // real category. Subcategories (parent_id set) are intentionally excluded
  // from this list — they show under their parent in filters/mobile expand instead.
  const [{ data: realCategories }, { data: cardsRow }] = await Promise.all([
    supabase.from('categories').select('id, name, slug, image').is('parent_id', null).order('sort_order'),
    supabase.from('site_settings').select('value').eq('key', 'categories').maybeSingle(),
  ])
  if (!realCategories || realCategories.length === 0) return []

  const cards = (cardsRow?.value as CategoryContent[]) ?? []
  const cardBySlug = new Map(cards.map((c) => [c.link.split('/').pop(), c]))

  // Real subcategories per parent, so a category's count reflects products
  // tagged to itself OR any of its subcategories — matching how the Shop
  // page itself resolves a parent category (a category isn't "empty" just
  // because every product under it lives one level down).
  const { data: allSubs } = await supabase.from('categories').select('id, parent_id').not('parent_id', 'is', null)
  const subIdsByParent = new Map<string, string[]>()
  for (const s of allSubs ?? []) {
    const list = subIdsByParent.get(s.parent_id!) ?? []
    list.push(s.id)
    subIdsByParent.set(s.parent_id!, list)
  }

  const withCounts = await Promise.all(
    realCategories.map(async (rc) => {
      const card = cardBySlug.get(rc.slug)
      const ids = [rc.id, ...(subIdsByParent.get(rc.id) ?? [])]
      const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).in('category_id', ids).eq('active', true)
      return {
        id: rc.id,
        name: rc.name,
        copy: card?.copy ?? '',
        image: rc.image ?? card?.image ?? '',
        link: `/shop/${rc.slug}`,
        count: count ?? 0,
      }
    })
  )
  // Hide genuinely empty categories from customer-facing browsing — an
  // admin can still see and manage every category (including empty ones)
  // in Admin → Categories, this only affects what shoppers see.
  return withCounts.filter((c) => c.count > 0)
}

export type SubcategoryWithCount = { id: string; name: string; slug: string; image: string | null; count: number }

/** Real subcategories (parent_id = the given category) with real product
 *  counts — used by the mobile category sheet when a top-level category is
 *  expanded. Returns [] for a category with no subcategories. */
export async function getSubcategoriesWithCounts(
  supabase: SupabaseClient,
  parentId: string,
): Promise<SubcategoryWithCount[]> {
  const { data: subs } = await supabase.from('categories').select('id, name, slug, image').eq('parent_id', parentId).order('sort_order')
  if (!subs || subs.length === 0) return []

  const withCounts = await Promise.all(
    subs.map(async (s) => {
      const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', s.id).eq('active', true)
      return { id: s.id, name: s.name, slug: s.slug, image: s.image ?? null, count: count ?? 0 }
    })
  )
  return withCounts.filter((s) => s.count > 0)
}
