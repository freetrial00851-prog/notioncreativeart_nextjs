'use client'

import { useState } from 'react'
import type { Category } from '../lib/types'
import {
  PRODUCT_EXPORT_FIELDS,
  DEFAULT_PRODUCT_EXPORT_FILTERS,
  DEFAULT_PRODUCT_EXPORT_FIELDS,
  type ProductExportFieldKey,
  type ProductExportFilters,
  type ProductExportStatusFilter,
  fetchProductsForExport,
  buildProductExportCsv,
  downloadProductExportCsv,
} from '../lib/productExport'

type Props = {
  categories: Category[]
  onClose: () => void
}

export function ProductExportModal({ categories, onClose }: Props) {
  const [filters, setFilters] = useState<ProductExportFilters>({ ...DEFAULT_PRODUCT_EXPORT_FILTERS })
  const [fields, setFields] = useState({ ...DEFAULT_PRODUCT_EXPORT_FIELDS })
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedFieldKeys = PRODUCT_EXPORT_FIELDS.filter((f) => fields[f.key]).map((f) => f.key)

  const toggleField = (key: ProductExportFieldKey) => {
    setFields((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const setAllFields = (checked: boolean) => {
    setFields(
      Object.fromEntries(PRODUCT_EXPORT_FIELDS.map((f) => [f.key, checked])) as typeof fields,
    )
  }

  const handleDownload = async () => {
    if (selectedFieldKeys.length === 0) {
      setError('Select at least one column to export.')
      return
    }
    setError(null)
    setExporting(true)
    try {
      const products = await fetchProductsForExport(filters)
      const csv = buildProductExportCsv(products, selectedFieldKeys, categories)
      downloadProductExportCsv(csv)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && !exporting && onClose()}
    >
      <div
        className="w-full max-w-lg bg-canvas border border-line rounded-2xl shadow-xl overflow-hidden"
        role="dialog"
        aria-labelledby="product-export-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 id="product-export-title" className="font-display font-semibold text-lg text-ink">
            Export products
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="text-ink-soft hover:text-ink text-lg leading-none disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 max-h-[min(70vh,520px)] overflow-y-auto">
          <div>
            <p className="text-[11px] tracking-[0.15em] text-ink-soft mb-3">FILTERS</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[12px] text-ink-soft">
                  Created from
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="mt-1 w-full border border-line px-3 py-2 text-[13px] bg-white rounded-lg focus:outline-none focus:border-ink"
                  />
                </label>
                <label className="block text-[12px] text-ink-soft">
                  Created to
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="mt-1 w-full border border-line px-3 py-2 text-[13px] bg-white rounded-lg focus:outline-none focus:border-ink"
                  />
                </label>
              </div>

              <label className="block text-[12px] text-ink-soft">
                Category
                <select
                  value={filters.categoryId}
                  onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                  className="mt-1 w-full border border-line px-3 py-2 text-[13px] bg-white rounded-lg focus:outline-none focus:border-ink"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-[12px] text-ink-soft">
                Skill level
                <select
                  value={filters.skillLevel}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      skillLevel: e.target.value as ProductExportFilters['skillLevel'],
                    })
                  }
                  className="mt-1 w-full border border-line px-3 py-2 text-[13px] bg-white rounded-lg focus:outline-none focus:border-ink"
                >
                  <option value="">All levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>

              <label className="block text-[12px] text-ink-soft">
                Status
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value as ProductExportStatusFilter })
                  }
                  className="mt-1 w-full border border-line px-3 py-2 text-[13px] bg-white rounded-lg focus:outline-none focus:border-ink"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="sold_out">Sold out</option>
                </select>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] tracking-[0.15em] text-ink-soft">COLUMNS</p>
              <div className="flex gap-3 text-[11px]">
                <button type="button" onClick={() => setAllFields(true)} className="text-[#1f249c] hover:underline">
                  Select all
                </button>
                <button type="button" onClick={() => setAllFields(false)} className="text-ink-soft hover:text-ink hover:underline">
                  Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
              {PRODUCT_EXPORT_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fields[f.key]}
                    onChange={() => toggleField(f.key)}
                    className="accent-ink"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-[13px] text-madder">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-line bg-surface/40">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2 text-[13px] border border-line rounded-full bg-white hover:bg-surface disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={exporting || selectedFieldKeys.length === 0}
            className="px-4 py-2 text-[13px] rounded-full text-white disabled:opacity-50"
            style={{ background: '#222' }}
          >
            {exporting ? 'Preparing…' : 'Download CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}
