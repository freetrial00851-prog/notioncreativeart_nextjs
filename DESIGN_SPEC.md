# Notion Creative Art — Design Implementation Spec

This file is the single source of truth for implementing the redesign. Read it fully before writing any code. Where this file and a screenshot disagree, the screenshot wins for visuals and this file wins for behavior.

---

## 0. Ground rules (read first)

- **Stack:** Next.js (App Router) in the existing `nca-nextjs` project. Follow the existing folder structure, data fetching and auth that are already in the repo. Do NOT create a new project or replace working backend logic.
- **Styling:** Tailwind CSS with the design tokens in section 2 added to `tailwind.config` (or CSS variables in `globals.css`). Do not hardcode hex values inside components; use tokens.
- **Hosting/services already in use:** Vercel (hosting), Supabase Storage (product images), Google Analytics 4. Keep the GA4 snippet and Search Console setup untouched.
- **Checkout:** Payment happens on Lemon Squeezy's hosted checkout. We do NOT design a payment page. Buyer returns to the Order success page after paying.
- **Placeholders:** Anything in `[SQUARE BRACKETS]` in the designs (e.g. `[PATTERN NAME]`, `[PRICE]`, `[4.8] ([N])`, `[SUPPORT EMAIL]`, `[Story headline]`) is a **data slot or copy to be filled**, never literal text. Wire to real data (section 5) or leave a clearly marked TODO for copy I will supply. Never ship the brackets.
- **Images:** The grey boxes labelled "Pattern photo", "Hero photo", "Designer photo", etc. are image placeholders. Use `next/image` with Supabase URLs for pattern photos; for other slots use a neutral placeholder until real images exist.
- **Work in this order** (section 7). Finish and show each step before starting the next. Do not build all pages at once.
- **Do not invent** features, copy, prices, ratings or review counts. If data is missing, show nothing or an empty state, not fake numbers.

---

## 1. Breakpoints

There are THREE separate designs. Each is exported as PNGs in `design-reference/` at its true pixel size (see section 10 for the file map).

| Name | Applies to | Design reference width | Folder |
|---|---|---|---|
| Mobile | 0–767px | 390px | `design-reference/mobile-390/` |
| Tablet | 768–1023px | 834px | `design-reference/tablet-834/` |
| Laptop/Desktop | 1024px+ | 1440px | `design-reference/laptop-1440/` |

Use Tailwind defaults: `md` = 768, `lg` = 1024. Content is centered with a max width of about 1200px on laptop (the laptop design uses ~120px side margins at 1440), 40px side gutter on tablet, 20px on mobile.

**Differences between the three that are easy to miss (follow the design, not guesses):**
- **Announcement bar text:** mobile "Instant PDF download · 10% off when you join"; tablet "Instant PDF download on every pattern · Join the list, get 10% off"; laptop "Instant PDF download on every pattern · Join the list and get 10% off your next order".
- **Header:** mobile = hamburger (left), logo, search icon, cart icon with count; **no heart icon**. Tablet = logo (left), search, heart, cart with count, hamburger (right). Laptop = logo, text nav (Shop, Skill levels, Free patterns, Reviews), search field, heart, cart with count, **Sign in** button.
- **Footer:** mobile = brand block + 2 link columns only (SHOP: All patterns, New arrivals, Free patterns; HELP: FAQ, Contact, Refund policy). Tablet and laptop = SHOP (adds Sale), HELP, ACCOUNT (Sign in, My downloads, Wishlist).
- **Product page states:** laptop and mobile include all three states (paid, owned, free). The tablet export has only the paid state; build owned and free on tablet by adapting the mobile layout to 834px.
- **Shop filters:** laptop shows filters inline (pill rows + "More filters"); mobile uses a bottom sheet; tablet uses a small panel/modal (`tablet-834/03_filters-panel`).
- **Mobile-only sticky bars:** product pages (paid, owned, free) and the cart page have a sticky bottom bar (`05`, `07`, `09`, `12` in `mobile-390`). Tablet and laptop do not.
- **Empty and no-result states** exist for tablet and laptop (cart empty, downloads empty, shop no results). Mobile has no separate export for them: reuse the same copy and adapt the layout.

---

## 2. Design tokens

Values are read from the design images and are **approximate**. Before finalizing, sample real values with an eyedropper from the PNG/Figma export and update this table. Put the final values in `tailwind.config` only; nowhere else.

### Colors

| Token | Approx. value | Use |
|---|---|---|
| `primary` | `#1F229C` (deep indigo) | announcement bar, primary buttons, prices, links, active tabs |
| `primary-contrast` | `#FFFFFF` | text on primary |
| `accent` | `#D98B3A` (orange) | logo dot, star ratings use a similar amber `#E0A030` |
| `bg` | `#FCFBF8` (warm off-white) | page background |
| `surface` | `#FFFFFF` | cards, forms, drawers |
| `surface-warm` | `#F7F2EC` | alternate section bands ("Shop by skill level", "What makers say", info boxes) |
| `footer` | `#202722` (very dark green-black) | footer background |
| `text` | `#16181D` | headings and body |
| `text-muted` | `#5A6270` | secondary text, meta, placeholders |
| `border` | `#E4DED3` | card and input borders |
| `sale` | `#B3302F` | SALE badge, delete account |
| `free` | `#2F5A1F` | FREE badge and "Free" price text |
| `success-bg` | `#EEF2E8` | "Added to your cart", "You own this pattern", order confirmed circle |

### Skill-level badge colors (important, used everywhere)

| Level | Badge bg | Badge text |
|---|---|---|
| Beginner | `#C7E5A8` (soft green) | dark green `#2F5A1F` |
| Intermediate | `#FCE08C` (soft yellow) | dark amber `#7A5200` |
| Advanced | `#F6B9A6` (soft peach) | dark red-brown `#8A2F1B` |

### Pattern card image background tints (placeholder tint behind photo)

Cycle through: sage `#EEF1E8`, lavender `#E8E8F6`, cream-yellow `#FDF1CF`, peach `#FAE3DA`. On the home skill-level cards: Beginner = sage, Intermediate = cream-yellow, Advanced = peach.

### Typography

- **Headings (H1–H3, big numbers, page titles):** `Playfair Display`, weight 700. H1 on home: ~44–56px desktop, ~32–36px mobile, tight line height (~1.1).
- **Body / UI:** `Manrope` (or similar geometric sans), weights 400/500/600/700. Body 14–16px, meta 12–13px.
- **Logo wordmark "Notion Creative Art":** rounded bold sans (looks like `Baloo 2`), color `primary`, preceded by an `accent` circle.
- Load all fonts via `next/font/google`. No `<link>` tags.
- Small uppercase eyebrow labels ("CROCHET PATTERNS FOR EVERY MAKER", "OUR STORY", "MEET THE MAKER"): 11–12px, 600–700 weight, letter-spacing ~0.1em, color `primary`.

### Shape, spacing, shadow

- Buttons and chips: **fully pill-shaped** (`rounded-full`). Primary button: `primary` bg, white text, height 44–52px, weight 600–700. Secondary: white bg, 1.5px `primary` border, `primary` text.
- Cards and panels: radius 16–24px, 1px `border`, very soft shadow (`0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)`).
- Pattern image: radius ~20px, aspect ratio about 1:1 on cards.
- Section vertical padding: ~48–64px desktop, ~32–40px mobile.
- Inputs: pill or 12px radius, 1px `border`, 48px height, placeholder in `text-muted`.

---

## 3. Shared components (build these FIRST)

Build under `components/` and reuse everywhere. Pages must not re-implement these.

1. **AnnouncementBar** — full-width `primary` bar, centered white 12–13px text. Copy differs per breakpoint (see section 1).
2. **Header**
   - Desktop: logo (left); nav links `Shop`, `Skill levels`, `Free patterns`, `Reviews`; search input (pill, "Search patterns"); wishlist heart icon; cart icon with a small `primary` count badge; `Sign in` secondary pill button.
   - Tablet: logo (left), then search icon, heart, cart icon with count badge, hamburger (right). Hamburger opens the menu.
   - Mobile: hamburger (left), logo, search icon, cart icon with count badge (no heart). Hamburger opens a menu (links as above + Sign in / account links, including Wishlist).
   - When signed in, replace "Sign in" with an account entry that goes to My downloads.
3. **Footer** — `footer` bg. Left: logo (white text), tagline "Instant digital crochet patterns for makers of every level. Create something wonderful.", Instagram and Pinterest outline pills. Columns: SHOP (All patterns, New arrivals, Free patterns, Sale), HELP (FAQ, Contact, Refund policy), ACCOUNT (Sign in, My downloads, Wishlist). Bottom row: `© Notion Creative Art. All rights reserved.`, Privacy, Terms, "We accept" with Visa / Mastercard / Amex / PayPal outline chips. Tablet and laptop: brand block + SHOP / HELP / ACCOUNT columns. Mobile: brand block + only SHOP (without Sale) and HELP, no ACCOUNT column (see section 1).
4. **Button** — variants `primary`, `secondary`, `ghost/link`; sizes `md`, `lg`; supports icon left/right, loading, disabled.
5. **Badge** — `LevelBadge` (Beginner/Intermediate/Advanced, colors in section 2), `StatusBadge` (NEW = `primary` filled, SALE = `sale` filled, FREE = `free` filled), `CategoryChip` (neutral outline, e.g. "[Category]").
6. **PatternCard** — image area with tint background; top-left status badge (NEW/SALE/FREE) if applicable; top-right circular white wishlist heart button; bottom-left LevelBadge over the image; below image: pattern name, star + rating + `(count)`, price in `primary` bold with optional struck-through old price; bottom-right circular `primary` add-to-cart icon button. **Free pattern:** price reads "Free" in `free` color and the round button becomes a download icon instead of cart.
7. **PatternGrid** — responsive: 2 columns on mobile, 2 on tablet, 4 on laptop (Featured, Shop, You may also like). Wishlist page: 2 cols mobile and tablet, 3 cols laptop. Check each design image for the exact column count per page.
8. **Rating** — amber stars + numeric value. Product page has the larger version with 5-star breakdown bars.
9. **CartDrawer** — right-side drawer on desktop, bottom sheet on mobile. Header "Your cart (N)" + close. Green "Added to your cart" confirmation strip. Line items: thumbnail, name, LevelBadge, "PDF · instant download", Remove link, price (+ old price struck). Footer: Subtotal, note "Taxes, if any, are shown at checkout.", full-width primary **Checkout** with arrow, "Continue shopping" link, shield line "Secure checkout by Lemon Squeezy. You will sign in or create a free account to get your downloads." **Empty state:** "Your cart is empty / Pick a pattern you love and it will wait here. Saved items stay in your cart for about 7 days." + "Shop all patterns" and "Browse free patterns".
10. **AccountNav** — desktop: left sidebar card (My downloads, Orders, Wishlist, Account settings, divider, Sign out) with active item highlighted in light lavender. Mobile: horizontally scrollable pill tabs (My downloads, Orders, Wishlist, Account settings) with active pill filled `primary`.
11. **FAQ accordion** — rows with `+`/`−` toggle, one open at a time.
12. **EmailSignup** — blue (`primary`) band: "Get 10% off your next order", "Join the maker community. New patterns, straight to your inbox.", email input + white **Subscribe** pill, small print "Unsubscribe anytime. Read our privacy policy."
13. **Empty states** (reusable): icon-less centered title + body + two buttons, used for cart, downloads, filters with no results.

---

## 4. Pages (section order matters)

### 4.1 Home `/`
1. AnnouncementBar + Header
2. **Hero** — eyebrow "CROCHET PATTERNS FOR EVERY MAKER"; H1 "Beautiful crochet patterns, ready to download."; subtext "Clear, tested PDF patterns for every skill level. Pay once, download instantly and keep them for life."; buttons **Shop all patterns** (primary, arrow) + **Get a free pattern** (secondary); three tick items: Instant download, Printable PDF, Secure checkout. Desktop: text left, image collage right (one large lavender tile + two smaller tiles). Mobile: text then three image tiles stacked/row.
3. **Trust strip** — 4 items with small round icons: Instant download (PDF in your account in seconds), Guaranteed quality (Clear, tested instructions), Secure payment (Checkout by Lemon Squeezy), Lifetime access (Re-download anytime). Desktop 4 in a row, mobile 2×2.
4. **Featured patterns** — title + "View all patterns" link; PatternGrid of 4.
5. **Shop by skill level** (`surface-warm` band) — "Find patterns that match where you are right now." Three cards (Beginner "Start simple", Intermediate "Build your skills", Advanced "Take on a challenge") each with tinted image, LevelBadge, short description, and "Browse … patterns" link to `/shop?level=…`.
6. **Free pattern band** (sage rounded panel) — FREE tag, "Start with a free pattern", "Download a free PDF, no account needed. See the quality for yourself before you buy.", **Download a free pattern** button, two free-pattern images.
7. **What is inside every pattern** — sample pattern page image (stacked paper look) + 4 features: Clear round-by-round steps; Materials and size list; Photos for tricky steps; Printable PDF, yours for good. Link "Try a free pattern first".
8. **Meet the maker** — designer photo, eyebrow "MEET THE MAKER", story headline + 2–3 sentences, three stats (Patterns designed, Makers helped, Years crocheting), "Read our story" link. **Copy and numbers come from me; leave TODO. Do not invent.**
9. **What makers say** — "Real reviews from people who made our patterns." 3 review cards (2 on mobile), each: 5 stars, review text, `First name · Pattern bought`. Data from the reviews table. "Read all reviews" link. If no reviews exist, hide the section.
10. **Questions, answered** — left: title, "The basics before you buy.", "Still stuck? Write to [SUPPORT EMAIL]"; right: FAQ accordion with 5 items:
    - How do I get my pattern after paying? → "Right after payment you can download the PDF from the confirmation page. It is also emailed to you and saved in My downloads."
    - Do I need an account? → "Yes for paid patterns, so your files are safe and you can download them again. Free patterns can be downloaded without signing in."
    - Can I download a pattern again later? → "Yes. Every pattern you buy stays in your account, and you can download it as many times as you like."
    - Which skill level should I choose? → "Beginner patterns use basic stitches and short steps. Intermediate and Advanced add shaping and finer details. Each product page shows the level."
    - What if something is wrong with my file? → "[REFUND POLICY SUMMARY] You can also write to [SUPPORT EMAIL] and we will help." (TODO: real refund copy)
11. EmailSignup band, Footer.

### 4.2 Shop `/shop` (All patterns)
- Breadcrumb `Home › Shop`; H1 "All patterns"; "Showing 1–12 of N patterns".
- **Desktop:** category pills row (All patterns, Amigurumi, Wearables, Home decor, Free patterns, Sale), then second row: skill pills (Beginner, Intermediate, Advanced) | divider | Free, On sale, Bundles, then "More filters" button and "Sort: Newest" select. Active pills show a check and tinted fill (Beginner green, On sale lavender). Below: "Showing 1–12 of N patterns · Clear all". 4-column grid. Pagination: prev, 1, 2, 3, …, N, next with current page filled `primary`.
- **Mobile:** H1, count, a row with **Filters (count badge)** button and **Sort** select, horizontally scrolling quick pills. 2-column grid. Pagination simplified: prev, "Page 1 of N", next.
- **Filters** open as a bottom sheet (mobile) or modal/panel (desktop): CATEGORY (radio: All patterns, Amigurumi, Wearables, Home decor, each with count), SKILL LEVEL (checkboxes), PRICE (Free, Paid), OFFERS (On sale, Bundles). Footer: "Clear all" + primary **Show N patterns**.
- **Empty state:** "No patterns match your filters / Try removing a filter, or browse the full collection." + "Clear all filters" and "Browse free patterns".
- Filters and sort must be reflected in the URL query string (shareable, SEO-friendly).

### 4.3 Product `/shop/[category]/[slug]` (or the existing product route; keep the current URL scheme)
Three states, one page:
- **A. Paid, not owned (default):** breadcrumb; main image with prev/next arrows and NEW badge + wishlist heart; 4 thumbnails (mobile: dots); LevelBadge + CategoryChip; H1 name; share button (circle, top-right of title); rating with "(N reviews)" link; price + old price + "Save X%" pill (only if on sale); short description; tick list (Instant PDF download after payment; N-page printable PDF pattern; Lifetime access in your account; Finished size: SIZE); **Add to cart** (primary) + **Buy now** (secondary); info box "Secure checkout by Lemon Squeezy. You will sign in or create a free account at checkout, so your PDF is saved to your downloads." + Refund policy link.
  - **Mobile only:** sticky bottom bar with price (+ old price), heart, **Add to cart**.
- **B. Owned:** same gallery/title/rating; green box "You own this pattern / Bought DATE · Order #NUMBER"; description; **Download PDF** (primary), **View order** (secondary), **Leave a review** (link); "In your download" tick list; help box "Can not open the file? Write to SUPPORT EMAIL and we will fix it." Mobile sticky bar: "Owned · In your account" + Download PDF.
- **C. Free:** adds "Free" chip; price shown as big green "Free"; **Download free PDF** button; line "No account needed. Instant PDF download."; "What you get" list; "Like this pattern?" box with "Shop Beginner patterns" (level-aware link); license note line (TODO copy: e.g. personal use only, no resale). Mobile sticky bar: "Free · No account needed" + Download free PDF.
- **Tabs (desktop):** Description, What's included, Materials, Skill level, Details; **accordion on mobile**. Description tab: "About this pattern", two paragraphs, 3 tick key features, lifestyle photo (right on desktop, below on mobile).
- **Customer reviews:** "Write a review" button; left card with big rating, stars, "Based on N reviews", 5→1 star bars with counts; right list of review cards (date, title, text, first name); "Read all reviews".
- **You may also like:** 4 PatternCards.

### 4.4 Cart `/cart`
- Breadcrumb `Home › Cart`; H1 "Your cart" + "N patterns".
- **Desktop:** two columns. Left card: line items (thumb, name, LevelBadge, "PDF · instant download", "Save for later", "Remove", price + old price). Right sticky **Order summary**: Subtotal (N patterns), You save (green, discount), Taxes "Shown at checkout", Total, **Checkout** primary w/ arrow, "You will sign in or create a free account at checkout.", Continue shopping, three tick lines (Secure checkout by Lemon Squeezy; Instant PDF download after payment; Lifetime access in your account).
- **Mobile:** items card, then Order summary card below; a sticky bottom bar with Total + Checkout.
- "You may also like" grid. Empty state as in CartDrawer.
- Checkout flow: if not signed in, go to Sign in / Create account (cart preserved, banner "Your cart is saved: N patterns · SUBTOTAL"); then redirect to Lemon Squeezy hosted checkout; then return to Order success.

### 4.5 Sign in / Create account (`/signin`, same screen with tabs)
- Centered card, logo, segmented toggle **Sign in | Create account**.
- Sign in: H1 "Welcome back", sub "Sign in to check out and get your downloads."
- Create: H1 "Create your account", sub "Free, takes a minute. Your downloads will always be here."
- Both: lavender banner "Your cart is saved: N patterns · SUBTOTAL" (only when cart non-empty); **Continue with Google** (white pill, Google logo); divider "or use your email"; Email, Password (create: placeholder "Create a password", helper "At least N characters"); optional checkbox "Send me news about new patterns and offers (optional)" (create only); "Forgot password?" (sign in only); primary submit; create: "By creating an account you agree to our Terms and Privacy Policy."; footer line with lock icon "Your downloads are saved to your account."
- Use the **existing auth provider** already in the repo. If none exists, ask me before choosing one.

### 4.6 Order success `/order/success`
- Green check circle; H1 "Thank you, your order is confirmed"; "Order #NUMBER · DATE"; "We sent your receipt and download links to EMAIL".
- Card "Your patterns are ready — Download now, or come back anytime. Every pattern stays in My downloads." Each item: thumb, name, LevelBadge, "PDF · SIZE", **Download PDF**. Buttons: **Go to My downloads** (primary), **Continue shopping** (secondary).
- Order summary card (items + prices, Subtotal, Tax, Total, "Paid with PAYMENT METHOD", "View receipt" link).
- Two help cards: "Something not right?" (support email text) and "Enjoy your pattern?" with "Leave a review" link.
- "You may also like" grid. Desktop: main card left, summary + help cards right column.

### 4.7 Account area (requires sign-in; shares AccountNav)
- **My downloads** `/account/downloads`: H1, "N patterns. Download again anytime, no limits."; search input "Search your patterns" + sort select "Newest first"; list rows: thumb, name, LevelBadge, "PDF · SIZE · Bought DATE", "View order", "Leave a review", **Download PDF** (right on desktop, full-width below on mobile). Footer note: "Can not find a pattern you bought? Check the email you used at checkout or write to SUPPORT EMAIL." **Empty state:** "No downloads yet / Patterns you buy will appear here, ready to download anytime. Free patterns you claim show up here too." + Shop all patterns / Browse free patterns.
- **Orders** `/account/orders`: "Every purchase, with receipts from Lemon Squeezy."; order cards: "Order #NUMBER", "Placed DATE", green "Paid" pill, item rows (thumb, name, price), "Total", **View receipt** (secondary) + **Download all** (primary).
- **Wishlist** `/account/wishlist`: "Patterns you saved for later.", "N saved patterns" + "Sort: Newest"; PatternCard grid (3 cols desktop, 2 mobile).
- **Account settings** `/account/settings`: Profile card (Name — Edit, Email — Change, Password dots — Change); "Sign-in and emails" card (Google — Connected — Disconnect; checkbox "Send me news about new patterns and offers"; note "Order receipts and download links are always sent."); **Save changes** (primary, right-aligned); **Delete account** danger card (red title, text "This removes your account and access to your downloads. Patterns you bought can not be recovered afterwards.", red outline button "Delete my account" with a confirmation dialog).

### 4.8 Our story `/our-story`
- Hero: eyebrow "OUR STORY", H1 "[Headline: why Notion Creative Art exists]", 2–3 sentences, **Shop all patterns**, designer/studio photo (yellow tint, right on desktop).
- "How every pattern is made": 3 numbered cards — 1 Design, 2 Test, 3 Write (numbered lavender circles).
- Values row: Made with care, Support that answers, Fair and clear (round sage icon each).
- Blue stats band: three big numbers (Patterns designed, Makers helped, Five-star reviews) + **Try a free pattern** (white pill).
- **All copy is TODO from me.** Build the layout with clearly marked placeholder text.

### 4.9 Contact `/contact`
- H1 "Contact us", "Stuck with a file or a question before buying? Write to us and a real person will reply."
- Form card: Name, Email, Topic (select, default "Problem with a download"), Order number (optional, "#" prefix, helper "Helps us find your purchase faster"), Message ("Tell us what happened"), primary **Send message**.
- Side card "Other ways to reach us": Email, Reply time ("We usually reply within N hours, DAYS."), Based in (CITY, COUNTRY), links: Read the FAQ, Refund policy, Go to My downloads. Desktop: form left, side card right. Mobile: stacked.
- Submission must reach me (email or Supabase table). Ask me which one before wiring.

### 4.10 404
- Huge faint lavender "404" behind H1 "This page wandered off"; "The link may be old or mistyped. Search for a pattern, or start from one of these."; search input; **Shop all patterns** + **Back to home**; chips Amigurumi, Wearables, Home decor, Free patterns.

---

## 5. Data mapping (placeholders to real fields)

Use the existing database and types. If a field does not exist yet, tell me and propose a minimal change instead of silently inventing it.

| Placeholder | Source |
|---|---|
| `[PATTERN NAME]`, description, key features | pattern record |
| `[PRICE]`, `[OLD PRICE]`, `Save X%` | price and compare-at price; show old price/Save pill only when compare-at > price |
| NEW badge | created within last 30 days (confirm rule with me) |
| SALE badge | compare-at price set |
| FREE | price = 0 |
| Skill level | `beginner` / `intermediate` / `advanced` |
| `[Category]` | Amigurumi / Wearables / Home decor |
| `[4.8] ([N])`, star breakdown | computed from the existing `reviews` table (average, count, per-star counts). **Never hardcode 4.8.** |
| Review text, title, first name, date, "Pattern bought" | `reviews` table + pattern join |
| `[N]-page`, `[SIZE]` | pattern record (page count, finished size) |
| Photos | Supabase Storage URLs |
| `[SUPPORT EMAIL]`, `[CITY, COUNTRY]`, reply time | site config constants (TODO values from me) |
| Order number/date/total, payment method, receipt | Lemon Squeezy order data via webhook, stored per user |
| Downloads | files linked to purchased pattern, delivered via signed URL; never expose raw public file URLs for paid PDFs |

---

## 6. Behavior and quality requirements

- **Responsive:** every page must work at 360px, 768px, 1024px, 1440px. No horizontal scroll. Tap targets at least 44px.
- **Accessibility:** semantic headings (one H1 per page), labels on all inputs, visible focus ring in `primary`, alt text on images, icon-only buttons need `aria-label` (wishlist, cart, close, share).
- **Performance:** `next/image` everywhere, priority only on hero/first product image; fonts via `next/font`; no layout shift in cards (fixed aspect ratio).
- **SEO:** keep existing metadata, sitemap and canonical logic. Product pages keep unique title/description.
- **Cart persistence:** cart survives sign-in redirect (localStorage or server cart, whichever the repo already uses).
- **Security:** paid PDF downloads require auth and ownership check server-side.
- **Do not break** existing routes, Supabase queries, GA4 events or webhooks while restyling.

---

## 7. Build order (stop and show me after each step)

1. Tokens: fonts, colors, radius, shadows into Tailwind config. Show a small `/dev/styleguide` page (delete later) with buttons, badges, cards.
2. Shared components: AnnouncementBar, Header (desktop + mobile), Footer, Button, Badge, PatternCard, PatternGrid, CartDrawer.
3. Home page.
4. Shop page + Filters.
5. Product page (3 states).
6. Cart + Sign in/Create account.
7. Order success.
8. Account area (downloads, orders, wishlist, settings).
9. Our story, Contact, 404.
10. Final pass: responsive QA at 360 / 768 / 1024 / 1440, accessibility, remove styleguide.

---

## 8. Paste-ready prompt for Cursor

> Read `DESIGN_SPEC.md` completely and follow it exactly. This is a redesign of an existing Next.js (App Router) project, `nca-nextjs`, deployed on Vercel with product images in Supabase Storage. Keep all existing backend logic, routes, GA4 setup and data fetching; only restyle and restructure the UI.
>
> The designs are in the `design-reference/` folder (mobile 390px, tablet 834px, laptop 1440px), already sliced into PNGs. Section 10 of the spec maps each file to a page and a build step. For each step, open ONLY the PNGs listed for that step, in all three sizes, and match them closely for layout and visuals. Tall pages are split into `__part-a`, `__part-b` ... in top-to-bottom order. Anything in `[SQUARE BRACKETS]` is a data slot or copy placeholder; wire it to real data per section 5 of the spec or leave a marked TODO. Never render the brackets and never invent numbers, ratings or copy.
>
> Start ONLY with step 1 and step 2 of the build order (tokens + shared components + a temporary `/dev/styleguide` page). When done, tell me exactly which files you created or changed, then wait for my approval before starting the next step. If something in the spec conflicts with the existing code or a needed field/service is missing, ask me instead of guessing.

---

## 9. Open items I need to fill in (TODO list)

- Real values for colors (eyedropper from design export), confirm fonts.
- Brand story copy, "how every pattern is made" copy, values copy, stats numbers.
- Refund policy summary, free-pattern license note.
- Support email, reply time, city/country.
- Where the Contact form should send messages.
- Rule for the NEW badge.
- Auth provider confirmation if none exists in the repo.
- Tablet owned and free product states (not in the tablet export; adapt from mobile).
- Mobile empty states (cart empty, downloads empty, shop no results) are not exported; reuse the copy and adapt layout.

---

## 10. Design reference files (what to open at each build step)

Folder: `design-reference/{mobile-390, tablet-834, laptop-1440}/`. File names are `NN_page-name.png`; tall pages are split top to bottom as `NN_page-name__part-a.png`, `__part-b`, ... Images are at true design pixel width (390 / 834 / 1440), so 1 image px = 1 CSS px. Page names match the section 4 headings.

### Per build step: open these files (all three folders unless noted)

| Build step | Files |
|---|---|
| 1-2 Tokens and shared components | `*_home__part-a` (header, announcement bar, hero, trust strip, first pattern cards), the last `*_home__part-*` (EmailSignup and footer), `*_cart-drawer`, plus `mobile-390/03_filters-sheet` |
| 3 Home | all `*_home__part-*` |
| 4 Shop and filters | `*_shop*` (all parts), `mobile-390/03_filters-sheet`, `tablet-834/03_filters-panel`, `tablet-834/04_shop-no-results`, `laptop-1440/03_shop-no-results` |
| 5 Product (3 states) | `*_product-*` (paid, owned, free, all parts), including mobile sticky bars `05`, `07`, `09` |
| 6 Cart and sign in | `*_cart-*`, `*_signin`, `*_create-account`, `*_lemonsqueezy-external-page` (reference only, not built), mobile `12_cart-sticky-bar` |
| 7 Order success | `*_order-success__part-*` |
| 8 Account area | `*_account-*` (my-downloads, downloads-empty, orders, wishlist, settings) |
| 9 Our story, Contact, 404 | `*_our-story*`, `*_contact*`, `*_404` |

### Full file map

**mobile-390 (23 pages):** 01 home, 02 shop, 03 filters-sheet, 04 product-paid, 05 product-paid-sticky-bar, 06 product-owned, 07 product-owned-sticky-bar, 08 product-free, 09 product-free-sticky-bar, 10 cart-drawer, 11 cart-page, 12 cart-sticky-bar, 13 signin, 14 create-account, 15 lemonsqueezy-external-page, 16 order-success, 17 account-my-downloads, 18 account-orders, 19 account-wishlist, 20 account-settings, 21 our-story, 22 contact, 23 404.

**tablet-834 (20 pages):** 01 home, 02 shop, 03 filters-panel, 04 shop-no-results, 05 product-paid, 06 cart-drawer, 07 cart-empty, 08 cart-page, 09 signin, 10 create-account, 11 lemonsqueezy-external-page, 12 order-success, 13 account-my-downloads, 14 account-downloads-empty, 15 account-orders, 16 account-wishlist, 17 account-settings, 18 our-story, 19 contact, 20 404.

**laptop-1440 (21 pages):** 01 home, 02 shop, 03 shop-no-results, 04 product-paid, 05 product-owned, 06 product-free, 07 cart-drawer, 08 cart-empty, 09 cart-page, 10 signin, 11 create-account, 12 lemonsqueezy-external-page, 13 order-success, 14 account-my-downloads, 15 account-downloads-empty, 16 account-orders, 17 account-wishlist, 18 account-settings, 19 our-story, 20 contact, 21 404.

Notes: the signin, create-account, cart-drawer and filter pieces are overlays (modal, drawer or sheet) shown on their own; on tablet and laptop they are small frames (about 440px wide for sign-in), not full pages. `lemonsqueezy-external-page` is a placeholder for the hosted checkout and must NOT be built.
