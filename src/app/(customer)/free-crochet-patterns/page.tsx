import type { Metadata } from 'next'
import { FreePatternsPage, freeMetadata } from '@/components/listing/FreePatternsPage'

/** Prerendered and cached (rebuilt every minute). Filter and ?page= variants go through /q/free-crochet-patterns (see src/middleware.ts). */
export const dynamic = 'force-static'
export const revalidate = 60

export function generateMetadata(): Metadata {
  return freeMetadata({})
}

export default function FreeCrochetPatternsPage() {
  return <FreePatternsPage sp={{}} />
}
