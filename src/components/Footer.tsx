'use client'

import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { Logo } from './Logo'

const SHOP_MOBILE = [
  { label: 'All patterns', to: '/shop' },
  { label: 'Amigurumi', to: '/shop/amigurumi' },
  { label: 'Wearables', to: '/shop/wearables' },
  { label: 'Home decor', to: '/shop/home-decor' },
  { label: 'Free patterns', to: '/shop?price=free' },
]

const SHOP_DESKTOP = [
  ...SHOP_MOBILE,
  { label: 'Bundles', to: '/shop/bundles' },
  { label: 'New arrivals', to: '/shop/new' },
  { label: 'Sale', to: '/shop/sale' },
]

const HELP = [
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
  { label: 'Refund policy', to: '/refund-policy' },
]

/**
 * Site footer — dark `footer` token, breakpoint columns per DESIGN_SPEC §1 / §3.3.
 * Mobile: brand + SHOP (no Sale) + HELP. Tablet/laptop: + ACCOUNT (+ Sale in SHOP).
 */
export function Footer() {
  const { user, signOut } = useAuth()
  const { openAuthModal } = useUI()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-footer text-white">
      <div className="max-w-site mx-auto page-gutter section-y">
        <div className="grid grid-cols-2 md:grid-cols-[1.3fr_1fr_1fr_1fr] lg:grid-cols-[1.6fr_1fr_1fr_1fr] gap-x-5 lg:gap-x-6 gap-y-10">
          <div className="col-span-2 md:col-span-1 max-w-sm">
            <Logo variant="footer" className="mb-3" />
            <p className="text-[13px] leading-relaxed text-white/70 mb-4">
              Instant digital crochet patterns for makers of every level. Create something wonderful.
            </p>
            <div className="flex flex-wrap gap-2">
              {/* Social hrefs: TODO wire from site_settings.social when present */}
              <SocialPill label="Instagram" />
              <SocialPill label="Pinterest" />
            </div>
          </div>

          <FooterCol title="SHOP">
            {/* Mobile: no Sale */}
            <ul className="md:hidden">
              {SHOP_MOBILE.map((l) => (
                <li key={l.to}>
                  <Link href={l.to} className="inline-flex max-md:min-h-11 items-center text-[13px] text-white/70 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="hidden md:block space-y-2.5">
              {SHOP_DESKTOP.map((l) => (
                <li key={l.to}>
                  <Link href={l.to} className="inline-flex max-md:min-h-11 items-center text-[13px] text-white/70 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterCol>

          <FooterCol title="HELP">
            <ul className="md:space-y-2.5">
              {HELP.map((l) => (
                <li key={l.to}>
                  <Link href={l.to} className="inline-flex max-md:min-h-11 items-center text-[13px] text-white/70 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterCol>

          <FooterCol title="ACCOUNT" className="hidden md:block">
            <ul className="md:space-y-2.5">
              {user ? (
                <>
                  <li>
                    <Link href="/account/downloads" className="inline-flex max-md:min-h-11 items-center text-[13px] text-white/70 hover:text-white">
                      My downloads
                    </Link>
                  </li>
                  <li>
                    <Link href="/account/wishlist" className="inline-flex max-md:min-h-11 items-center text-[13px] text-white/70 hover:text-white">
                      Wishlist
                    </Link>
                  </li>
                  <li>
                    <button type="button" onClick={() => signOut()} className="inline-flex max-md:min-h-11 items-center text-[13px] text-white/70 hover:text-white">
                      Sign out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button type="button" onClick={() => openAuthModal()} className="inline-flex max-md:min-h-11 items-center text-[13px] text-white/70 hover:text-white">
                      Sign in
                    </button>
                  </li>
                  <li>
                    <Link href="/account/downloads" className="inline-flex max-md:min-h-11 items-center text-[13px] text-white/70 hover:text-white">
                      My downloads
                    </Link>
                  </li>
                  <li>
                    <Link href="/account/wishlist" className="inline-flex max-md:min-h-11 items-center text-[13px] text-white/70 hover:text-white">
                      Wishlist
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </FooterCol>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-site mx-auto page-gutter py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[12px] text-white/55">
          <p>© {year} Notion Creative Art. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/privacy" className="inline-flex max-md:min-h-11 items-center hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="inline-flex max-md:min-h-11 items-center hover:text-white">
              Terms
            </Link>
            <span className="flex items-center gap-1.5 flex-wrap">
              <span>We accept</span>
              {['Visa', 'Mastercard', 'Amex', 'PayPal'].map((p) => (
                <span key={p} className="rounded border border-white/20 px-1.5 py-0.5 text-[10px]">
                  {p}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-normal text-white/80 mb-3">{title}</p>
      {children}
    </div>
  )
}

function SocialPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/25 px-3 py-1.5 text-[12px] text-white/80">
      {label}
    </span>
  )
}
