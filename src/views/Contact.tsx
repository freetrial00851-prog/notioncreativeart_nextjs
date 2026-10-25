import { ContentPage } from '../components/ContentPage'
import Link from 'next/link'
import { CopyEmailButton } from '../components/CopyEmailButton'

export function Contact() {
  return (
    <ContentPage eyebrow="SUPPORT" title="Contact">
      <p>Questions about a pattern, an order, or something else — we read every message and are happy to help.</p>
      <p>
        Email:{' '}
        <a href="mailto:patterns@notioncreativeart.com" className="text-ink underline underline-offset-4">
          patterns@notioncreativeart.com
        </a>
        <CopyEmailButton email="patterns@notioncreativeart.com" />
      </p>
      <p>We typically reply within 1–2 days. Please include your order number if your question is about a purchase.</p>
      <p className="text-[14px]">
        NotionCreativeArt is the trading name of Muhammad Sufyan, a sole proprietor based in Pakistan. Payments are processed by our merchant of record (see our <Link href="/terms">Terms</Link> and <Link href="/refund-policy">Refund policy</Link>).
      </p>
    </ContentPage>
  )
}
