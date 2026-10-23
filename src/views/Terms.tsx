import { ContentPage } from '../components/ContentPage'
import { paymentPartner, type PaymentProviderName } from '../lib/paymentPartner'

const H = 'text-ink font-medium'

export function Terms({ provider = 'lemonsqueezy' }: { provider?: PaymentProviderName }) {
  const partner = paymentPartner(provider)
  return (
    <ContentPage eyebrow="LEGAL" title="Terms of Service">
      <p>Last updated: October 2026. By purchasing or downloading a pattern from Notion Creative Art, you agree to the following terms.</p>
      <p><span className={H}>Who we are.</span> NotionCreativeArt (notioncreativeart.com) is the trading name of Muhammad Sufyan, a sole proprietor based in Pakistan, who designs and sells digital crochet patterns. You can reach us any time at <a href="mailto:patterns@notioncreativeart.com">patterns@notioncreativeart.com</a> or through the <a href="/contact">Contact page</a>.</p>
      <p><span className={H}>Digital products.</span> Every item sold is a digital PDF pattern, delivered instantly after payment. No physical item is shipped.</p>
      <p><span className={H}>Payments, taxes and invoices.</span> Our order process is run by our payment partner and merchant of record, {partner.entity} (&ldquo;{partner.name}&rdquo;). {partner.name} takes your payment, collects and pays any sales tax or VAT, issues your receipt, and handles refunds on our behalf. Your purchase is also subject to <a href={partner.termsUrl} target="_blank" rel="noopener noreferrer">{partner.termsLabel}</a>. Prices are shown in US dollars; your bank may convert them to your local currency.</p>
      <p><span className={H}>Personal use license.</span> Patterns are for personal use. You may make and sell finished items made from a pattern, but you may not resell, redistribute, or share the pattern file (or any derivative of it) itself.</p>
      <p><span className={H}>Your download.</span> After payment you can download your pattern from your account, or, if you paid without an account, through the private link shown after payment and emailed to you. Guest links work for 30 days and allow a limited number of downloads; you can request a new link at any time. Please keep the link to yourself: it is how we know a download is yours.</p>
      <p><span className={H}>Photos.</span> Listing photos are AI-generated illustrations of the finished pattern, so your finished piece may vary slightly. The pattern itself is the PDF you receive.</p>
      <p><span className={H}>Copyright.</span> All patterns, photographs, and written instructions remain the intellectual property of Notion Creative Art and may not be reproduced, republished, or claimed as your own.</p>
      <p><span className={H}>Refunds.</span> You can request a full refund within 14 days of purchase. See the <a href="/refund-policy">Refund Policy</a> page for full details. Your statutory consumer rights are not affected.</p>
      <p><span className={H}>Accounts.</span> You're responsible for keeping your account credentials secure. Notion Creative Art isn't liable for losses resulting from an unauthorised party accessing your account through no fault of ours.</p>
      <p><span className={H}>Changes.</span> These terms may be updated from time to time; continued use of the site after a change means you accept the updated terms.</p>
    </ContentPage>
  )
}
