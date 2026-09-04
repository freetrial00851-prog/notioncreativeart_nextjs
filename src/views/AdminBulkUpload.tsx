'use client'

import { useEffect, useMemo, useRef, useState, type InputHTMLAttributes } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { processAndUploadImage, sanitizeFilename, validateImageFile } from '../lib/imageVariants'
import { validatePdfFile } from '../lib/uploadValidation'
import type { Category } from '../lib/types'
import {
  BULK_CSV_HEADERS,
  buildPreviewRows,
  getFolderFilesForRow,
  indexFolderFiles,
  parseCsv,
  resolveCategoryId,
  rowToProductPayload,
  slugify,
  type BulkPreviewRow,
  type BulkUploadResult,
} from '../lib/bulkUpload'
import { MaterialIcon } from '../components/MaterialIcon'

function pdfLabel(status: BulkPreviewRow['pdfStatus']) {
  if (status === 'one') return 'Yes'
  if (status === 'multiple') return 'Multiple'
  return 'No'
}

function statusBadge(row: BulkPreviewRow) {
  if (row.status === 'skip') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
        <MaterialIcon name="error" size={14} />
        Skip
      </span>
    )
  }
  if (row.status === 'pdf_warning') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
        <MaterialIcon name="warning" size={14} />
        Draft (PDF issue)
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
      <MaterialIcon name="check_circle" size={14} />
      Ready
    </span>
  )
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base)
  if (!slug) slug = `product-${Date.now()}`
  let candidate = slug
  let n = 2
  for (;;) {
    const { data } = await supabase.from('products').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
    candidate = `${slug}-${n}`
    n++
  }
}

export function AdminBulkUpload() {
  const [categories, setCategories] = useState<Category[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [folderFiles, setFolderFiles] = useState<File[]>([])
  const [folderLabel, setFolderLabel] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [previewRows, setPreviewRows] = useState<BulkPreviewRow[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; title: string } | null>(null)
  const [results, setResults] = useState<BulkUploadResult[] | null>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories((data as Category[]) ?? [])
    })
  }, [])

  const folderIndex = useMemo(() => indexFolderFiles(folderFiles), [folderFiles])

  const subfolderNames = useMemo(() => [...folderIndex.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [folderIndex])

  const handlePreview = async () => {
    setParseError(null)
    setPreviewRows(null)
    setResults(null)

    if (!csvFile) {
      setParseError('Select a CSV file first.')
      return
    }
    if (folderFiles.length === 0) {
      setParseError('Select the parent folder containing numbered sub-folders.')
      return
    }

    const text = await csvFile.text()
    const { rows, error } = parseCsv(text)
    if (error) {
      setParseError(error)
      return
    }
    if (rows.length === 0) {
      setParseError('CSV has headers but no data rows.')
      return
    }

    setPreviewRows(buildPreviewRows(rows, folderIndex, categories))
  }

  const handleFolderChange = (files: FileList | null) => {
    if (!files?.length) return
    const list = [...files]
    setFolderFiles(list)
    const idx = indexFolderFiles(list)
    const first = list[0] as File & { webkitRelativePath?: string }
    const root = first.webkitRelativePath?.split('/')[0] ?? 'Selected folder'
    setFolderLabel(`${root} (${idx.size} sub-folders, ${list.length} files)`)
    setPreviewRows(null)
    setResults(null)
  }

  const uploadRow = async (row: BulkPreviewRow): Promise<BulkUploadResult> => {
    if (row.status === 'skip') {
      return { outcome: 'skipped', rowNumber: row.rowNumber, title: row.title || `(row ${row.rowNumber})`, reason: row.skipReason ?? 'Validation failed.' }
    }

    const resolvedCategoryId = resolveCategoryId(row.csv.category, categories)
    if (!resolvedCategoryId) {
      return { outcome: 'skipped', rowNumber: row.rowNumber, title: row.title, reason: `Unknown category "${row.csv.category.trim()}".` }
    }

    const slug = await uniqueSlug(row.title)
    const payload = rowToProductPayload(row, slug, resolvedCategoryId)

    const { data: inserted, error: insertError } = await supabase.from('products').insert(payload).select('id').single()
    if (insertError || !inserted) {
      return { outcome: 'skipped', rowNumber: row.rowNumber, title: row.title, reason: insertError?.message ?? 'Insert failed.' }
    }

    const productId = inserted.id
    const { pdfs, images } = getFolderFilesForRow(row, folderIndex)
    const imageUrls: string[] = []

    for (const file of images) {
      const validation = await validateImageFile(file)
      if (!validation.ok) continue
      const basePath = `${crypto.randomUUID()}-${sanitizeFilename(file.name)}`
      try {
        const result = await processAndUploadImage(file, async (path, blob) => {
          const { error } = await supabase.storage.from('product-images').upload(path, blob, {
            cacheControl: '31536000',
            contentType: blob.type,
          })
          if (error) throw error
          return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
        }, basePath)
        imageUrls.push(result.url)
      } catch (err) {
        console.error('Bulk image upload failed:', file.name, err)
      }
    }

    let draftReason: string | null = null

    if (pdfs.length === 1) {
      const pdf = pdfs[0]
      const pdfValidation = await validatePdfFile(pdf)
      if (!pdfValidation.ok) {
        draftReason = `PDF rejected: ${pdfValidation.reason}`
      } else {
        const { error: pdfError } = await supabase.storage.from('patterns').upload(`${productId}.pdf`, pdf, {
          upsert: true,
          contentType: 'application/pdf',
          metadata: { originalName: pdf.name },
        })
        if (pdfError) {
          draftReason = `PDF upload failed: ${pdfError.message}`
        } else {
          await supabase.from('products').update({ pdf_filename: pdf.name }).eq('id', productId)
        }
      }
    } else {
      draftReason = pdfs.length === 0 ? 'No PDF in folder.' : `${pdfs.length} PDFs in folder — none attached.`
    }

    if (imageUrls.length) {
      await supabase.from('products').update({ images: imageUrls }).eq('id', productId)
    }

    if (!draftReason) draftReason = 'Bulk upload saves as draft — publish manually in Listings.'

    return { outcome: 'created', rowNumber: row.rowNumber, title: row.title, productId, draftReason }
  }

  const handleConfirmUpload = async () => {
    if (!previewRows?.length) return
    setUploading(true)
    setResults(null)
    const out: BulkUploadResult[] = []
    const total = previewRows.length

    for (let i = 0; i < previewRows.length; i++) {
      const row = previewRows[i]
      setUploadProgress({ current: i + 1, total, title: row.title || `Row ${row.rowNumber}` })
      const result = await uploadRow(row)
      out.push(result)
    }

    setUploadProgress(null)
    setResults(out)
    setUploading(false)
  }

  const created = results?.filter((r) => r.outcome === 'created') ?? []
  const skipped = results?.filter((r) => r.outcome === 'skipped') ?? []

  return (
    <div className="max-w-[1200px]">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] tracking-[0.14em] text-ink-soft uppercase mb-1">Products</p>
          <h1 className="font-subheading text-2xl md:text-3xl">Bulk Upload</h1>
          <p className="text-[13px] text-ink-soft mt-2 max-w-xl">
            Import products from a CSV plus a parent folder of numbered sub-folders. Preview matches before uploading.
            All imports save as drafts ({'`active = false`'}).
          </p>
        </div>
        <Link
          href="/admin/listings"
          className="text-[12px] tracking-[0.1em] border border-[#d9d5ce] px-4 py-2 rounded-full hover:bg-white transition-colors"
        >
          ← Back to Listings
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <section className="bg-white border border-[#e8e4dd] rounded-xl p-5">
          <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2">
            <MaterialIcon name="table_chart" size={18} />
            CSV file
          </h2>
          <p className="text-[12px] text-ink-soft mb-3">
            Required columns: {BULK_CSV_HEADERS.join(', ')}. Category matches slug or name. Tags are ignored (no DB column).
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => csvInputRef.current?.click()}
              className="text-[12px] px-4 py-2 rounded-full border border-[#d9d5ce] bg-[#faf9f7] hover:bg-white"
            >
              Choose CSV
            </button>
            <span className="text-[12px] text-ink-soft truncate max-w-[240px]">{csvFile?.name ?? 'No file selected'}</span>
          </div>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              setCsvFile(f ?? null)
              setPreviewRows(null)
              setResults(null)
              setParseError(null)
              e.target.value = ''
            }}
          />
        </section>

        <section className="bg-white border border-[#e8e4dd] rounded-xl p-5">
          <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2">
            <MaterialIcon name="folder_open" size={18} />
            Asset folder
          </h2>
          <p className="text-[12px] text-ink-soft mb-3">
            Select the parent folder (e.g. &quot;NCA uploads&quot;). Each CSV <code className="text-[11px] bg-[#f3f1ec] px-1 rounded">folder_name</code> must match a direct sub-folder name.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="text-[12px] px-4 py-2 rounded-full border border-[#d9d5ce] bg-[#faf9f7] hover:bg-white"
            >
              Choose folder
            </button>
            <span className="text-[12px] text-ink-soft truncate max-w-[280px]">
              {folderFiles.length ? folderLabel || `${folderFiles.length} files` : 'No folder selected'}
            </span>
          </div>
          <input
            ref={folderInputRef}
            type="file"
            className="hidden"
            {...({ webkitdirectory: '', directory: '' } as InputHTMLAttributes<HTMLInputElement>)}
            multiple
            onChange={(e) => handleFolderChange(e.target.files)}
          />
          {subfolderNames.length > 0 && (
            <p className="text-[11px] text-ink-soft mt-3">
              Sub-folders found: {subfolderNames.slice(0, 12).join(', ')}
              {subfolderNames.length > 12 ? ` … +${subfolderNames.length - 12} more` : ''}
            </p>
          )}
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={handlePreview}
          disabled={uploading}
          className="text-[12px] tracking-[0.08em] px-5 py-2.5 rounded-full bg-[#1f249c] text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={handleConfirmUpload}
          disabled={!previewRows?.length || uploading}
          className="text-[12px] tracking-[0.08em] px-5 py-2.5 rounded-full border border-ink text-ink font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm Upload
        </button>
        {uploadProgress && (
          <span className="text-[12px] text-ink-soft">
            Uploading {uploadProgress.current}/{uploadProgress.total}: {uploadProgress.title}
          </span>
        )}
      </div>

      {parseError && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-[13px] text-red-800">{parseError}</div>
      )}

      {previewRows && (
        <div className="bg-white border border-[#e8e4dd] rounded-xl overflow-hidden mb-8">
          <div className="px-5 py-3 border-b border-[#eee] flex items-center justify-between">
            <h2 className="text-[13px] font-semibold">Preview ({previewRows.length} rows)</h2>
            <p className="text-[11px] text-ink-soft">
              {previewRows.filter((r) => r.status !== 'skip').length} will upload ·{' '}
              {previewRows.filter((r) => r.status === 'skip').length} will skip
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-[#faf9f7] text-ink-soft border-b border-[#eee]">
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Folder</th>
                  <th className="px-4 py-2 font-medium">PDF</th>
                  <th className="px-4 py-2 font-medium">Images</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={`border-b border-[#f0ede8] ${row.status === 'skip' ? 'bg-red-50/40' : row.status === 'pdf_warning' ? 'bg-amber-50/30' : ''}`}
                  >
                    <td className="px-4 py-3 tabular-nums">{row.rowNumber}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate" title={row.title}>{row.title || '—'}</td>
                    <td className="px-4 py-3">{row.matchedFolder ?? <span className="text-red-600">Not found</span>}</td>
                    <td className="px-4 py-3">{pdfLabel(row.pdfStatus)}</td>
                    <td className="px-4 py-3">{row.imageCount}</td>
                    <td className="px-4 py-3">{statusBadge(row)}</td>
                    <td className="px-4 py-3 text-ink-soft max-w-[260px]">
                      {row.skipReason && <span className="text-red-700">{row.skipReason}</span>}
                      {!row.skipReason && row.warnings.length > 0 && (
                        <ul className="list-disc pl-4 space-y-0.5">
                          {row.warnings.map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="bg-white border border-[#e8e4dd] rounded-xl p-5">
            <h2 className="text-[13px] font-semibold mb-3 text-emerald-800">
              Created ({created.length})
            </h2>
            {created.length === 0 ? (
              <p className="text-[12px] text-ink-soft">No products were created.</p>
            ) : (
              <ul className="space-y-2 text-[12px]">
                {created.map((r) => (
                  <li key={r.rowNumber} className="border-b border-[#f0ede8] pb-2">
                    <span className="font-medium">Row {r.rowNumber}:</span> {r.title}
                    {r.outcome === 'created' && (
                      <>
                        {' '}
                        <Link href={`/admin/listings`} className="text-[#1f249c] underline">
                          (draft)
                        </Link>
                        {r.draftReason && <p className="text-ink-soft mt-0.5">{r.draftReason}</p>}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-[#e8e4dd] rounded-xl p-5">
            <h2 className="text-[13px] font-semibold mb-3 text-red-800">
              Skipped rows ({skipped.length})
            </h2>
            {skipped.length === 0 ? (
              <p className="text-[12px] text-ink-soft">Nothing skipped.</p>
            ) : (
              <ul className="space-y-2 text-[12px]">
                {skipped.map((r) => (
                  <li key={r.rowNumber} className="border-b border-[#f0ede8] pb-2">
                    <span className="font-medium">Row {r.rowNumber}:</span> {r.title}
                    <p className="text-red-700 mt-0.5">{r.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
