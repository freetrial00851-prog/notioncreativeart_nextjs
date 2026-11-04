import { ContentPage } from '../components/ContentPage'
import Link from 'next/link'
import { CopyEmailButton } from '../components/CopyEmailButton'
import { ContactForm } from '../components/ContactForm'

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
      <p>
        Many questions are already answered: see the <Link href="/faq">FAQ</Link> for orders, downloads and the patterns, the{' '}
        <Link href="/guides">crochet guides</Link> for stitches and terms, and the <Link href="/refund-policy">refund policy</Link>{' '}
        if something is not right with an order.
      </p>
      <h2 className="pt-2 font-heading text-[24px] leading-tight text-ink">Send us a message</h2>
      <ContactForm />
      <p>We typically reply within 1–2 days. Please include your order number if your question is about a purchase.</p>
      <p className="text-[14px]">
        Notion Creative Art is the trading name of Muhammad Sufyan, a sole proprietor based in Pakistan. Payments are processed by our merchant of record (see our <Link href="/terms">Terms</Link> and <Link href="/refund-policy">Refund policy</Link>).
      </p>
    </ContentPage>
  )
}
