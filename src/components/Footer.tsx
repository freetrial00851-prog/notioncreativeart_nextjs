'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { getCategoriesWithProducts } from '../lib/categories'
import type { SocialContent, CategoryContent } from '../lib/types'
import { MaterialIcon } from './MaterialIcon'

const FOOTER_BG = '#FCFBF8'
const FOOTER_GREEN = '#1f249c'
const FOOTER_TEXT = '#202720'
const FOOTER_MUTED = '#667066'
/** Digital-products band subtitle only — darker than FOOTER_MUTED for #EFEBDD contrast */
const FOOTER_BAND_SUBTITLE = '#4F5850'
const FOOTER_BORDER = '#E3E6E0'

const SHOP_LINKS = [
  { label: 'All Patterns', to: '/shop' },
  { label: 'New Arrivals', to: '/shop/new' },
  { label: 'Featured Items', to: '/shop/bestsellers' },
  { label: 'Bundles', to: '/shop?bundle=1' },
  { label: 'Sale', to: '/shop/sale' },
  { label: 'Free Patterns', to: '/shop?price=free' },
]

const HELP_LINKS = [
  { label: 'FAQ', to: '/faq' },
  { label: 'How It Works', to: '/about' },
  { label: 'Download Help', to: '/faq#downloads' },
  { label: 'Contact Us', to: '/contact' },
]

function DownloadIcon() {
  return <MaterialIcon name="download" size={18} color={FOOTER_GREEN} />
}
// Material Symbols has no brand/social icons — Instagram/Pinterest/Facebook/YouTube stay custom SVGs.
function InstagramIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={FOOTER_TEXT} strokeWidth="1.4"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill={FOOTER_TEXT} stroke="none" /></svg>
}
function PinterestIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={FOOTER_TEXT} strokeWidth="1.4"><circle cx="12" cy="12" r="9" /><path d="M9 17c1-3 1.5-5 1.5-5s-.5-1-.5-2.2c0-2 1.2-3.3 2.6-3.3 1.2 0 1.8.9 1.8 2 0 1.2-.8 3-1.2 4.6-.3 1.3.7 2.4 2 2.4 2.3 0 3.9-3 3.9-6.6 0-2.7-1.9-4.8-5.3-4.8-3.9 0-6.2 2.9-6.2 5.9 0 1.2.4 2 1 2.6.1.1.1.2.1.4l-.3 1.1c0 .2-.2.2-.4.1-1.1-.5-1.7-1.9-1.7-3.5 0-2.9 2.4-6.4 7.2-6.4 3.9 0 6.5 2.8 6.5 5.8 0 4-2.1 7-5.3 7-1 0-2-.6-2.4-1.2l-.7 2.6c-.2 1-.9 2.2-1.3 3" /></svg>
}
function FacebookIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={FOOTER_TEXT} strokeWidth="1.4"><circle cx="12" cy="12" r="9" /><path d="M14 8.5h-1.5c-.6 0-1 .5-1 1.1V11h2.4l-.3 2.3h-2.1V19h-2.3v-5.7H8.2V11h1v-1.7c0-1.7 1-2.8 2.7-2.8H14v2z" /></svg>
}
function YoutubeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={FOOTER_TEXT} strokeWidth="1.4"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="M10 9.5l5 2.5-5 2.5v-5z" fill={FOOTER_TEXT} stroke="none" /></svg>
}
function ChevronIcon({ open }: { open: boolean }) {
  return <MaterialIcon name="expand_more" size={16} color={FOOTER_MUTED} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
}
function ShopSectionIcon() {
  return <MaterialIcon name="shopping_bag" size={18} color={FOOTER_TEXT} />
}
function GridIcon() {
  return <MaterialIcon name="grid_view" size={18} color={FOOTER_TEXT} />
}
function HelpIcon() {
  return <MaterialIcon name="help" size={18} color={FOOTER_TEXT} />
}
function AccountSectionIcon() {
  return <MaterialIcon name="person" size={18} color={FOOTER_TEXT} />
}

function BrandColumn() {
  return (
    <div className="max-w-xs">
      <Link href="/" className="flex items-center gap-2.5 mb-3" aria-label="Notion Creative Art — home">
        <span className="font-extrabold tracking-tight text-[36px] leading-none" style={{ color: FOOTER_GREEN, fontFamily: 'var(--font-logo)' }}>NCA</span>
        <span className="flex flex-col justify-center leading-[1.05] text-[10px] font-semibold tracking-[0.06em] uppercase" style={{ color: FOOTER_TEXT }}>
          <span>Notion</span>
          <span>Creative</span>
          <span>Art</span>
        </span>
      </Link>
      <p className="text-[13px] leading-relaxed mb-4" style={{ color: FOOTER_MUTED }}>
        Beautiful crochet patterns for makers of all skill levels. Instant digital downloads. Create something wonderful.
      </p>
      <SocialRow />
      <div className="flex items-center gap-3 mt-5 rounded-xl px-4 py-3" style={{ background: '#EFEBDD', border: `1px solid ${FOOTER_BORDER}` }}>
        <DownloadIcon />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold" style={{ color: FOOTER_TEXT }}>Digital Products</p>
          <p className="text-[12px]" style={{ color: FOOTER_BAND_SUBTITLE }}>Instant download after purchase</p>
        </div>
      </div>
    </div>
  )
}

function SocialRow() {
  const [social, setSocial] = useState<SocialContent | null>(null)
  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'social').maybeSingle().then(({ data }) => {
      if (data?.value) setSocial(data.value as SocialContent)
    })
  }, [])
  const links: { key: string; href?: string; icon: React.ReactNode; label: string }[] = [
    { key: 'instagram', href: social?.instagram, icon: <InstagramIcon />, label: 'Instagram' },
    { key: 'pinterest', href: social?.pinterest, icon: <PinterestIcon />, label: 'Pinterest' },
    { key: 'facebook', href: social?.facebook, icon: <FacebookIcon />, label: 'Facebook' },
    { key: 'youtube', href: social?.youtube, icon: <YoutubeIcon />, label: 'YouTube' },
  ].filter((l) => l.href)
  if (links.length === 0) return null
  return (
    <div className="flex gap-2.5">
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          aria-label={l.label}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ border: `1px solid ${FOOTER_BORDER}` }}
        >
          {l.icon}
        </a>
      ))}
    </div>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-bold tracking-wide mb-4" style={{ color: FOOTER_TEXT }}>{title}</p>
      <ul className="space-y-2.5 text-[13px]" style={{ color: FOOTER_MUTED }}>{children}</ul>
    </div>
  )
}

function BottomBar() {
  const year = new Date().getFullYear()
  return (
    <div
      className="max-w-site w-full mx-auto px-6 md:px-16 xl:px-24 2xl:px-32 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px]"
      style={{ borderTop: `1px solid ${FOOTER_BORDER}`, color: FOOTER_MUTED }}
    >
      <p>© {year} NotionCreativeArt. All rights reserved.</p>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
        <Link href="/terms" className="hover:underline">Terms of Use</Link>
        <Link href="/refund-policy" className="hover:underline">Refund Policy</Link>
        <Link href="/contact" className="hover:underline">Contact Us</Link>
      </div>
      <div className="flex items-center gap-3">
        <span>We accept</span>
        <div className="flex items-center gap-1.5">
          {['Visa', 'Mastercard', 'Amex', 'PayPal'].map((p) => (
            <span key={p} className="text-[10px] font-semibold rounded px-1.5 py-0.5" style={{ border: `1px solid ${FOOTER_BORDER}`, color: FOOTER_MUTED }}>{p}</span>
          ))}
        </div>
      </div>
      <p>Designed with ❤️ for makers</p>
    </div>
  )
}

export function Footer() {
  const { user, signOut } = useAuth()
  const { openAuthModal } = useUI()
  const [categories, setCategories] = useState<CategoryContent[]>([])
  const [openSection, setOpenSection] = useState<string | null>(null)

  useEffect(() => {
    getCategoriesWithProducts(supabase).then(setCategories)
  }, [])

  const AccountLinks = (
    <>
      <li><Link href="/account/orders" className="hover:underline">My Account</Link></li>
      <li><Link href="/account/orders" className="hover:underline">My Purchases</Link></li>
      <li><Link href="/account/wishlist" className="hover:underline">Wishlist</Link></li>
      <li><Link href="/cart" className="hover:underline">Cart</Link></li>
      {user ? (
        <li><button type="button" onClick={() => signOut()} className="hover:underline text-left">Logout</button></li>
      ) : (
        <li><button type="button" onClick={() => openAuthModal()} className="hover:underline text-left">Sign In</button></li>
      )}
    </>
  )

  return (
    <footer style={{ background: FOOTER_BG }}>
      {/* Desktop: brand + Shop + Categories + Help + Account */}
      <div className="hidden md:grid max-w-site w-full mx-auto px-6 md:px-16 xl:px-24 2xl:px-32 py-14 gap-8" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr' }}>
        <BrandColumn />
        <FooterColumn title="SHOP">
          {SHOP_LINKS.map((l) => <li key={l.to}><Link href={l.to} className="hover:underline">{l.label}</Link></li>)}
        </FooterColumn>
        <FooterColumn title="CATEGORIES">
          {categories.slice(0, 6).map((c) => <li key={c.link}><Link href={c.link} className="hover:underline">{c.name}</Link></li>)}
          <li><Link href="/shop" className="hover:underline font-semibold" style={{ color: FOOTER_TEXT }}>All Categories</Link></li>
        </FooterColumn>
        <FooterColumn title="HELP & SUPPORT">
          {HELP_LINKS.map((l) => <li key={l.to}><Link href={l.to} className="hover:underline">{l.label}</Link></li>)}
        </FooterColumn>
        <FooterColumn title="ACCOUNT">{AccountLinks}</FooterColumn>
      </div>

      {/* Mobile accordion */}
      <div className="md:hidden px-5 py-8">
        <BrandColumn />
        <div className="mt-6" style={{ borderTop: `1px solid ${FOOTER_BORDER}` }}>
          {[
            { key: 'shop', label: 'Shop', icon: <ShopSectionIcon />, body: SHOP_LINKS.map((l) => <li key={l.to}><Link href={l.to} className="hover:underline">{l.label}</Link></li>) },
            { key: 'categories', label: 'Categories', icon: <GridIcon />, body: [...categories.slice(0, 6).map((c) => <li key={c.link}><Link href={c.link} className="hover:underline">{c.name}</Link></li>), <li key="all"><Link href="/shop" className="hover:underline font-semibold" style={{ color: FOOTER_TEXT }}>All Categories</Link></li>] },
            { key: 'help', label: 'Help & Support', icon: <HelpIcon />, body: HELP_LINKS.map((l) => <li key={l.to}><Link href={l.to} className="hover:underline">{l.label}</Link></li>) },
            { key: 'account', label: 'Account', icon: <AccountSectionIcon />, body: AccountLinks },
          ].map((section) => (
            <div key={section.key} style={{ borderBottom: `1px solid ${FOOTER_BORDER}` }}>
              <button
                onClick={() => setOpenSection((s) => (s === section.key ? null : section.key))}
                className="w-full flex items-center justify-between py-4"
              >
                <span className="flex items-center gap-2.5 text-[14px] font-semibold" style={{ color: FOOTER_TEXT }}>
                  {section.icon} {section.label}
                </span>
                <ChevronIcon open={openSection === section.key} />
              </button>
              {openSection === section.key && (
                <div className="pb-4">
                  <ul className="space-y-2.5 text-[13px] pl-1" style={{ color: FOOTER_MUTED }}>{section.body}</ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <BottomBar />
    </footer>
  )
}
