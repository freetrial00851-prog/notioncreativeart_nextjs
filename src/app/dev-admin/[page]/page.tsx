import { notFound } from 'next/navigation'
import { DevAdminPreview } from './Preview'

export default async function Page({ params }: { params: Promise<{ page: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  const { page } = await params
  return <DevAdminPreview page={page} />
}
