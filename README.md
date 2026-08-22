# Notion Creative Art — Next.js

Professional Next.js 16 migration of the NCA crochet pattern e-commerce site. Server-rendered SEO, Supabase SSR auth, and the same stable feature set as the original Vite/React app.

## Quick start

```bash
cd nca-nextjs
cp .env.example .env.local   # fill in your Supabase + Lemon Squeezy keys
npm install
npm run dev                  # http://localhost:3000
npm run build                # production build (verified passing)
npm start                    # serve production build
```

## What changed from Vite → Next.js

| Area | Before (Vite SPA) | After (Next.js App Router) |
|------|-------------------|----------------------------|
| **SEO** | Client-side `useMeta` hook — crawlers had to run JS | Server `generateMetadata()` on every page — indexable immediately |
| **Product pages** | Client fetch only | Static pre-generation + JSON-LD Product schema |
| **Sitemap** | Build script → static XML | Dynamic `/sitemap.xml` from live Supabase data |
| **Auth** | Browser-only Supabase client | `@supabase/ssr` with middleware session refresh |
| **Routing** | react-router-dom | Next.js App Router file-based routes |
| **Preloading** | Client prefetch cache | `generateStaticParams` pre-builds all product pages |

## Project structure

```
src/
├── app/                  # Next.js routes (thin wrappers — metadata + imports)
│   ├── (customer)/       # Header/footer shell pages
│   ├── admin/            # Admin panel (no customer shell)
│   ├── login|signup/     # Auth pages (standalone layout)
│   ├── sitemap.ts        # Dynamic SEO sitemap
│   └── robots.ts         # Crawler rules
├── views/                # Page components (migrated from Vite src/pages)
├── components/           # Shared UI components
├── context/              # Auth, cart, toast, UI providers
└── lib/
    ├── seo.ts            # Metadata helpers + JSON-LD builders
    ├── data/products.ts  # Server-side Supabase queries
    └── supabase/         # client | server | static | middleware clients
supabase/                 # SQL migrations + Edge Functions (unchanged)
```

## SEO features

- **Server-rendered metadata** — title, description, canonical, Open Graph, Twitter cards on every page
- **Keyword targeting** — 18+ primary keywords in `src/lib/seo.ts` (crochet patterns, amigurumi, PDF downloads, etc.)
- **JSON-LD structured data** — Organization, WebSite (with SearchAction), Product schema on pattern pages
- **Dynamic sitemap** — all active products + categories auto-included at `/sitemap.xml`
- **robots.txt** — blocks `/account`, `/admin`, `/cart`, `/wishlist` from indexing
- **Static product pre-rendering** — every active pattern pre-built at deploy time

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_LEMON_STORE_SLUG` | Lemon Squeezy store slug |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID (optional) |
| `NEXT_PUBLIC_SITE_URL` | Production URL (default: https://notioncreativeart.com) |

## Deployment

Optimized for [Vercel](https://vercel.com). Set environment variables in the Vercel dashboard, connect the repo, and deploy. The build generates static pages for all products automatically.

For other hosts: `npm run build && npm start` (Node.js server required).

## Original source

The Vite source is preserved in `../nca-source/source/` for reference.
