import { buildMetadata } from '@/lib/seo'
import { GuestDownload } from '@/views/GuestDownload'

/** Private download page for a guest order. Never indexed; the token in the URL is the buyer's secret. */
export const metadata = buildMetadata({
  title: 'Your download',
  description: 'Download your crochet patterns.',
  path: '/d',
  noIndex: true,
})

export default async function GuestDownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <GuestDownload token={token} />
}
