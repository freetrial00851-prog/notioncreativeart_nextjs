import { buildMetadata } from '@/lib/seo'
import { ResetPassword } from '@/views/ResetPassword'

export const metadata = buildMetadata({
  title: 'Reset Password',
  description: 'Reset your Notion Creative Art account password.',
  path: '/reset-password',
  noIndex: true,
})

export default function ResetPasswordPage() {
  return <ResetPassword />
}
