# Notion Creative Art — Project Recap

**Generated:** 2026-09-11  
**Repo path:** `nca-nextjs/`  
**Product:** Digital crochet PDF pattern e-commerce storefront + admin (“Shop Manager”) for **Notion Creative Art** (`notioncreativeart.com`).  
**Purpose of this doc:** Full technical + product audit for returning to the project after time away. Exhaustive by design.

---

## 1. TECH STACK

### 1.1 Frontend framework

| Item | Detail |
|------|--------|
| Framework | **Next.js** App Router |
| Version | `16.3.2` (`package.json`) |
| React | `19.2.8` / `react-dom` `19.2.8` |
| Language | TypeScript `^5` |
| Rendering | Mix of Server Components (route `page.tsx` loaders, metadata, admin layout gate) and heavy **client** view modules under `src/views/` |
| Package manager | **npm** (`package-lock.json` present in repo; scripts use `npm run dev|build|start|lint`) |

Key Next features in use:
- App Router route groups: `(customer)`, `admin`, standalone auth pages
- Middleware session refresh + `/admin` gate (`src/middleware.ts` → `src/lib/supabase/middleware.ts`)
- `next/font/google` for Manrope, Playfair Display, Baloo 2
- `next/image` with AVIF/WebP, remote Supabase storage hosts
- Server Action: `revalidateStorefront` (`src/lib/actions/revalidateStorefront.ts`)
- CSP / security headers in `next.config.ts`
- Sitemap / robots (`src/app/sitemap.ts`, `src/app/robots.ts`)

### 1.2 Backend framework / language

There is **no separate Node/Express backend app**.

| Layer | Role |
|-------|------|
| **Next.js** | UI, middleware, one auth callback Route Handler, server actions |
| **Supabase** | Postgres DB, Auth, Storage, Row Level Security, Edge Functions (Deno/TypeScript) |
| **Direct client → Supabase** | Most CRUD from browser via `@supabase/supabase-js` + RLS |

Supabase JS clients:
- Browser: `src/lib/supabase.ts` / `src/lib/supabase/client.ts`
- Server: `src/lib/supabase/server.ts`
- Middleware: `src/lib/supabase/middleware.ts`
- Static/build: `src/lib/supabase/static.ts`

### 1.3 Database(s)

| Item | Detail |
|------|--------|
| Primary DB | **PostgreSQL** (Supabase project; example URL host in `.env.example`: `anlsellghialszuuvipw.supabase.co`) |
| ORM | **None** — Supabase JS query builder + raw SQL migrations/scripts |
| Types | Hand-written `src/lib/types.ts` (no generated `database.types.ts` in repo) |
| Schema sources | `supabase/schema.sql`, `supabase/full-setup.sql`, `supabase/full-setup-continue.sql`, plus many incremental `supabase/*.sql` files (no formal `supabase/migrations/` folder / `config.toml` in repo) |

Storage buckets (see §5):
- `product-images` — public product/category art
- `patterns` — private PDFs

### 1.4 Hosting / deployment

| Item | Detail |
|------|--------|
| Frontend host | **Vercel** (documented in `next.config.ts` comments; production canonical `https://notioncreativeart.com`; `VERCEL_ENV` used for prod URL force) |
| Deploy model | Push to `main` → Vercel production (team workflow used throughout this project’s history) |
| Backend host | **Supabase** (DB, Auth, Storage, Edge Functions) |
| HSTS | Left to Vercel edge (explicitly not duplicated in Next headers) |

### 1.5 Authentication

| Item | Detail |
|------|--------|
| Provider | **Supabase Auth** |
| Methods | Email/password; **Google OAuth** (`prompt: select_account`) |
| Session | Cookie-based via `@supabase/ssr` middleware refresh |
| OAuth callback | `GET /auth/callback` → `exchangeCodeForSession` |
| Email verification | Supabase confirm-email flow; UI banners + optional Edge `activate-email-signup` for smoother first session |
| Password reset | `resetPasswordForEmail` → `/reset-password` recovery session → `updateUser({ password })` |
| Rate limiting | Edge Function `auth-rate-limit` + client helper `src/lib/authRateLimit.ts` |
| Admin auth | Boolean `profiles.is_admin` (no multi-role RBAC). Set outside the app (Supabase Dashboard). Privilege-escalation hardened via SQL (`CRITICAL-fix-profile-privilege-escalation.sql`) |
| Admin UX policy | `AdminAreaGuard` forces admin users off the customer shell onto `/admin` (except login/signup/reset) |

Auth UI surfaces:
- Pages: `/login`, `/signup`, `/reset-password`
- Overlay: `AuthSheet` / `AuthModal` via `UIContext.requireAuth`
- Templates: `supabase/email-templates/` (+ `AUTH-SETUP.md`)

### 1.6 Payment gateway

| Item | Detail |
|------|--------|
| Gateway | **Lemon Squeezy** (not Stripe/PayPal as primary SDKs) |
| Client | Lemon.js overlay (`assets.lemonsqueezy.com`) loaded in root layout |
| Checkout create | Edge Function `create-cart-checkout` → Checkout API URL |
| Modes | Per-product `checkout_mode`: `overlay` \| `hosted` |
| Webhook | Edge Function `lemon-webhook` (HMAC secrets) writes `orders` / `purchases`, sends confirmation email |
| Refunds | Edge Function `admin-refund-order` (admin JWT + `is_admin`) |
| Nested payment UI | Stripe iframe allowed only inside Lemon overlay (CSP `frame-src`) |
| Env | `NEXT_PUBLIC_LEMON_STORE_SLUG`, `NEXT_PUBLIC_LEMON_VARIANT_TEST_ID`, server `LEMON_API_KEY`, `LEMON_WEBHOOK_SECRET` / `_LIVE` |

### 1.7 Email service

| Item | Detail |
|------|--------|
| Transactional | **Resend** (`RESEND_API_KEY`) via `supabase/functions/_shared/resend.ts` |
| From address | `orders@notioncreativeart.com` (shared helpers) |
| Uses | Order confirmation, abandoned-cart reminder, support chat escalate (“talk to human”) |
| Auth emails | **Supabase Auth** built-in (verify / reset) with custom HTML templates |

There is **no Brevo/SendGrid** integration in code.

### 1.8 State management

**React Context API only** (no Redux / Zustand / React Query).

| Context | File | Responsibility |
|---------|------|----------------|
| `AuthProvider` | `src/context/AuthContext.tsx` | Session, profile, sign-in/up/out, Google OAuth, pending post-auth actions |
| `UIProvider` | `src/context/UIContext.tsx` | Auth sheet/modal, `requireAuth`, newsletter prompt, busy overlay |
| `CartProvider` | `src/context/CartContext.tsx` | Guest localStorage cart + DB `cart_items`, Lemon checkout start |
| `WishlistProvider` | `src/context/WishlistContext.tsx` | Guest local + DB wishlist |
| `ToastProvider` | `src/context/ToastContext.tsx` | Toast notifications |

Composition: `src/components/Providers.tsx` → Auth → Toast → UI → Wishlist → Cart (+ `GuestMergeRunner`, `PendingActionRunner`, Analytics, CookieConsent).

URL/filter state for shop uses `useUpdateSearchParams` (Next search params + transitions).

### 1.9 Styling approach

| Item | Detail |
|------|--------|
| Framework | **Tailwind CSS v4** (`tailwindcss` `^4`, `@tailwindcss/postcss`) |
| Config style | **CSS-first `@theme`** in `src/app/globals.css` (no classic `tailwind.config.js` theme file) |
| Tokens | CSS variables for colors, fonts, `--max-width-site`, custom breakpoints |
| Component library | **None** (no shadcn/MUI/Chakra). Custom components + `MaterialIcon` SVG map |
| Icons | Inline Material Symbols paths (`src/components/MaterialIcon.tsx`); some custom SVGs in `src/components/icons` |

### 1.10 Third-party APIs / SDKs

| Service | Usage |
|---------|--------|
| Supabase | Auth, DB, Storage, Edge Functions, RPCs |
| Lemon Squeezy | Checkout overlay + API + webhooks |
| Resend | Transactional / support email |
| Groq | Support chat LLM (`GROQ_API_KEY` in `chat-support`) |
| Google Analytics | `NEXT_PUBLIC_GA_MEASUREMENT_ID` → `Analytics.tsx` |
| Pinterest Tag | `NEXT_PUBLIC_PINTEREST_TAG_ID` → `PinterestTag.tsx` |
| Google Fonts via next/font | Manrope, Playfair, Baloo 2 (self-hosted by Next) |
| PapaParse | Admin CSV import/export only |

### 1.11 Key dependencies (`package.json`)

**Runtime**
- `next` `16.3.2`
- `react` / `react-dom` `19.2.8`
- `@supabase/supabase-js` `^2.112.3`
- `@supabase/ssr` `^0.12.4`
- `papaparse` `^5.7.0`

**Dev**
- `tailwindcss` `^4`, `@tailwindcss/postcss` `^4`
- `typescript` `^5`
- `eslint` `^9`, `eslint-config-next` `16.3.2`
- `@types/node` `^20`, `@types/react` `^19`, `@types/react-dom` `^19`, `@types/papaparse` `^5.5.2`

---

## 2. DESIGN SYSTEM

**Source of truth:** `src/app/globals.css` (`@theme` block). Change root tokens first; aliases point back to them.

### 2.1 Color palette (hex)

#### Brand / core

| Token | Hex | Role |
|-------|-----|------|
| `--color-primary` | `#111111` | Near-black primary (e.g. newsletter banner) |
| `--color-primary-hover` | `#000000` | Hover |
| `--color-primary-soft` | `#EDEDED` | Soft primary surface |
| `--color-accent` | `#1f249c` | Brand navy (CTAs, links, selected filters) |
| `--color-accent-hover` | `#191d7d` | Navy hover |
| `--color-accent-soft` | `#e9eaf5` | Soft navy wash |
| `--color-logo-accent` | `#D68A3E` | Logo gold/orange accent |
| `--color-secondary` | `#6F8760` | Moss / sage secondary |
| `--color-secondary-soft` | `#EEF2E8` | Soft moss |

#### Text / surfaces / borders

| Token | Hex | Role |
|-------|-----|------|
| `--color-text` | `#1F2933` | Body ink |
| `--color-muted` | `#5B6472` | Secondary text |
| `--color-muted-light` | `#9AA1A9` | Tertiary text |
| `--color-background` | `#FCFBF8` | Page canvas (warm linen) |
| `--color-surface` | `#F8F4ED` | Bands / chips / soft panels |
| `--color-surface-card` | `#FFFFFF` | Cards |
| `--color-border` | `#E7E1D8` | Dividers / input borders |
| `--color-skeleton` | `#E5DFD4` | Loading pulse |

#### Status / merchandising

| Token | Hex | Role |
|-------|-----|------|
| `--color-sale` | `#E24B4A` | Sale red |
| `--color-sale-dark` | `#C13332` | Sale dark |
| `--color-error` | `#B94A48` | Error / madder |
| `--color-error-dark` | `#963A38` | Error dark |
| `--color-gold` | `#D9A441` | Warning / gold |
| `--color-warning-soft` | `#FFF5DF` | Soft warning bg |

#### Skill-level pills

| Token | Hex |
|-------|-----|
| `--color-skill-beginner-soft` / `-ink` | `#C3E0A8` / `#2E5A1C` |
| `--color-skill-intermediate-soft` / `-ink` | `#FADE8A` / `#7A4E08` |
| `--color-skill-advanced-soft` / `-ink` | `#F5BFA8` / `#96331C` |

#### Semantic aliases (point at cores)

| Alias | Maps to |
|-------|---------|
| `canvas`, `linen` | background |
| `ink` | text |
| `ink-soft` | muted |
| `ink-light` | muted-light |
| `line` | border |
| `madder` / `madder-dark` | error |
| `sale-green` / `-dark` / `-soft` | accent (historical naming) |
| `moss` | secondary |
| `cart-blue` | accent |
| `warning` | gold |
| `sale-red` | sale |

Default announcement bar colors (`types.ts`): bg `#111111`, text `#ffffff`.

Viewport theme color: `#FCFBF8`.

### 2.2 Typography

#### Font families (`src/app/layout.tsx` → CSS vars)

| Family | CSS var | Utility / usage |
|--------|---------|-----------------|
| **Manrope** | `--font-manrope` | `--font-body`, `--font-display`, `--font-subheading`, `--font-mono` — UI body, display headings, subheads |
| **Playfair Display** | `--font-playfair` | `--font-heading` — marketing serif headings (`preload: false`) |
| **Baloo 2** | `--font-baloo-2` | `--font-logo` / `.mobile-nca-logo` (weight 800) — NCA wordmark |

Fallbacks: `system-ui, -apple-system, 'Segoe UI', sans-serif` (UI); `Georgia, serif` (heading).

#### Size / weight patterns (common in UI; not a formal type scale token file)

| Use | Typical classes |
|-----|-----------------|
| Page H1 (shop/search) | `font-display font-semibold text-3xl md:text-4xl` |
| Marketing H2 | `font-heading` / `font-subheading` + `text-xl`–`text-2xl` |
| Sheet titles | `text-[18px]`–`text-[20px] font-bold` |
| Section titles (filters sheet) | `text-[20px] font-bold` |
| Body / cards | `text-[13px]`–`text-[14px]` / `text-[16px]` option rows |
| Meta / eyebrows | `text-[11px]` + tracking (`tracking-[0.08em]`–`0.15em`) |
| Buttons | Global `button, .btn { font-weight: 600 }` |

Weights commonly used: 400 (normal), 500–600 (medium/semibold), 700 (bold), 800 (logo).

### 2.3 Spacing / sizing / containers

| Token / pattern | Value |
|-----------------|-------|
| `--max-width-site` | `1600px` default |
| Ultra-wide override | `1800px` ≥1920px; `2000px` ≥2560px |
| Utility | `max-w-site` centers content column |
| Common page padding | `px-4` / `px-6` → `md:px-16` → `xl:px-24` → `2xl:px-32` |
| Vertical page rhythm | `py-10`–`py-14` typical |
| Listing grid | `LISTING_PRODUCT_GRID_CLASS`: 2 / 3 / 4 cols; gaps `gap-x-3 md:gap-x-6 lg:gap-x-8`; `gap-y-10 lg:gap-y-14` |
| Listing page size | **12** products (`LISTING_PAGE_SIZE`) |

No formal spacing scale CSS variables — Tailwind spacing utilities used ad hoc.

### 2.4 Radius, shadows, motion

**Radius patterns**
- Filters / small chips: `rounded-sm`, `rounded-[4px]`
- Inputs / thumbs: `rounded-lg`
- Cards / panels: `rounded-xl`, `rounded-2xl`
- CTAs / pills / avatars / sheet controls: `rounded-full`

**Shadows (inline, representative)**
- Cards: `shadow-[0_1px_3px_rgba(0,0,0,0.04)]`
- Dropdowns: `shadow-lg`, `shadow-[0_8px_24px_…]`, `shadow-[0_8px_30px_…]`
- Bottom sheets: `shadow-[0_-8px_32px_rgba(0,0,0,0.12)]`
- Nav / overlays: `shadow-[0_12px_28px_…]`

**Motion**
- `@keyframes fadeIn` in `globals.css`
- `prefers-reduced-motion` hard-disables animations/transitions

**Other chrome**
- Selection: ink background / canvas text
- Listing filter radios/checkboxes: custom CSS in `globals.css` (`.listing-filter-check`, `.listing-filter-radio`)
- Sheet scroll: `.listing-sheet-scroll` hides native scrollbar

### 2.5 Component library

**None third-party.** Custom building blocks include:
- `Header`, `Footer`, `CustomerShell`
- `ProductCard`, `ProductCardMeta`, `ProductTagPill`, `StarRating`, `QuickView`
- `ProductListingFilters`, `SortFilterTriggerButton`
- `SectionBand`, `Skeleton`, `EmptyState`, `ErrorBoundary`
- Auth: `AuthSheet`, `AuthModal`, `AuthBrandPanel`, `PasswordStrength`, `SignupLoadingOverlay`
- Cart: `CartDrawer`, `CheckoutOverlay`
- Marketing: `NewsletterBanner`, `NewsletterPromptModal`, `CookieConsent`
- Support: `SupportChat` (feature-flagged off)
- Admin: large monolithic `Admin.tsx` + `AdminDashboard`, `AdminHomepage`, `AdminBulkUpload`, `AdminReviews`

### 2.6 Responsive breakpoints

#### Custom header tiers (`@theme`)

| Name | Width | Tailwind variant | Intent |
|------|-------|------------------|--------|
| Mobile | `< 481px` | default | Phone header |
| Tablet | `481px`–`1024px` | `tablet:` | Mid header |
| Desktop | `≥ 1025px` | `desktop:` | Full header |

Documented in `globals.css`: **do not remap `md`/`lg` for header** — page grids keep standard Tailwind breakpoints.

#### Standard Tailwind (page grids, shop, etc.)

Commonly used: `sm`, `md`, `lg`, `xl`, `2xl` (e.g. product grids `md:grid-cols-3 xl:grid-cols-4`, filters `lg:` sticky sidebar, Sort & Filter sheet `lg:hidden` / trigger `md:hidden`).

---

## 3. ADMIN PANEL

**Entry:** `/admin` and `/admin/*` catch-all → `src/app/admin/[[...slug]]/page.tsx` → client `src/views/Admin.tsx`.  
**Server gate:** `src/app/admin/layout.tsx` — must be signed in + `profiles.is_admin`.  
**Middleware gate:** same check; redirect to `/login?redirect=…` or home.  
**Client guards:** `AdminAreaGuard`, `AdminRedirect`.  
**Metadata:** admin routes `noIndex`.

### 3.1 Every admin route / page

| Route | View / mode | In sidebar nav? |
|-------|-------------|-----------------|
| `/admin` | `AdminDashboard` | Yes — Dashboard |
| `/admin/listings` | `ProductsAdmin` (all types) | Yes — Listings |
| `/admin/bulk-upload` | `AdminBulkUpload` | Yes — Bulk Upload |
| `/admin/orders` | `OrdersAdmin` | Yes — Orders |
| `/admin/reviews` | `AdminReviews` (pending badge via `get_pending_review_count`) | Yes — Reviews |
| `/admin/categories` | `CategoriesAdmin` | Yes — Categories |
| `/admin/homepage` | `AdminHomepage` / `HomepageAdmin` | Yes — under Settings |
| `/admin/subscribers` | Newsletter subscribers list | Yes — under Settings |
| `/admin/trash` | Soft-deleted products | Yes — Trash |
| `/admin/free-patterns` | `ProductsAdmin` filtered to free | No (routed) |
| `/admin/bundles` | `ProductsAdmin` filtered to bundles | No (routed) |
| Unknown `/admin/*` | Falls through to Dashboard | — |

### 3.2 Per-area capabilities

#### Dashboard (`/admin`) — `AdminDashboard.tsx`
- **Read-only** overview
- Product counts: active / draft / sold_out
- Orders: revenue & counts for today / 7d / 30d
- Recent orders; wishlist “favourites” activity
- Tabs: Home (tasks + recent orders), Activity (purchases / favourites filters)
- **Gap:** `viewsToday` is **hard-coded to `0`** (no analytics wiring)

#### Listings (`/admin/listings`) — `ProductsAdmin` inside `Admin.tsx`
- **Create / update** products (multi-tab form):
  - Details: title, slug, subtitle, description, materials, skill level, category, flags
  - Photos & files: multi-image upload to `product-images`; PDF to `patterns/{id}.pdf`; `pdf_filename` / `pdf_pages`
  - Pricing: price, compare-at, free vs paid, Lemon checkout ID + numeric variant ID, `checkout_mode`
  - SEO: `meta_title`, `meta_description`
- Bundle fields: `is_bundle`, `bundle_includes[]`
- Status: publish/unpublish (`active`), `sold_out`, `featured`, `card_badge` (`sale`|`new`|`featured`|null)
- Soft delete → `deleted_at` (+ inactive); bulk trash
- Duplicate product (clears Lemon IDs; draft)
- Bulk activate / deactivate
- Filters: status (`active|draft|sold_out|inactive|all`), type (`paid|free|bundles`), title search
- Export via `ProductExportModal` / `productExport.ts`
- After mutations: `revalidateStorefront` + home catalog cache clear

#### Bulk Upload (`/admin/bulk-upload`)
- CSV + folder of images/PDFs (`papaparse`, `bulkUpload.ts`, `uploadValidation.ts`)
- Preview rows: Ready / Skip / PDF warnings
- Creates products + uploads assets; can land as draft if PDF issues

#### Free / Bundles shortcuts
- Same product CRUD with type filter pre-applied

#### Categories (`/admin/categories`)
- CRUD: name, slug, `parent_id` (hierarchy), image upload, `sort_order` on create
- Delete blocked if subcategories exist or products are assigned

#### Orders (`/admin/orders`)
- Paginated list; expand line items from `product_ids`
- **Refund** via `admin-refund-order` (Lemon + optional revoke purchases)
- **Revoke access** without refund (delete `purchases` for order)
- No manual order create; no arbitrary amount/status edit UI

#### Reviews (`/admin/reviews`)
- List all statuses (admin RLS)
- Approve / Reject (`status`, `moderated_at`, `moderated_by`)
- Permanent delete
- No admin-authored review create

#### Homepage CMS (`/admin/homepage`) — upserts `site_settings` keys

| Key | What admin edits |
|-----|------------------|
| `seo` | Homepage meta title/description, OG image |
| `homepage_layout` | Section order + visibility (`LayoutSection` ids) |
| `hero` | Eyebrow, title, images, primary/secondary CTAs |
| `free_patterns` | Collage `product_ids` (2–4) |
| `chapters` | Beginner / intermediate / advanced cards |
| `categories` | Shop-by-category cards (copy/image/link) |
| `announcements` | Enabled, messages[], bg/text colors |
| `testimonials` | Quote / name / role / photo |
| `social` | Instagram, YouTube, Pinterest, Facebook URLs |

#### Newsletter (`/admin/subscribers`)
- Paginated read of `newsletter_subscribers`
- **Export CSV** (full list)
- No delete / unsubscribe UI in admin

#### Trash (`/admin/trash`)
- Restore (clear `deleted_at`)
- Delete forever (hard delete product + revalidate)

### 3.3 Admin authentication / authorization

| Mechanism | Behavior |
|-----------|----------|
| Role model | Single flag `profiles.is_admin` |
| Who can set admin | Outside app (Supabase); clients cannot self-promote |
| Middleware | Blocks non-admin `/admin*` |
| Server layout | Double-check before render |
| Client | “Not authorized” empty state; `AdminAreaGuard` keeps admins on admin app |
| Edge refund | Re-validates JWT + `is_admin` |
| RLS | Admin policies on products, categories, orders, purchases, reviews, site_settings, storage |

**No admin user-management console** (no list/promote/demote customers in UI).

### 3.4 Dashboard / analytics

- Order revenue & counts (ranges)
- Product status inventory counts
- Recent purchases / favourites activity feed
- Pending reviews badge
- **Missing:** real page-view analytics (`viewsToday = 0`); no GA embedding inside admin

### 3.5 Product / listing management

Covered under Listings + Bulk Upload + Trash + Free/Bundles (§3.2). Digital-product specifics: Lemon IDs, PDF storage, SEO fields, soft delete, featured/badge merchandising.

### 3.6 Order management

List, inspect line items, Lemon refund, revoke download access. Fulfillment is automatic (webhook → purchases → PDF entitlement).

### 3.7 User management

**Not present in admin UI.** Customers self-manage profile/billing under `/account/*`. Admins are store operators only.

### 3.8 Settings / configuration panels

- Homepage CMS + SEO + announcements + social (`/admin/homepage`)
- Newsletter subscriber export (`/admin/subscribers`)
- Per-product checkout mode & Lemon IDs (listings form)
- Site feature flag in code: `ENABLE_SUPPORT_CHAT` (`src/lib/featureFlags.ts`)

---

## 4. BUYER-SIDE FEATURES

### 4.1 Signup flow

**Surfaces:** `/signup` (`AuthPage`), `AuthSheet` / `AuthModal`.

| Field | Rules |
|-------|--------|
| Name | Required |
| Email | Required; format validation; duplicate detection (empty Supabase `identities`) |
| Password | Required; `PASSWORD_RULES`: 8+, upper, lower, special; strength meter (`PasswordStrength`) |
| Google | OAuth button |

Additional:
- Terms / Privacy acknowledgment copy
- Rate-limited via `auth-rate-limit`
- Flow: `signUp` → optional `activate-email-signup` Edge Function → verify-email UX (`verify-sent` with Open Email / Resend) and/or toast
- Loading overlay: `SignupLoadingOverlay`

### 4.2 Sign-in flow

**Surfaces:** `/login`, auth overlays.

| Method | Details |
|--------|---------|
| Email / password | Required fields; show/hide password |
| Remember me | If unchecked → `signOut` on `beforeunload` |
| Google OAuth | `prompt: select_account`; callback `/auth/callback` |
| Forgot password | Email-only reset request → Supabase email → `/reset-password` |
| Rate limit | Same auth rate-limit edge |

Post-login:
- `AdminRedirect` / `nca_signin_intent` can send admins to `/admin`
- `GuestMergeRunner` merges guest cart/wishlist into DB
- `PendingActionRunner` runs deferred buy/checkout/wishlist actions

### 4.3 Password reset flow

1. Request from login/forgot UI → `resetPasswordForEmail`
2. User opens link → recovery session
3. `/reset-password` (`ResetPassword.tsx`) requires session
4. New password + confirm (same strength rules + match)
5. `updateUser({ password })` → redirect `/login`

Account area also supports **change password while logged in** (re-auth with current password). Google-only accounts cannot change password there (copy notes this).

### 4.4 Account / profile management

| Route | Features |
|-------|----------|
| `/account` | Redirect → `/account/orders` |
| `/account/orders` | Filters: All / Completed / Processing / Refunded; links to detail |
| `/account/orders/[orderId]` | Status, line items, PDF download, receipt button |
| `/account/downloads` | All purchases → signed PDF download |
| `/account/wishlist` | Wishlist (also public `/wishlist`) |
| `/account/addresses` | Billing address editor |
| `/account/profile` | Tabs: Profile / Password / Addresses |
| `/account/newsletter` | Opt-in for account email |
| `/account/logout` | Confirm logout |

Profile details:
- Editable **name** with **7-day cooldown** (`name_changed_at`)
- Email **read-only** (“contact support”)
- Billing fields: country, line1, city, state, zip — US stricter validation (`billingAddress.ts`); pre-fills Lemon checkout

Unauthenticated account routes show Sign In CTA (**wishlist is the exception** — usable as guest).

### 4.5 Browse / search / filter

| Surface | Behavior |
|---------|----------|
| Home | CMS-driven sections (hero, categories, chapters, trending, new arrivals, free collage, bundles, testimonials, newsletter, etc.) via `site_settings` + `homeCatalog` |
| `/shop` | All patterns; query filters |
| `/shop/[categorySlug]` | Category / virtual filters (`sale`, `new`, real categories + subs e.g. no-sew) |
| `/search?q=` | Text RPC / query then same listing chrome |
| Header search | Live suggestions dropdown |

**Filters / sort** (`listingFilters.ts`, `Shop.tsx`, `Search.tsx`, `ProductListingFilters.tsx`):
- Skill levels (multi): beginner / intermediate / advanced (`level` CSV param)
- Pricing: paid / free (`price=`)
- Legacy/URL still understands sale/bundle params for fetch even if UI trimmed
- Sort: Newest, Price low→high, Price high→low, Best selling (purchase-count map)
- Desktop: sidebar panel + header `<select>` sort
- Mobile: compact **Sort & Filter** pill inline with H1 → bottom sheet (Etsy-like restyle)

Pagination: 12 per page; soft updates without full-grid skeleton flash when possible.

### 4.6 Product detail page (`/pattern/[slug]`)

`ProductDetail.tsx` features:
- Image gallery (thumbs, arrows, swipe, neighbor preload)
- Badges: Free / Sale / Bundle / card_badge
- Title, subtitle, skill + tag pills
- Star rating summary + social proof (“N+ makers…”) when purchase count ≥ 3
- Buy box: price / compare-at; Add to Cart; Buy now; Download free; Wishlist; Share
- Sold out; owned-pattern detection via `purchases`
- Sticky mobile buy bar
- Accordion/sections: description, included, materials, skill, details, reviews
- Related (category) + “Customers also bought” (`get_also_bought` RPC)
- Soft-deleted / unavailable slug messaging (`product_slug_ever_existed`)
- `QuickView` modal shares cart/buy/wishlist patterns

### 4.7 Cart

- Guest: `localStorage` (`guestStorage.ts`); free items stripped from cart; aging messaging (~7 days)
- Auth: `cart_items` table
- Merge on login
- UI: `/cart` page + `CartDrawer`
- Line remove / clear; order summary
- Abandoned-cart emails via cron Edge Function + `cart_abandoned_reminders`

### 4.8 Checkout

| Step | Detail |
|------|--------|
| Auth gate | **Checkout requires sign-in** (no guest payment). Guest can build cart then `requireAuth` + pending checkout |
| Create session | `startApiCheckout` → `create-cart-checkout` (JWT) |
| Pay | Lemon overlay (or hosted window) |
| Success | Lemon `Checkout.Success` client event; `/order-success` polls latest order (~6 attempts) |
| Fulfillment | `lemon-webhook` inserts/updates `orders` + `purchases`; Resend confirmation email |
| Trust copy | “Payments protected by Lemon Squeezy”; footer lists card brands / PayPal as Lemon-accepted methods |

Billing address from profile pre-fills where Lemon supports it.

### 4.9 Order history / tracking

- `/account/orders` list with status chips
- `/account/orders/[orderId]` detail
- Statuses used in UI: completed / processing / refunded (maps from order `status`: pending/paid/refunded)
- Receipt download: `DownloadReceiptButton` → `download-order-receipt` Edge Function (JWT; ownership check)

### 4.10 Wishlist / favorites

- Guest local OR authenticated DB (`wishlist` table)
- Heart on cards / PDP / QuickView without forcing auth
- Pages: `/wishlist`, `/account/wishlist`
- `wishlist_count` maintained by DB trigger for popularity/empty-state suggestions

### 4.11 Reviews / ratings

- Display approved reviews only; verified-purchase badge
- `StarRating` on cards (via batch stats) and PDP
- Submit rules: must own product; one review per user/product; rating + display name + body 10–2000 chars
- RPC `submit_review`; statuses `pending` → admin approve/reject
- Component: `ProductReviews.tsx`

### 4.12 Digital download delivery

| Case | Path |
|------|------|
| Free pattern | Edge `download-free-pattern` (public, price-checked server-side, rate-limited) → signed URL; may prompt newsletter |
| Paid purchase | Entitlement via `purchases` row; download from account/orders/downloads using storage signed URLs / `triggerPdfDownload` (`downloads.ts`) |
| Storage | Private `patterns` bucket; RLS: purchaser or admin |
| Receipt PDF | `download-order-receipt` |

### 4.13 Newsletter / marketing opt-in

1. Homepage `NewsletterBanner` (“Get 10% Off…” style CTA)
2. Post free-download `NewsletterPromptModal` (once; local flag)
3. Account `/account/newsletter`
4. Edge `subscribe-newsletter` → `newsletter_subscribers` (rate-limited)
5. Admin export CSV

### 4.14 Guest vs authenticated matrix

| Action | Guest | Authenticated |
|--------|-------|---------------|
| Browse / search / filter | Yes | Yes |
| Cart / wishlist | Yes (local) | Yes (DB) |
| Free download | Yes | Yes |
| Paid checkout | Auth required | Lemon |
| Orders / downloads / profile | No | Yes |
| Leave review | No | Yes (owner) |
| Support chat UI | Flagged **off** | Flagged **off** |

### 4.15 Other buyer-facing pages

- `/about`, `/contact`, `/faq`
- `/privacy`, `/terms`, `/refund-policy`
- `/order-success`
- Cookie consent banner
- Global account banners (e.g. verify email, complete billing address)

---

## 5. DATABASE SCHEMA

Hand-maintained via SQL files under `supabase/`. Effective tables:

### 5.1 `profiles`
| Column | Notes |
|--------|-------|
| `id` uuid PK | → `auth.users` CASCADE |
| `name`, `avatar_url` | |
| `is_admin` bool | default false |
| `created_at` | |
| `billing_country`, `billing_zip`, `billing_address_line1`, `billing_city`, `billing_state` | |
| `name_changed_at` | name edit cooldown |

**Trigger:** `handle_new_user` on auth user insert.

### 5.2 `categories`
| Column | Notes |
|--------|-------|
| `id` uuid PK | |
| `name`, `slug` unique, `sort_order` | |
| `parent_id` | self-FK ON DELETE SET NULL |
| `image` | URL text |

### 5.3 `products`
| Column | Notes |
|--------|-------|
| `id`, `title`, `slug` unique | |
| `subtitle`, `description`, `materials` | |
| `skill_level` | check: beginner \| intermediate \| advanced |
| `price`, `compare_at_price` | numeric |
| `category_id` | → categories |
| `images` | jsonb (migrated from text[]) |
| `pdf_pages`, `pdf_filename` | |
| `lemon_product_id`, `lemon_variant_id`, `lemon_numeric_variant_id` | |
| `active`, `featured`, `sold_out` | |
| `card_badge` | null \| sale \| new \| featured |
| `checkout_mode` | overlay \| hosted |
| `is_bundle`, `bundle_includes` | text[] |
| `meta_title`, `meta_description` | |
| `wishlist_count` | trigger-maintained |
| `created_at`, `deleted_at` | soft delete |

**Indexes (documented):** `(category_id)`, `(active)`, GIN trigram on `title` (`search-products-trgm.sql`).

### 5.4 `orders`
| Column | Notes |
|--------|-------|
| `id`, `user_id` | → auth.users |
| `lemon_order_id` | unique |
| `customer_email`, `amount`, `currency` | |
| `status` | pending / paid / refunded |
| `product_ids` | uuid[] |
| `created_at` | |

### 5.5 `purchases`
| Column | Notes |
|--------|-------|
| `id`, `user_id`, `product_id` | → products |
| `order_id` | → orders; **nullable** for free downloads |
| `purchase_date` | |
| Unique `(user_id, product_id)` | |

### 5.6 `wishlist`
- PK `(user_id, product_id)`; `created_at`; cascades with product delete migrations.

### 5.7 `cart_items`
- PK `(user_id, product_id)`; `added_at`, `updated_at` (+ trigger).

### 5.8 `cart_abandoned_reminders`
- `id`, `user_id`, `sent_at`, `item_count`
- Index `(user_id, sent_at desc)`
- RLS on; **no public policies** (service role / cron only)

### 5.9 `newsletter_subscribers`
- `id`, `email` unique, `subscribed_at`
- Admin SELECT; public insert via Edge Function (service path)

### 5.10 `site_settings`
- `key` PK, `value` jsonb, `updated_at`
- Public read; admin write

### 5.11 `reviews`
(`supabase/reviews.sql`)
- FKs to product / user; rating 1–5; body length constraints
- `status` pending \| approved \| rejected
- Unique `(user_id, product_id)`
- Indexes `(product_id, status)`, `(status, created_at desc)`
- Optional `purchase_id`, moderation columns

### 5.12 `rate_limit_events`
- `id` bigserial, `key`, `created_at`
- Index `(key, created_at)`; RLS; no public policies

### 5.13 Storage

| Bucket | Access |
|--------|--------|
| `product-images` | Public read; admin write/delete |
| `patterns` | Private; admin write; authenticated select if purchase owns PDF path or admin |

### 5.14 Notable RPCs / DB functions

| Function | Purpose |
|----------|---------|
| `search_products(query, limit)` | Trigram + ILIKE search |
| `get_also_bought` | Co-purchase recommendations |
| `get_purchase_count` / `get_purchase_counts_batch` | Trust badges / best-selling |
| `product_slug_ever_existed` | Soft-deleted slug UX |
| `update_wishlist_count` | Wishlist trigger |
| `submit_review` | Buyer review submit |
| `get_product_review_stats` / `_batch` | Card/PDP ratings |
| `get_pending_review_count` | Admin badge |
| `get_abandoned_cart_candidates` | Cron email candidates |
| `cart_items_set_updated_at` | Cart timestamp trigger |

### 5.15 Relationship diagram (logical)

```
auth.users 1──1 profiles
categories 1──N products ; categories self-parent (subs)
products 1──N purchases | wishlist | cart_items | reviews
orders 1──N purchases ; orders.product_ids[] → products
reviews optional → purchases ; moderated_by → auth.users
```

---

## 6. API ROUTES

### 6.1 Next.js HTTP handlers

| Path | Method | Auth | Purpose |
|------|--------|------|---------|
| `/auth/callback` | GET | Public callback | OAuth/PKCE `exchangeCodeForSession`; safe `next` redirect |

**There is no `src/app/api/**` Route Handler tree.** Most data access is Supabase client + RLS.

**Server Action (not REST):** `revalidateStorefront` — revalidates `/`, `/shop`, `/pattern/...` after admin mutations.

### 6.2 Supabase Edge Functions

| Function | Method | Protection | Purpose |
|----------|--------|------------|---------|
| `create-cart-checkout` | POST | Origin allowlist + **JWT** | Create Lemon checkout URL for cart |
| `lemon-webhook` | POST | **HMAC** Lemon secrets | `order_created` / `order_refunded`; write orders/purchases; confirmation email |
| `admin-refund-order` | POST | Origin + **JWT + is_admin** | Lemon refund + optional revoke purchases |
| `download-free-pattern` | POST | Origin + IP rate limit; **public** | Signed PDF for `$0` products (server price check) |
| `download-order-receipt` | POST | Origin + **JWT**; ownership | Generate/download receipt PDF |
| `subscribe-newsletter` | POST | Origin + rate limit; **public** | Insert newsletter subscriber |
| `auth-rate-limit` | POST | Origin; **public** (`--no-verify-jwt` intended) | Pre-auth attempt accounting |
| `activate-email-signup` | POST | Origin; **public** (service role internally) | Confirm/activate signup session tokens |
| `abandoned-cart-reminder` | POST | **`CRON_SECRET`** Bearer/header | Send abandoned-cart emails |
| `chat-support` | POST | Origin + rate limit; optional user JWT | Groq-powered FAQ/order help |
| `chat-escalate` | POST | Origin + rate limit + honeypot; **public** | Email “talk to human” via Resend |

Shared modules: `_shared/cors.ts`, `resend.ts`, `orderConfirmationEmail.ts`, `abandonedCartEmail.ts`.

### 6.3 Public vs protected (summary)

| Public (no user JWT) | Protected |
|----------------------|-----------|
| Auth callback, newsletter subscribe, free download, auth rate limit, activate signup, chat escalate, Lemon webhook (HMAC), abandoned-cart cron (secret) | Cart checkout, order receipt, admin refund, most DB writes via user JWT + RLS, admin UI |

---

## 7. FILE / FOLDER STRUCTURE

```
nca-nextjs/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root: fonts, Providers, Lemon.js, metadata
│   │   ├── globals.css               # Design tokens + global utilities
│   │   ├── (customer)/               # Storefront shell (Header/Footer)
│   │   │   ├── page.tsx              # Home
│   │   │   ├── shop/                 # Catalog + /shop/[categorySlug]
│   │   │   ├── search/               # Search results
│   │   │   ├── pattern/[slug]/      # Product detail
│   │   │   ├── cart/                 # Cart page
│   │   │   ├── wishlist/             # Standalone wishlist
│   │   │   ├── account/              # Orders, downloads, profile, etc.
│   │   │   ├── order-success/        # Post-checkout polling page
│   │   │   └── about|contact|faq|privacy|terms|refund-policy/
│   │   ├── login|signup|reset-password/  # Auth pages (no customer chrome)
│   │   ├── auth/callback/            # OAuth code exchange Route Handler
│   │   ├── admin/                    # Admin layout + [[...slug]] catch-all
│   │   ├── sitemap.ts / robots.ts / not-found.tsx
│   │   └── icon.png / apple-icon.png
│   ├── views/                        # Page-level client UIs (Home, Shop, Account, Admin*)
│   ├── components/                   # Shared UI (Header, cards, auth, cart, filters…)
│   │   └── auth/                     # AuthModal etc.
│   ├── context/                      # Auth, Cart, Wishlist, UI, Toast
│   ├── lib/                          # Business logic, SEO, Lemon, filters, hooks
│   │   ├── data/                     # Server loaders (home, products, reviews, shop)
│   │   ├── supabase/                 # client / server / middleware / static
│   │   └── actions/                  # revalidateStorefront
│   └── types/                        # Extra TS types (if any)
├── supabase/
│   ├── functions/                    # Edge Functions (checkout, webhook, chat, …)
│   │   └── _shared/                  # CORS, Resend, email HTML
│   ├── email-templates/              # Supabase Auth email HTML
│   ├── *.sql                         # Schema + incremental migrations (manual)
│   ├── AUTH-SETUP.md / README.md
│   └── .temp/                        # Local CLI noise (do not treat as source of truth)
├── public/                           # Static assets
├── docs/                             # Ops docs (e.g. database-backups.md)
├── scripts/                          # One-off Node scripts (SEO/meta, etc.)
├── exports/                          # Generated SQL/JSON exports (local)
├── next.config.ts                    # CSP, images, redirects
├── package.json / package-lock.json
├── .env.example / .env.local         # Env templates / secrets (local)
└── PROJECT_RECAP.md                  # This document
```

### Major `src/views/` modules (one line each)

| File | Role |
|------|------|
| `Home.tsx` | Homepage sections |
| `Shop.tsx` | Catalog listing + filters/sheet |
| `Search.tsx` | Search results listing |
| `ProductDetail.tsx` | PDP |
| `Cart.tsx` | Cart page |
| `Wishlist.tsx` | Wishlist grid |
| `Account.tsx` | All account tabs |
| `OrderDetail.tsx` | Single order |
| `OrderSuccess.tsx` | Post-purchase confirmation poll |
| `AuthPage.tsx` | Full-page login/signup |
| `ResetPassword.tsx` | Recovery password form |
| `Admin.tsx` | Admin shell + products/categories/orders/subscribers/trash |
| `AdminDashboard.tsx` | Admin home stats |
| `AdminHomepage.tsx` | Homepage CMS |
| `AdminBulkUpload.tsx` | CSV/bulk import |
| `AdminReviews.tsx` | Review moderation |
| `NotFound.tsx` | 404 UI |

---

## 8. ENVIRONMENT & CONFIG

### 8.1 Environment variables (names only)

#### Documented client / Next (`.env.example`, `src/lib/env.ts`)

| Name | Purpose |
|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `NEXT_PUBLIC_LEMON_STORE_SLUG` | Lemon storefront slug |
| `NEXT_PUBLIC_LEMON_VARIANT_TEST_ID` | Test/dev Lemon variant |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics |
| `NEXT_PUBLIC_PINTEREST_TAG_ID` | Pinterest tag |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin |

#### Platform / runtime

| Name | Purpose |
|------|---------|
| `NODE_ENV` | Dev vs production behavior |
| `VERCEL_ENV` | Force canonical URL when `production` |

#### Scripts / dual naming

| Name | Purpose |
|------|---------|
| `SUPABASE_URL` | Alias for scripts / Deno |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged DB access (scripts, edge) |
| `SUPABASE_ANON_KEY` | Edge anon key |

#### Edge / secrets (Deno functions)

| Name | Purpose |
|------|---------|
| `LEMON_API_KEY` | Lemon Checkouts / refunds API |
| `LEMON_WEBHOOK_SECRET` | Test webhook HMAC |
| `LEMON_WEBHOOK_SECRET_LIVE` | Live webhook HMAC |
| `RESEND_API_KEY` | Transactional/support email |
| `GROQ_API_KEY` | Support chat LLM |
| `CRON_SECRET` | Abandoned-cart cron auth |
| `SITE_URL` | CORS / email link fallback |
| `ALLOWED_ORIGINS` | Extra CORS origins |
| `NEXT_PUBLIC_SITE_URL` | Also read in edge shared helpers |

### 8.2 Feature flags / config toggles

| Location | Flag | Effect |
|----------|------|--------|
| `src/lib/featureFlags.ts` | `ENABLE_SUPPORT_CHAT = false` | Hides floating Help chat (edge functions remain deployed) |
| Product field | `checkout_mode` `overlay` \| `hosted` | Per-product Lemon UX |
| `site_settings.announcements.enabled` | bool | Announcement bar |
| `homepage_layout[].visible` | per section | Show/hide homepage blocks |
| Product flags | `active`, `sold_out`, `featured`, `deleted_at` | Listing visibility |
| `AdminAreaGuard` | policy | Admins forced onto `/admin` |

---

## 9. KNOWN GAPS / TODOs

### 9.1 Explicit TODO / FIXME markers

Grep across `src/**` and `supabase/**/*.sql` for `\b(TODO|FIXME|HACK|XXX)\b`: **no matches**.

(`placeholder` hits are almost entirely HTML `placeholder=` attributes or UI copy, not unfinished work markers.)

### 9.2 Incomplete / stubbed / policy gaps (code-backed)

| Gap | Evidence | Impact |
|-----|----------|--------|
| Admin “views today” always 0 | `AdminDashboard.tsx` sets `viewsToday: 0` | Dashboard analytics incomplete |
| Support chat UI disabled | `ENABLE_SUPPORT_CHAT = false` | Buyers never see Help launcher; edge fns still exist |
| No Next.js `/api` layer | No `src/app/api` | All backend is Supabase; ops/security model is RLS + Edge |
| No generated DB types | No `database.types.ts` | Drift risk vs hand-written `types.ts` |
| No admin user management | No UI to list/promote users | Admins set only in Supabase Dashboard |
| Newsletter admin is export-only | No delete/unsubscribe UI | List hygiene manual |
| Manual SQL migrations | Many overlapping `supabase/*.sql` files; no formal migration runner in repo | Onboarding / apply-order discipline required (`full-setup*.sql` + later add-ons) |
| Guest checkout not supported | Cart requires auth before Lemon | Intentional; guests browse/cart only |
| Google users can’t change password in Account | Account password tab copy | Expected for OAuth accounts |
| AuthModal vs AuthSheet/AuthPage | Multiple auth UIs (`AuthModal.tsx` still present) | Potential duplication / drift |
| Local `exports/`, `scripts/`, `supabase/.temp/` | Untracked or non-runtime artifacts | Not part of production bundle; don’t commit secrets/temp |

### 9.3 Related comments (not TODOs)

- `ResetPassword.tsx` notes temporary recovery session behavior
- `Header.tsx` comments about avoiding hardcoded announcement fallback flash
- `next.config.ts` documents CSP / HSTS / Lemon+Stripe framing decisions

### 9.4 Product surface checklist (what exists today)

**Done / live-shaped:** storefront catalog, SEO category/product pages, Lemon checkout, downloads, wishlist, reviews + moderation, homepage CMS, bulk upload, refunds, newsletter capture, abandoned-cart emails, GA/Pinterest tags, Sort & Filter sheet.

**Intentionally off or thin:** support chat UI, admin page-view metrics, admin CRM/user admin, guest checkout.

---

## Appendix A — Customer routes quick index

| Route | Page |
|-------|------|
| `/` | Home |
| `/shop`, `/shop/[categorySlug]` | Catalog |
| `/search` | Search |
| `/pattern/[slug]` | PDP |
| `/cart` | Cart |
| `/wishlist` | Wishlist |
| `/order-success` | Post-checkout |
| `/account/*` | Account area |
| `/login`, `/signup`, `/reset-password` | Auth |
| `/about`, `/contact`, `/faq` | Content |
| `/privacy`, `/terms`, `/refund-policy` | Legal |
| `/admin/*` | Shop Manager |

## Appendix B — Context providers order

`Providers.tsx`: **Auth → Toast → UI → Wishlist → Cart** (+ GuestMergeRunner, PendingActionRunner, Analytics, CookieConsent).

## Appendix C — How to re-orient quickly

1. Read `src/app/globals.css` for design tokens.  
2. Trace buyer happy path: `Shop` → `ProductDetail` → `CartContext` → `create-cart-checkout` → `lemon-webhook` → Account downloads.  
3. Trace admin: `Admin.tsx` nav + `AdminHomepage` `site_settings` keys.  
4. Treat `supabase/full-setup*.sql` + later `reviews.sql` / cart / abandoned-cart SQL as schema history.  
5. Flip `ENABLE_SUPPORT_CHAT` only when chat UX is ready again.

---

*End of PROJECT_RECAP.md*
