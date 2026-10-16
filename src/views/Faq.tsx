import { ContentPage } from '../components/ContentPage'
import { FaqAccordion } from '../components/FaqAccordion'

const FAQS = [
  { q: 'How does delivery work?', a: "Every pattern is delivered as an instant PDF download. As soon as your payment is confirmed, it's available in your account under My Orders — no waiting, no shipping." },
  { q: 'What format are the patterns in?', a: 'PDF, formatted to print or read on a phone or tablet while you work. Each listing notes the page count.' },
  { q: 'Do I need to create an account to buy a pattern?', a: 'Yes — an account (Google or email) links your purchase to your downloads, so you can always come back and re-download a pattern if you lose the file.' },
  { q: 'Can I get a refund?', a: "Because patterns are downloaded instantly, refunds aren't available once a file has been downloaded. If something's gone wrong with your order, reach out and I'll sort it out." },
  { q: "What if I can't find a pattern I downloaded?", a: "Sign in and go to My Orders — every pattern you've bought is listed there with a fresh download link, any time." },
  { q: "I'm stuck on a stitch — can I ask for help?", a: "Of course — use the Contact page and I'll help however I can." },
]

export function Faq() {
  return (
    <ContentPage eyebrow="Support" title="Frequently asked questions">
      <FaqAccordion items={FAQS.map((f) => ({ question: f.q, answer: f.a }))} />
    </ContentPage>
  )
}
