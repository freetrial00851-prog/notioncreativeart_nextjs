import { Suspense } from 'react'
import { buildMetadata } from '@/lib/seo'
import { AuthPage } from '@/views/AuthPage'

export const metadata = buildMetadata({
  title: 'Create Account',
  description: 'Create a Notion Creative Art account to save wishlists and access your crochet pattern downloads.',
  path: '/signup',
  noIndex: true,
})

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <AuthPage />
    </Suspense>
  )
}
