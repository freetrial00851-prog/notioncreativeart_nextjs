import { Suspense } from 'react'
import { buildMetadata } from '@/lib/seo'
import { AuthPage } from '@/views/AuthPage'

export const metadata = buildMetadata({
  title: 'Sign In',
  description: 'Sign in to your Notion Creative Art account to access your crochet pattern downloads.',
  path: '/login',
  noIndex: true,
})

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthPage />
    </Suspense>
  )
}
