import { Suspense } from 'react'
import { buildMetadata } from '@/lib/seo'
import { Admin } from '@/views/Admin'

export const metadata = buildMetadata({
  title: 'Shop Manager',
  description: 'Notion Creative Art shop manager.',
  path: '/admin',
  noIndex: true,
})

/** Admin catch-all — handles /admin, /admin/listings, /admin/orders, etc. */
export default function AdminCatchAllPage() {
  return (
    <Suspense fallback={null}>
      <Admin />
    </Suspense>
  )
}
