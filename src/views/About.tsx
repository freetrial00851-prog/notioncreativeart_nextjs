import Link from 'next/link'

const POINTS = [
  {
    title: 'Clear written patterns',
    text: 'Every pattern is a PDF with a materials list, the skill level and step-by-step written instructions, so you know what you need before you start.',
  },
  {
    title: 'Instant PDF download',
    text: 'You get the file right after payment, and a download link is also sent to your email. Nothing is shipped, and there is nothing to wait for.',
  },
  {
    title: 'Free patterns too',
    text: 'There are free patterns you can download with no account, a good way to try the style before you buy.',
  },
] as const

const LINK_CLASS = 'text-primary underline underline-offset-4'

export function About() {
  return (
    <div className="mx-auto max-w-site page-gutter py-14 md:py-20">
      <div className="max-w-3xl">
        <p className="mb-3 text-[12px] font-extrabold uppercase tracking-[0.06em] text-primary">Studio</p>
        <h1 className="type-h1 text-ink">About Notion Creative Art</h1>
        <p className="mt-6 max-w-[62ch] text-[17px] leading-relaxed text-muted md:text-[18px]">
          Notion Creative Art is a small, one-person studio run by Muhammad Sufyan in Pakistan. We design crochet patterns
          (amigurumi, wearables and home pieces) written to be clear enough to follow with a hook in hand.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="inline-flex min-h-12 items-center rounded-lg bg-primary px-6 text-[15px] font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Browse patterns
          </Link>
          <Link
            href="/free-crochet-patterns"
            className="inline-flex min-h-12 items-center rounded-lg border-2 border-ink px-6 text-[15px] font-bold text-ink transition-colors hover:bg-ink hover:text-white"
          >
            Free patterns
          </Link>
        </div>
      </div>

      <section aria-labelledby="about-what-you-get" className="mt-14 md:mt-20">
        <h2 id="about-what-you-get" className="type-h2 mb-6 text-ink">What you get</h2>
        <ul className="grid gap-4 md:grid-cols-3 md:gap-6">
          {POINTS.map((p) => (
            <li key={p.title} className="rounded-xl border border-border bg-surface-warm p-6">
              <h3 className="font-heading text-[21px] font-semibold leading-snug text-ink">{p.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="about-photos" className="mt-14 grid gap-8 md:mt-20 md:grid-cols-[1fr_1fr] md:gap-12">
        <div>
          <h2 id="about-photos" className="type-h2 text-ink">A note about the photos</h2>
        </div>
        <div className="space-y-4 text-[16px] leading-relaxed text-muted">
          <p>
            Listing photos are AI-generated illustrations of the finished design, so your finished piece may vary slightly
            depending on the yarn, hook and tension you use.
          </p>
          <p>
            Each listing states the materials and the skill level. If you are new to crochet, start with the{' '}
            <Link href="/crochet-patterns-for-beginners" className={LINK_CLASS}>beginner patterns</Link> and our{' '}
            <Link href="/guides" className={LINK_CLASS}>crochet guides</Link>.
          </p>
        </div>
      </section>

      <section aria-labelledby="about-help" className="mt-14 rounded-xl border border-border bg-surface-warm p-8 md:mt-20 md:p-12">
        <h2 id="about-help" className="type-h2 text-ink">Questions about a pattern?</h2>
        <p className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-muted">
          Write to{' '}
          <a href="mailto:patterns@notioncreativeart.com" className="font-semibold text-ink underline underline-offset-4">
            patterns@notioncreativeart.com
          </a>
          . We reply in 1 to 2 days. If something is not right with an order, see the{' '}
          <Link href="/refund-policy" className="font-semibold text-ink underline underline-offset-4">refund policy</Link>{' '}
          or the <Link href="/faq" className="font-semibold text-ink underline underline-offset-4">FAQ</Link>.
        </p>
      </section>
    </div>
  )
}
