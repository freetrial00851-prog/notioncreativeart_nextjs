import { GuideBody } from '@/components/guides/GuideBody'
import { CollapsibleContent } from '@/components/CollapsibleContent'
import { getCategoryContent } from '@/lib/categoryContent'

/**
 * Long-form category text under the pattern grid. Server component: all of it is in the first HTML.
 * Visitors see the first heading and paragraph; the rest opens with "Read more".
 */
export function CategoryContent({ slug }: { slug: string }) {
  const content = getCategoryContent(slug)
  if (!content) return null
  const firstParagraph = content.body.findIndex((b) => b.type === 'p')
  const cut = firstParagraph === -1 ? content.body.length : firstParagraph + 1
  const intro = content.body.slice(0, cut)
  const rest = content.body.slice(cut)
  return (
    <section aria-label="About this category" className="border-t border-border bg-surface-warm">
      <div className="mx-auto max-w-[820px] page-gutter py-10 md:py-14">
        <GuideBody blocks={intro} />
        {(rest.length > 0 || (content.faq && content.faq.length > 0)) && (
          <CollapsibleContent>
            <div className="mt-5">
              <GuideBody blocks={rest} />
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
          </CollapsibleContent>
        )}
      </div>
    </section>
  )
}
