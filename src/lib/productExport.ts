import Papa from 'papaparse'
import { supabase } from './supabase'
import type { Product, Category } from './types'

export const PRODUCT_EXPORT_FIELDS = [
  { key: 'id', label: 'ID' },
  { key: 'slug', label: 'Slug' },
  { key: 'title', label: 'Title' },
  { key: 'subtitle', label: 'Subtitle' },
  { key: 'description', label: 'Description' },
  { key: 'meta_title', label: 'Meta title' },
  { key: 'meta_description', label: 'Meta description' },
  { key: 'price', label: 'Price' },
  { key: 'compare_at_price', label: 'Compare at price' },
  { key: 'category', label: 'Category' },
  { key: 'skill_level', label: 'Skill level' },
  { key: 'active', label: 'Active' },
  { key: 'sold_out', label: 'Sold out' },
  { key: 'created_at', label: 'Created at' },
] as const

export type ProductExportFieldKey = (typeof PRODUCT_EXPORT_FIELDS)[number]['key']

export type ProductExportStatusFilter = 'active' | 'draft' | 'sold_out' | 'all'

export type ProductExportFilters = {
  dateFrom: string
  dateTo: string
  categoryId: string
  skillLevel: '' | 'beginner' | 'intermediate' | 'advanced'
  status: ProductExportStatusFilter
}

export const DEFAULT_PRODUCT_EXPORT_FILTERS: ProductExportFilters = {
  dateFrom: '',
  dateTo: '',
  categoryId: '',
  skillLevel: '',
  status: 'all',
}

export const DEFAULT_PRODUCT_EXPORT_FIELDS: Record<ProductExportFieldKey, boolean> =
  Object.fromEntries(PRODUCT_EXPORT_FIELDS.map((f) => [f.key, true])) as Record<ProductExportFieldKey, boolean>

function startOfDayIso(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString()
}

function endOfDayIso(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString()
}

export async function fetchProductsForExport(filters: ProductExportFilters): Promise<Product[]> {
  let query = supabase.from('products').select('*').is('deleted_at', null).order('created_at', { ascending: false })

  if (filters.dateFrom) query = query.gte('created_at', startOfDayIso(filters.dateFrom))
  if (filters.dateTo) query = query.lte('created_at', endOfDayIso(filters.dateTo))
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.skillLevel) query = query.eq('skill_level', filters.skillLevel)

  if (filters.status === 'active') query = query.eq('active', true).eq('sold_out', false)
  else if (filters.status === 'draft') query = query.eq('active', false)
  else if (filters.status === 'sold_out') query = query.eq('sold_out', true)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as Product[]) ?? []
}

function cellValue(product: Product, field: ProductExportFieldKey, categoryById: Map<string, string>): string | number | boolean {
  switch (field) {
    case 'id':
      return product.id
    case 'slug':
      return product.slug
    case 'title':
      return product.title
    case 'subtitle':
      return product.subtitle ?? ''
    case 'description':
      return product.description ?? ''
    case 'meta_title':
      return product.meta_title ?? ''
    case 'meta_description':
      return product.meta_description ?? ''
    case 'price':
      return product.price
    case 'compare_at_price':
      return product.compare_at_price ?? ''
    case 'category':
      return product.category_id ? (categoryById.get(product.category_id) ?? '') : ''
    case 'skill_level':
      return product.skill_level ?? ''
    case 'active':
      return product.active
    case 'sold_out':
      return product.sold_out
    case 'created_at':
      return product.created_at
    default:
      return ''
  }
}

export function buildProductExportCsv(
  products: Product[],
  selectedFields: ProductExportFieldKey[],
  categories: Category[],
): string {
  const categoryById = new Map(categories.map((c) => [c.id, c.name]))
  const fields = PRODUCT_EXPORT_FIELDS.filter((f) => selectedFields.includes(f.key))
  const headers = fields.map((f) => f.label)
  const rows = products.map((product) =>
    fields.map((f) => cellValue(product, f.key, categoryById)),
  )
  const csv = Papa.unparse({ fields: headers, data: rows })
  return `\ufeff${csv}`
}

export function downloadProductExportCsv(csv: string, filename?: string): void {
  const date = new Date().toISOString().slice(0, 10)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename ?? `products-export-${date}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
