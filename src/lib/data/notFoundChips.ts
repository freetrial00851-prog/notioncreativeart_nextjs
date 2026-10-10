import { getCategoriesWithProducts } from '@/lib/categories'
import { createStaticClient } from '@/lib/supabase/static'

export type NotFoundChip = { href: string; label: string }

/** Category chips that currently have products, plus Free patterns when any exist. */
export async function getNotFoundChips(): Promise<NotFoundChip[]> {
  const supabase = createStaticClient()
  const [categories, free] = await Promise.all([
    getCategoriesWithProducts(supabase),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true).eq('price', 0),
  ])

  const chips: NotFoundChip[] = categories.map((c) => ({ href: c.link, label: c.name }))
  if ((free.count ?? 0) > 0) {
    chips.push({ href: '/shop?price=free', label: 'Free patterns' })
  }
  return chips
}
