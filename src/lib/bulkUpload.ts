import Papa from 'papaparse'
import type { Category } from './types'

/** Exact CSV headers expected by the bulk uploader. */
export const BULK_CSV_HEADERS = [
  'title',
  'subtitle',
  'description',
  'price',
  'sale_price',
  'skill_level',
  'category',
  'tags',
  'ls_checkout_id',
  'ls_variant_id',
  'folder_name',
] as const

export type BulkCsvRow = Record<(typeof BULK_CSV_HEADERS)[number], string>

export type PdfMatchStatus = 'none' | 'one' | 'multiple'

export type BulkPreviewStatus = 'ready' | 'pdf_warning' | 'skip'

export type BulkPreviewRow = {
  rowNumber: number
  csv: BulkCsvRow
  title: string
  matchedFolder: string | null
  pdfStatus: PdfMatchStatus
  imageCount: number
  status: BulkPreviewStatus
  skipReason: string | null
  warnings: string[]
}

export type BulkUploadResult =
  | { outcome: 'created'; rowNumber: number; title: string; productId: string; draftReason: string | null }
  | { outcome: 'skipped'; rowNumber: number; title: string; reason: string }

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp'])
const SKILL_LEVELS = new Set(['beginner', 'intermediate', 'advanced'])

export function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function fileExt(name: string) {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

function normalizePath(path: string) {
  return path.replace(/\\/g, '/')
}

/** Index immediate sub-folders under the selected parent directory. */
export function indexFolderFiles(files: File[]): Map<string, File[]> {
  const map = new Map<string, File[]>()
  for (const file of files) {
    const rel = normalizePath((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name)
    const parts = rel.split('/').filter(Boolean)
    if (parts.length < 2) continue
    const subfolder = parts[parts.length - 2]
    const bucket = map.get(subfolder) ?? []
    bucket.push(file)
    map.set(subfolder, bucket)
  }
  return map
}

function splitPdfAndImages(folderFiles: File[]) {
  const pdfs: File[] = []
  const images: File[] = []
  for (const f of folderFiles) {
    const ext = fileExt(f.name)
    if (ext === 'pdf') pdfs.push(f)
    else if (IMAGE_EXT.has(ext)) images.push(f)
  }
  return { pdfs, images }
}

export function resolveCategoryId(categoryValue: string, categories: Category[]): string | null {
  const raw = categoryValue.trim()
  if (!raw) return null
  const bySlug = categories.find((c) => c.slug === raw)
  if (bySlug) return bySlug.id
  const lower = raw.toLowerCase()
  const byName = categories.find((c) => c.name.toLowerCase() === lower)
  return byName?.id ?? null
}

function parsePrice(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed.replace(/[$,]/g, ''))
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

function parseOptionalPrice(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return parsePrice(trimmed)
}

/** RFC 4180 CSV parse via Papa Parse (quoted commas, newlines, escaped quotes). */
export function parseCsv(text: string): { headers: string[]; rows: BulkCsvRow[]; error: string | null } {
  const parsed = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: 'greedy',
  })

  if (parsed.errors.length > 0) {
    const msg = parsed.errors.map((e) => e.message).join('; ')
    return { headers: [], rows: [], error: `CSV parse error: ${msg}` }
  }

  const rawRows = parsed.data.filter((row) => row.some((cell) => String(cell ?? '').trim()))
  if (rawRows.length === 0) return { headers: [], rows: [], error: 'CSV file is empty.' }

  const headers = rawRows[0].map((h) => String(h ?? '').trim().toLowerCase())
  const missing = BULK_CSV_HEADERS.filter((h) => !headers.includes(h))
  if (missing.length) {
    return {
      headers,
      rows: [],
      error: `Missing required column(s): ${missing.join(', ')}. Expected: ${BULK_CSV_HEADERS.join(', ')}`,
    }
  }

  const rows: BulkCsvRow[] = []
  for (let i = 1; i < rawRows.length; i++) {
    const cells = rawRows[i]
    if (cells.every((c) => !String(c ?? '').trim())) continue
    const row = {} as BulkCsvRow
    for (const h of BULK_CSV_HEADERS) {
      const idx = headers.indexOf(h)
      row[h] = idx >= 0 ? String(cells[idx] ?? '') : ''
    }
    rows.push(row)
  }

  return { headers, rows, error: null }
}

export function buildPreviewRows(
  csvRows: BulkCsvRow[],
  folderIndex: Map<string, File[]>,
  categories: Category[],
): BulkPreviewRow[] {
  return csvRows.map((csv, index) => {
    const rowNumber = index + 1
    const title = csv.title.trim()
    const warnings: string[] = []
    const folderKey = csv.folder_name.trim()
    const folderFiles = folderKey ? folderIndex.get(folderKey) ?? null : null
    const matchedFolder = folderFiles ? folderKey : null

    if (csv.tags.trim()) {
      warnings.push('Tags column has no products field — value ignored.')
    }

    let skipReason: string | null = null

    if (!title) skipReason = 'Missing title.'
    else if (!csv.description.trim()) skipReason = 'Missing description.'
    else if (parsePrice(csv.price) === null) skipReason = 'Invalid or missing price.'
    else if (!csv.category.trim()) skipReason = 'Missing category.'
    else if (!resolveCategoryId(csv.category, categories)) skipReason = `Unknown category "${csv.category.trim()}".`
    else if (!folderKey) skipReason = 'Missing folder_name.'
    else if (!matchedFolder) skipReason = `No sub-folder "${folderKey}" found in selected directory.`
    else {
      const skill = csv.skill_level.trim().toLowerCase()
      if (skill && !SKILL_LEVELS.has(skill)) {
        skipReason = `Invalid skill_level "${csv.skill_level.trim()}" (use beginner, intermediate, or advanced).`
      }
      const sale = parseOptionalPrice(csv.sale_price)
      if (csv.sale_price.trim() && sale === null) {
        skipReason = 'Invalid sale_price.'
      }
    }

    const { pdfs, images } = folderFiles ? splitPdfAndImages(folderFiles) : { pdfs: [], images: [] }
    const pdfStatus: PdfMatchStatus = pdfs.length === 0 ? 'none' : pdfs.length === 1 ? 'one' : 'multiple'

    let status: BulkPreviewStatus = 'ready'
    if (skipReason) {
      status = 'skip'
    } else if (pdfStatus !== 'one') {
      status = 'pdf_warning'
      warnings.push(
        pdfStatus === 'none'
          ? 'No PDF found — product will upload as draft without a pattern file.'
          : `${pdfs.length} PDFs found — product will upload as draft without attaching a PDF.`,
      )
    }

    return {
      rowNumber,
      csv,
      title,
      matchedFolder,
      pdfStatus,
      imageCount: images.length,
      status,
      skipReason,
      warnings,
    }
  })
}

export type BulkProductPayload = {
  title: string
  slug: string
  subtitle: string | null
  description: string | null
  skill_level: 'beginner' | 'intermediate' | 'advanced' | null
  price: number
  compare_at_price: number | null
  category_id: string
  lemon_product_id: string | null
  lemon_variant_id: string
  active: false
}

export function rowToProductPayload(row: BulkPreviewRow, slug: string, categoryId: string): BulkProductPayload {
  const skill = row.csv.skill_level.trim().toLowerCase()
  const sale = parseOptionalPrice(row.csv.sale_price)
  return {
    title: row.title,
    slug,
    subtitle: row.csv.subtitle.trim() || null,
    description: row.csv.description.trim() || null,
    skill_level: skill && SKILL_LEVELS.has(skill) ? (skill as BulkProductPayload['skill_level']) : null,
    price: parsePrice(row.csv.price)!,
    compare_at_price: sale,
    category_id: categoryId,
    lemon_product_id: row.csv.ls_checkout_id.trim() || null,
    lemon_variant_id: row.csv.ls_variant_id.trim() || '',
    active: false,
  }
}

export function getFolderFilesForRow(row: BulkPreviewRow, folderIndex: Map<string, File[]>) {
  const key = row.csv.folder_name.trim()
  const files = folderIndex.get(key) ?? []
  return splitPdfAndImages(files)
}
