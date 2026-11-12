import Image from 'next/image'
import Link from 'next/link'
import { GUIDE_GROUPS } from '@/lib/guideMeta'

/** A short, fixed list on purpose: importing the guide registry here would put every article into the home page bundle. */
const FEATURED = [
  {
    href: '/guides/how-to-single-crochet',
    label: 'Stitches',
    title: 'How to single crochet',
    text: 'The one stitch most amigurumi is built from, step by step.',
    src: '/guides/how-to-single-crochet/sc-02.webp',
    alt: 'A foundation chain of crochet stitches with the hook in the last loop',
  },
  {
    href: '/guides/how-to-make-a-magic-ring-crochet',
    label: 'Amigurumi',
    title: 'How to make a magic ring',
    text: 'Start every toy with a closed, tidy center.',
    src: '/guides/how-to-make-a-magic-ring-crochet/mr-01.webp',
    alt: 'Yarn wrapped around two fingers, crossing in an X, to start a magic ring',
  },
  {
    href: '/guides/how-to-slip-stitch-and-slip-knot',
    label: 'Start here',
    title: 'Slip knot and slip stitch',
    text: 'Where every crochet project begins.',
    src: '/guides/how-to-slip-stitch-and-slip-knot/sk-02.webp',
    alt: 'A finished slip knot snug on the crochet hook',
  },
] as const

/** Learn-to-crochet strip for the home page: real step photos from the guides, linking to the articles. */
export function HomeGuides() {
  const total = GUIDE_GROUPS.reduce((n, g) => n + g.slugs.length, 0)
  return (
    <section id="guides" aria-labelledby="home-guides-heading" className="scroll-mt-20 py-11 md:py-20">
      <div className="mx-auto max-w-site page-gutter">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:mb-10 md:flex-row md:items-end">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-coral">Learn to crochet</p>
            <h2 id="home-guides-heading" className="mt-3 font-heading text-[clamp(30px,3.6vw,46px)] font-semibold leading-[1.12] tracking-[-0.01em] text-ink">
              New to amigurumi? Start with the guides
            </h2>
            <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted md:text-[16px]">
              Plain steps with photos, from the first slip knot to a finished toy.
            </p>
          </div>
          <Link href="/guides" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[15px] font-bold text-coral hover:underline">
            All {total} guides <span aria-hidden>→</span>
          </Link>
        </div>
        <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
          {FEATURED.map((g) => (
            <li key={g.href} className="w-[78%] shrink-0 snap-start md:w-auto">
              <Link
                href={g.href}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white transition-[border-color,box-shadow] hover:border-ink/40 hover:shadow-card-hover"
              >
                <Image
                  src={g.src}
                  alt={g.alt}
                  width={1200}
                  height={900}
                  sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, 100vw"
                  className="h-auto w-full"
                />
                <span className="flex flex-1 flex-col px-5 pb-6 pt-5">
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-coral">{g.label}</span>
                  <span className="mt-2 font-heading text-[21px] font-semibold leading-snug text-ink group-hover:underline group-hover:underline-offset-4">
                    {g.title}
                  </span>
                  <span className="mt-1.5 text-[15px] leading-relaxed text-muted">{g.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
