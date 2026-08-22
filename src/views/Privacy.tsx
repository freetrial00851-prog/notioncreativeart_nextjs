import { ContentPage } from '../components/ContentPage'

export function Privacy() {
  return (
    <ContentPage eyebrow="LEGAL" title="Privacy Policy">
      <p>This page explains what information Notion Creative Art collects and how it's used.</p>
      <p><span className="text-ink font-medium">What we collect.</span> When you create an account: your name and email address (via Google sign-in or email signup). When you make a purchase: your order and payment details, handled entirely by Lemon Squeezy — Notion Creative Art never sees or stores your card details.</p>
      <p><span className="text-ink font-medium">How it's used.</span> To create your account, process your orders, give you access to your downloads, and — only if you subscribe — send occasional emails about new patterns.</p>
      <p><span className="text-ink font-medium">Third parties.</span> Account authentication is handled by Google and Supabase. Payments and digital delivery are handled by Lemon Squeezy. Each of these providers has its own privacy policy governing how they handle your data.</p>
      <p><span className="text-ink font-medium">Your data.</span> You can request a copy of your data or ask for your account to be deleted at any time by reaching out via the Contact page.</p>
      <p><span className="text-ink font-medium">Cookies.</span> The site uses essential cookies only, to keep you signed in.</p>
    </ContentPage>
  )
}
