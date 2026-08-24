import { Suspense } from 'react'
import { buildMetadata } from '@/lib/seo'
import { Account } from '@/views/Account'
import { ContentSkeleton } from '@/components/Skeleton'

export const metadata = buildMetadata({
  title: 'Account Settings',
  description: 'Update your Notion Creative Art account profile and billing details.',
  path: '/account/profile',
  noIndex: true,
})

export default function AccountProfilePage() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <Account />
    </Suspense>
  )
}
