import { ContentPage } from '../components/ContentPage'

const H = 'text-ink font-medium'

export function Privacy() {
  return (
    <ContentPage eyebrow="LEGAL" title="Privacy Policy">
      <p>Last updated: October 2026. This page explains what information Notion Creative Art collects, why, who handles it, and the choices you have. For any privacy question, use our <a href="/contact">Contact page</a>.</p>

      <p><span className={H}>What we collect.</span></p>
      <ul className="list-disc space-y-2 pl-5">
        <li><span className={H}>Account:</span> your name and email address (through Google sign-in or email signup), and the wishlist, cart and downloads linked to your account.</li>
        <li><span className={H}>Orders:</span> your order details and email. Card and payment details are handled entirely by Lemon Squeezy; Notion Creative Art never sees or stores them.</li>
        <li><span className={H}>Newsletter:</span> your email address, only if you subscribe.</li>
        <li><span className={H}>Support chat and contact messages:</span> what you type and the email you give us, so we can answer you. Chat messages are processed by an AI service to draft replies, so please do not put sensitive information in them.</li>
        <li><span className={H}>Usage data:</span> pages viewed, searches, and actions such as adding to cart or downloading. Before you choose on the cookie banner this is limited to anonymous events (event name, page and pattern). If you accept, we also record a random session ID, how you arrived (for example a campaign link or referring site) and your device type.</li>
      </ul>

      <p><span className={H}>Cookies and similar storage.</span> We use essential storage to keep you signed in, run your cart and remember your cookie choice. If you click <em>Accept</em> on the cookie banner, we also load Google Analytics and the Pinterest tag, which set their own cookies and tell us how the site is used and where visitors come from (including Pinterest). If you click <em>Reject</em>, these two are not loaded. You can clear your choice at any time by clearing this site&apos;s data in your browser, and the banner will ask again.</p>

      <p><span className={H}>How it&apos;s used.</span> To create your account, process orders, give you access to your downloads, answer messages, keep the site secure, understand and improve the site, and, if you subscribe, send occasional emails about new patterns. We may also email you about items you left in your cart or an order you placed. We do not sell your personal information. The only advertising-related tool is the Pinterest tag described above, which runs only if you accept cookies.</p>

      <p><span className={H}>Who handles your data.</span> We use these service providers, each under its own privacy policy:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Supabase (database, sign-in and file storage) and Vercel (website hosting).</li>
        <li>Google (sign-in; Google Analytics only if you accept cookies).</li>
        <li>Lemon Squeezy (checkout, payments, taxes and digital delivery; it acts as the seller of record for purchases).</li>
        <li>Pinterest (advertising tag, only if you accept cookies).</li>
        <li>Resend (sending emails) and an AI model provider (support chat replies).</li>
      </ul>
      <p>Some of these providers are based outside your country, including in the United States, so your data may be processed there.</p>

      <p><span className={H}>How long we keep it.</span> Account and order records are kept while your account is active and as long as needed for legal, tax and accounting reasons. Newsletter details are kept until you unsubscribe. Anonymous usage events are kept for a limited period and then deleted.</p>

      <p><span className={H}>Your rights.</span> You can ask us for a copy of your data, to correct it, or to delete your account, and you can ask us to stop emailing you, at any time via the <a href="/contact">Contact page</a>. We aim to reply within 30 days. Depending on where you live (for example the EU, UK or California) you may also have the right to object to or restrict certain processing and to complain to your local data protection authority. California residents: we do not sell or share personal information as those terms are defined in California law.</p>

      <p><span className={H}>Children.</span> This site is not directed at children under 13 (or under 16 where local law sets that age), and we do not knowingly collect their personal information. If you believe a child has given us information, contact us and we will delete it.</p>

      <p><span className={H}>Changes.</span> If we change this policy we will update the date at the top of this page.</p>
    </ContentPage>
  )
}
