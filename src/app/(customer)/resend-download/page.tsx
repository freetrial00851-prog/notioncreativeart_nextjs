import { buildMetadata } from '@/lib/seo'
import { ResendDownload } from '@/views/ResendDownload'

export const metadata = buildMetadata({
  title: 'Send my download again',
  description: 'Lost your download link? Enter your email and we will send it again.',
  path: '/resend-download',
  noIndex: true,
})

export default function ResendDownloadPage() {
  return <ResendDownload />
}
