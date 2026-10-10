import Link from 'next/link'
import { MaterialIcon } from '@/components/MaterialIcon'
import { PRIMARY_PILL } from '@/components/account/AccountUI'

const LIVE_PARAGRAPHS = [
  'Notion Creative Art is a small, one-person studio writing and testing crochet patterns — amigurumi, wearables and home pieces — designed to be clear enough to follow at 11pm with a hook in hand.',
  "Every pattern is written, stitched, and tested twice before it's listed. Sizing, stitch counts and photos are checked against a real finished piece, not just a diagram.",
  'Patterns are delivered instantly as a PDF — no waiting, no shipping.',
] as const

const PROCESS = [
  { n: '1', title: 'Design', copy: '[How a pattern idea becomes a design.]' },
  { n: '2', title: 'Test', copy: '[How every pattern is worked through before it is sold.]' },
  { n: '3', title: 'Write', copy: '[How instructions and photos are prepared.]' },
] as const

const VALUES = [
  { icon: 'eco', title: 'Made with care', copy: '[A value in your words.]' },
  { icon: 'chat', title: 'Support that answers', copy: '[A value in your words.]' },
  { icon: 'auto_awesome', title: 'Fair and clear', copy: '[A value in your words, for example clear prices and refunds.]' },
] as const

const STATS = [
  { n: '[N]', label: 'Patterns designed' },
  { n: '[N]', label: 'Makers helped' },
  { n: '[N]', label: 'Five-star reviews' },
] as const

export function About({ hideOwnerCopyPlaceholders = false }: { hideOwnerCopyPlaceholders?: boolean }) {
  return (
    <div>
      <section className="max-w-site mx-auto px-5 md:px-10 lg:px-8 pt-10 md:pt-14 pb-14 md:pb-20">
        <div className={`grid grid-cols-1 gap-10 items-center ${hideOwnerCopyPlaceholders ? '' : 'lg:grid-cols-[1fr_1fr] lg:gap-16'}`}>
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary mb-4">Our story</p>
            <h1 className="font-heading text-[36px] md:text-[48px] leading-[1.1] font-bold text-ink mb-5">
              {hideOwnerCopyPlaceholders ? 'Our story' : '[Headline: why Notion Creative Art exists]'}
            </h1>
            <div className="space-y-4 text-[16px] md:text-[17px] leading-relaxed text-muted max-w-xl">
              {hideOwnerCopyPlaceholders ? (
                LIVE_PARAGRAPHS.map((p) => <p key={p}>{p}</p>)
              ) : (
                <p>[Two or three sentences in your own voice about who makes these patterns and what makes them different.]</p>
              )}
            </div>
            <Link href="/shop" className={`${PRIMARY_PILL} mt-8 min-h-12 px-8`}>
              Shop all patterns
            </Link>
          </div>

          {!hideOwnerCopyPlaceholders && (
            <div
              className="relative aspect-[4/3] lg:aspect-square rounded-[28px] overflow-hidden"
              style={{ background: 'var(--color-tint-cream)' }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[14px] text-muted px-6 text-center">
                Designer or studio photo
              </span>
            </div>
          )}
        </div>
      </section>

      {!hideOwnerCopyPlaceholders && (
        <>
          <section className="bg-surface-warm">
            <div className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-14 md:py-16">
              <h2 className="font-heading text-[28px] md:text-[36px] font-bold text-ink mb-8">How every pattern is made</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PROCESS.map((step) => (
                  <article key={step.n} className="rounded-[24px] bg-white p-6 md:p-7">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-[14px] font-bold text-primary">
                      {step.n}
                    </span>
                    <h3 className="mt-5 font-heading text-[22px] font-bold text-ink">{step.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {VALUES.map((v) => (
                <div key={v.title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft">
                    <MaterialIcon name={v.icon} size={20} color="var(--color-free)" />
                  </span>
                  <div>
                    <h3 className="text-[16px] font-bold text-ink">{v.title}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted">{v.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-primary text-primary-contrast">
            <div className="max-w-site mx-auto px-5 md:px-10 lg:px-8 py-14 md:py-16 text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="font-heading text-[40px] md:text-[48px] font-bold leading-none">{s.n}</p>
                    <p className="mt-2 text-[15px] text-white/80">{s.label}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/shop?price=free"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-[15px] font-semibold text-primary hover:bg-white/90"
              >
                Try a free pattern
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
