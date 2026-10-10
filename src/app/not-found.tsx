import type { Metadata } from 'next'
import { CustomerShell } from '@/components/CustomerShell'
import { getNotFoundChips } from '@/lib/data/notFoundChips'
import { NotFound } from '@/views/NotFound'

export const metadata: Metadata = {
  title: 'Page not found',
}

export default async function NotFoundPage() {
  const chips = await getNotFoundChips().catch(() => [])
  return (
    <CustomerShell>
      <NotFound chips={chips} />
    </CustomerShell>
  )
}
