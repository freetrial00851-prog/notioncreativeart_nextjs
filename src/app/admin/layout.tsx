import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Defense-in-depth for /admin: middleware already redirects non-admins,
 * but this server layout refuses to render children unless profiles.is_admin
 * is true — so the Admin client bundle is never hydrated for unauthorized users.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/admin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_admin) {
    redirect('/')
  }

  return children
}
