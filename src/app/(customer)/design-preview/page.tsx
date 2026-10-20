import type { Metadata } from 'next'
import Link from 'next/link'
import { PatternCard } from '@/components/PatternCard'
import { PatternGrid } from '@/components/PatternGrid'
import { DesignPreviewGuard } from '@/components/DesignPreviewGuard'
import { DESIGN_PREVIEW_PRODUCTS } from '@/lib/designPreviewData'

/** Hidden design preview: not linked anywhere, not indexed, mock data only. */
export const metadata: Metadata = {
  title: 'Design preview',
  robots: { index: false, follow: false, nocache: true },
}

export default function DesignPreviewGrid() {
  return (
    <div className="bg-bg min-h-[50vh]">
      <DesignPreviewGuard />
      <div className="mx-auto w-full max-w-site page-gutter py-8 md:py-10">
        <p className="mb-2 rounded-lg bg-butter px-3 py-2 text-[13px] text-ink">
          Design preview — mock cards with vertical photos. These are not real listings.{' '}
          <Link className="underline" href="/design-preview/preview-beachside-cardigan">Open a full listing page →</Link>
        </p>
        <h1 className="type-h1 mb-6 text-ink">Preview: vertical cards</h1>
        <PatternGrid variant="shop">
          {DESIGN_PREVIEW_PRODUCTS.map((p, i) => (
            <PatternCard key={p.id} product={p} priority={i < 4} />
          ))}
        </PatternGrid>
      </div>
    </div>
  )
}
