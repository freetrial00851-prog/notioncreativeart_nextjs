import { GuideBody } from '@/components/guides/GuideBody'
import { getCategoryContent } from '@/lib/categoryContent'

/** Long-form category text under the pattern grid. Server component: all of it is in the first HTML. */
export function CategoryContent({ slug }: { slug: string }) {
  const content = getCategoryContent(slug)
  if (!content) return null
  return (
    <section aria-label="About this category" className="border-t border-border bg-surface-warm">
      <div className="mx-auto max-w-[820px] page-gutter py-12 md:py-16">
        <GuideBody blocks={content.body} />
        {content.faq && content.faq.length > 0 && (
          <div className="mt-10">
            <h2 className="pt-4 font-heading text-[26px] leading-tight text-ink md:text-[30px]">Frequently asked questions</h2>
            <dl className="mt-4 space-y-5 text-[15px] leading-relaxed md:text-[16px]">
              {content.faq.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold text-ink">{f.q}</dt>
                  <dd className="mt-1 text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  )
}
