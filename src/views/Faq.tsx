import Link from 'next/link'
import { ContentPage } from '../components/ContentPage'
import { FaqAccordion } from '../components/FaqAccordion'

const FAQS: { q: string; a: React.ReactNode }[] = [
  { q: 'How does delivery work?', a: "Every pattern is delivered as an instant PDF download. As soon as your payment is confirmed you can download it from the confirmation page, and we also email you a private download link. If you have an account, the file is saved under My Orders too — no waiting, no shipping." },
  { q: 'What format are the patterns in?', a: 'PDF, formatted to print or read on a phone or tablet while you work. Each listing notes the page count.' },
  { q: 'Do I need to create an account to buy a pattern?', a: 'No. You can pay as a guest with just your email and card: your download link appears right after payment and is emailed to you. Creating a free account is optional and keeps all your purchases in one place.' },
  { q: 'Can I get a refund?', a: 'Yes. You can request a full refund within 14 days of purchase: email patterns@notioncreativeart.com with your order number. Refunds are processed by Paddle, our merchant of record, and go back to your original payment method.' },
  { q: "What if I can't find a pattern I downloaded?", a: <>Use the private download link in your confirmation email, or <Link href="/resend-download" className="text-primary underline underline-offset-4">request a new one</Link>. If you have an account, sign in and go to My Orders.</> },
  { q: "I'm stuck on a stitch — can I ask for help?", a: <>Of course. Use the <Link href="/contact" className="text-primary underline underline-offset-4">Contact page</Link> and we&apos;ll help however we can.</> },
]

export function Faq() {
  return (
    <ContentPage eyebrow="Support" title="Frequently asked questions">
      <FaqAccordion items={FAQS.map((f) => ({ question: f.q, answer: f.a }))} />
    </ContentPage>
  )
}
