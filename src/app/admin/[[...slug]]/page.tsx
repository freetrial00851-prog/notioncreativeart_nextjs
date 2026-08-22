import { buildMetadata } from '@/lib/seo'
import { Admin } from '@/views/Admin'

export const metadata = buildMetadata({
  title: 'Admin',
  description: 'Notion Creative Art admin panel.',
  path: '/admin',
  noIndex: true,
})

/** Admin catch-all — handles /admin, /admin/categories, /admin/orders, etc. */
export default function AdminCatchAllPage() {
  return <Admin />
}
