'use client'

import { useRef, useState } from 'react'
import { deriveVariantUrl } from '../lib/imageVariants'

type Props = {
  label: string
  sizeHint?: string
  urls: string[]
  accept: string
  acceptLabel: string
  multiple?: boolean
  uploading: boolean
  onAdd: (files: File[]) => void
  onRemove: (url: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function DropzoneUpload({ label, sizeHint, urls, accept, acceptLabel, multiple = true, uploading, onAdd, onRemove, onReorder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const acceptedTypes = accept.split(',').map((t) => t.trim())

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const files = Array.from(fileList)
    const valid = files.filter((f) => acceptedTypes.includes(f.type))
    const rejected = files.length - valid.length
    if (rejected > 0) alert(`${rejected} file(s) skipped — only ${acceptLabel} is allowed.`)
    if (valid.length) onAdd(valid)
  }

  return (
    <div>
      <span className="block text-[10px] tracking-[0.1em] text-ink-soft mb-1.5">{label}</span>
      {sizeHint && <p className="text-[11px] text-ink-soft/80 mb-2">Recommended size: {sizeHint} — any size works, this just avoids awkward cropping.</p>}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`cursor-pointer border-2 border-dashed rounded-xl px-6 py-8 text-center transition-colors ${dragOver ? 'border-ink bg-surface' : 'border-line hover:border-ink-soft'}`}
      >
        <p className="text-[12px] mb-1">
          <span className="underline underline-offset-2">Choose {multiple ? 'files' : 'a file'}</span> or drop {multiple ? 'them' : 'it'} here
        </p>
        <p className="text-[11px] text-ink-soft">{acceptLabel} only</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
          className="hidden"
        />
      </div>

      {uploading && <p className="text-[11px] text-ink-soft mt-2">Uploading…</p>}

      {urls.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {urls.map((url, i) => (
            <div
              key={url}
              draggable
              onDragStart={() => setDraggedIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (draggedIndex !== null && draggedIndex !== i) onReorder(draggedIndex, i)
                setDraggedIndex(null)
              }}
              className="relative cursor-move group"
              title={i === 0 ? 'Primary image' : 'Drag to reorder'}
            >
              <img src={deriveVariantUrl(url, 'thumb')} className={`w-full aspect-square object-cover rounded-lg border ${i === 0 ? 'border-ink' : 'border-line'}`} />
              {i === 0 && <span className="absolute bottom-1 left-1 bg-ink text-canvas text-[9px] tracking-wide px-1.5 py-0.5 rounded">PRIMARY</span>}
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(url) }}
                aria-label="Remove image"
                className="absolute top-1 right-1 w-5 h-5 bg-canvas border border-line rounded-full text-[11px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-madder hover:text-canvas hover:border-madder transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
