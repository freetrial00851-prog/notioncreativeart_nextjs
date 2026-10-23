import { ContentPage } from '../components/ContentPage'
import { paymentPartner, type PaymentProviderName } from '../lib/paymentPartner'

export function RefundPolicy({ provider = 'lemonsqueezy' }: { provider?: PaymentProviderName }) {
  const partner = paymentPartner(provider)
  return (
    <ContentPage eyebrow="SUPPORT" title="Refund policy">
      <p>All patterns sold on Notion Creative Art are digital products, delivered as an instant PDF download.</p>
      <p>Because the file is available to you immediately after purchase, refunds cannot be offered once a pattern has been downloaded.</p>
      <p>If you haven't yet downloaded your pattern and would like a refund, or if something's gone wrong with your order — a failed payment, a corrupted file, the wrong pattern — reach out via the <a href="/contact">Contact page</a> within 14 days of purchase and we'll make it right.</p>
      <p>Payments and refunds are handled by our payment partner and merchant of record, {partner.entity}, on our behalf. Approved refunds are returned to the original payment method. <a href={partner.termsUrl} target="_blank" rel="noopener noreferrer">{partner.termsLabel}</a> also apply to your purchase and may give you additional rights, and your statutory consumer rights are not affected by this policy.</p>
      <p>This policy exists to keep patterns fairly priced for everyone; thank you for understanding.</p>
    </ContentPage>
  )
}
