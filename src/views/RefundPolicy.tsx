import { ContentPage } from '../components/ContentPage'
import { paymentPartner, type PaymentProviderName } from '../lib/paymentPartner'

export function RefundPolicy({ provider = 'lemonsqueezy' }: { provider?: PaymentProviderName }) {
  const partner = paymentPartner(provider)
  return (
    <ContentPage eyebrow="SUPPORT" title="Refund policy">
      <p>Last updated: October 2026. All patterns sold on Notion Creative Art are digital products, delivered as an instant PDF download.</p>
      <p><span className="font-medium text-ink">14-day refund.</span> You can request a full refund within 14 days of your purchase. Email <a href="mailto:patterns@notioncreativeart.com">patterns@notioncreativeart.com</a> with your order number (it is in your confirmation email) and we will arrange it.</p>
      <p><span className="font-medium text-ink">How refunds are paid.</span> Payments and refunds are handled by our payment partner and merchant of record, {partner.entity}, on our behalf. Approved refunds are returned to the original payment method. <a href={partner.termsUrl} target="_blank" rel="noopener noreferrer">{partner.termsLabel}</a> also apply to your purchase and may give you additional rights, and your statutory consumer rights are not affected by this policy.</p>
      <p>If something has gone wrong with your order — a failed payment, a corrupted file, the wrong pattern — contact us through the <a href="/contact">Contact page</a> and we will make it right.</p>
    </ContentPage>
  )
}
