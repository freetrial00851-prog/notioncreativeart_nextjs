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

const LINK = 'text-primary underline underline-offset-4'

const PATTERN_FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Do your patterns use US or UK crochet terms?',
    a: <>The Details tab on each listing states the terms used. If you usually crochet in UK terms, our chart of <Link href="/guides/crochet-abbreviations-us-vs-uk" className={LINK}>US and UK crochet abbreviations</Link> shows how the stitch names differ, so you do not work the wrong stitch.</>,
  },
  {
    q: 'What yarn and hook do I need?',
    a: <>Every listing has a materials list with the yarn and hook size it was written for. For help choosing, see our guides on <Link href="/guides/best-yarn-for-amigurumi" className={LINK}>yarn for amigurumi</Link>, the <Link href="/guides/crochet-hook-sizes-chart" className={LINK}>hook sizes chart</Link> and the <Link href="/guides/yarn-weight-chart" className={LINK}>yarn weight chart</Link>.</>,
  },
  {
    q: 'Are the patterns suitable for beginners?',
    a: <>Each pattern shows its skill level. New to crochet? Start with the <Link href="/crochet-patterns-for-beginners" className={LINK}>beginner patterns</Link> and read how <Link href="/guides/crochet-skill-levels-explained" className={LINK}>skill levels are explained</Link>.</>,
  },
  {
    q: 'What does amigurumi mean?',
    a: <>Amigurumi is the Japanese art of crocheting or knitting small stuffed toys. Most of our patterns are amigurumi animals and characters. Our guide <Link href="/guides/what-is-amigurumi" className={LINK}>What is amigurumi?</Link> explains the basics.</>,
  },
  {
    q: 'How big will the finished toy be?',
    a: <>Listings give the finished size where the pattern states one. The size depends on your yarn and hook, and you can make a toy bigger or smaller by changing them: see <Link href="/guides/how-to-make-amigurumi-bigger-or-smaller" className={LINK}>how to make amigurumi bigger or smaller</Link>.</>,
  },
  {
    q: 'Can I print the PDF or read it on my phone?',
    a: 'Yes. The pattern is a PDF, so you can print it or follow it on a phone or tablet while you crochet.',
  },
  {
    q: 'Are the listing photos of real crocheted toys?',
    a: 'The photos are AI-generated illustrations of the finished design, so your finished piece may vary slightly with your yarn, hook and tension.',
  },
  {
    q: 'Do I have to use safety eyes?',
    a: <>No. Safety eyes are a hard part, so for babies and children under three, embroidered eyes are the safer choice, and toy safety rules differ between countries. Read the <Link href="/guides/safety-eyes-for-amigurumi" className={LINK}>safety eyes guide</Link> and how to <Link href="/guides/how-to-embroider-faces-on-amigurumi" className={LINK}>embroider faces</Link>.</>,
  },
  {
    q: 'Do you have free crochet patterns and no-sew patterns?',
    a: <>Yes. Browse the <Link href="/free-crochet-patterns" className={LINK}>free crochet patterns</Link>, which download without an account, and the <Link href="/shop/no-sew-amigurumi" className={LINK}>no-sew amigurumi patterns</Link>, which are worked in one piece or with very little sewing.</>,
  },
]

export function Faq() {
  return (
    <ContentPage eyebrow="Support" title="Frequently asked questions">
      <h2 className="font-heading text-[24px] font-semibold leading-tight text-ink md:text-[28px]">Orders and downloads</h2>
      <FaqAccordion items={FAQS.map((f) => ({ question: f.q, answer: f.a }))} />
      <h2 className="pt-6 font-heading text-[24px] font-semibold leading-tight text-ink md:text-[28px]">About the patterns</h2>
      <FaqAccordion items={PATTERN_FAQS.map((f) => ({ question: f.q, answer: f.a }))} />
    </ContentPage>
  )
}
