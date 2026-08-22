# Supabase — notioncreativeart_nextjs

This Next.js app connects to the **Notion Creative Art** Supabase backend.

| Setting | Value |
|---------|--------|
| Project name | `notioncreativeart_nextjs` |
| Project ref | `npkqvhdsyyxphcinhcej` |
| API URL | `https://npkqvhdsyyxphcinhcej.supabase.co` |

## Environment variables (Vercel + local)

Set these in `.env.local` (local) and Vercel Project Settings → Environment Variables (production):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_LEMON_STORE_SLUG`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_SITE_URL`

## Auth redirect URLs

In Supabase Dashboard → Authentication → URL Configuration, add:

- `https://notioncreativeart.com/**`
- `https://<your-vercel-url>.vercel.app/**`
- `http://localhost:3000/**`

## Edge Functions

SQL migrations and Edge Functions live in `supabase/`. Deploy functions separately via Supabase CLI when needed.
