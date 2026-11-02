import Link from 'next/link'
import { Logo } from './Logo'
import { CookieSettingsButton } from './CookieSettingsButton'

const EXPLORE = [
  { label: 'All patterns', to: '/shop' },
  { label: 'New arrivals', to: '/shop?sort=newest' },
  { label: 'Bundles', to: '/shop/bundles' },
  { label: 'Free patterns', to: '/free-crochet-patterns' },
  { label: 'Beginner patterns', to: '/crochet-patterns-for-beginners' },
  { label: 'Crochet guides', to: '/guides' },
]

const HELP = [
  { label: 'FAQs', to: '/faq' },
  { label: 'About us', to: '/about' },
  { label: 'Contact us', to: '/contact' },
  { label: 'Refund policy', to: '/refund-policy' },
]

const ACCOUNT = [
  { label: 'My account', to: '/account/downloads' },
  { label: 'My purchases', to: '/account/orders' },
  { label: 'Wishlist', to: '/account/wishlist' },
  { label: 'Cart', to: '/cart' },
  { label: 'Lost your download?', to: '/resend-download' },
]

const LINK =
  'inline-flex min-h-11 items-center text-[13px] text-white/75 transition-colors hover:text-white md:min-h-9'

/** Dark footer: brand + about, three link columns, small legal row. */
export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-footer text-white">
      <div className="max-w-site mx-auto page-gutter pb-6 pt-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 pb-10 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-9">
          <div className="col-span-2 md:col-span-1">
            <Logo variant="footer" />
            <p className="mt-[18px] max-w-[260px] text-[13px] leading-[1.8] text-white/75">
              Thoughtful digital patterns for curious makers. Find a project, make it your own, and enjoy every stitch along
              the way.
            </p>
            <p className="mt-3 max-w-[260px] text-[13px] leading-[1.7] text-white/75">
              Questions? <a href="mailto:patterns@notioncreativeart.com" className="font-semibold text-white underline underline-offset-4 hover:text-white/80">patterns@notioncreativeart.com</a>
              <br />
              We reply in 1 to 2 days.
            </p>
          </div>
          <FooterCol title="Explore" links={EXPLORE} />
          <FooterCol title="Here to help" links={HELP} />
          <FooterCol title="Your account" links={ACCOUNT} />
        </div>

        <div className="flex flex-col gap-3 border-t border-white/15 pt-5 text-[12px] text-white/70 md:flex-row md:items-center md:justify-between">
          <span>© {year} Notion Creative Art. All rights reserved.</span>
          <span className="hidden md:inline">Made for makers, with care.</span>
          <span className="flex items-center gap-1">
            <Link href="/privacy" className="inline-flex min-h-11 items-center px-1 hover:text-white md:min-h-0">
              Privacy
            </Link>
            ·
            <Link href="/terms" className="inline-flex min-h-11 items-center px-1 hover:text-white md:min-h-0">
              Terms
            </Link>
            ·
            <Link href="/refund-policy" className="inline-flex min-h-11 items-center px-1 hover:text-white md:min-h-0">
              Refund policy
            </Link>
            ·
            <CookieSettingsButton />
          </span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <p className="mb-2 mt-1 text-[12px] font-bold uppercase tracking-[0.06em] text-white">{title}</p>
      <ul>
        {links.map((l) => (
          <li key={l.to}>
            <Link href={l.to} className={LINK}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
