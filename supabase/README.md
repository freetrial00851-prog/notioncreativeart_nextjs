# Supabase — notioncreativeart_nextjs (INDEPENDENT PROJECT)

This Next.js app uses its **own** Supabase project — completely separate from the old Vite/React database.

| Setting | Value |
|---------|--------|
| **Project name** | `notioncreativeart_nextjs` |
| **Project ref** | `pxfzolhemduyfqpziauo` |
| **API URL** | `https://pxfzolhemduyfqpziauo.supabase.co` |
| **Dashboard** | https://supabase.com/dashboard/project/pxfzolhemduyfqpziauo |

## First-time setup (empty database)

```bash
# 1. Build the combined SQL file
node scripts/build-setup-sql.mjs

# 2. Open Supabase SQL Editor and paste supabase/full-setup.sql → Run
#    https://supabase.com/dashboard/project/pxfzolhemduyfqpziauo/sql/new

# 3. Verify tables exist
node scripts/check-database.mjs
```

## Auth redirect URLs

In **Authentication → URL Configuration**, add:

- `http://localhost:3000/**`
- `https://notioncreativeartnextjs.vercel.app/**`
- `https://notioncreativeart.com/**` (when custom domain is connected)

## Make yourself admin

After signing up once:

```sql
update public.profiles set is_admin = true
where id = (select id from auth.users where email = 'your@email.com');
```

## Edge Functions

Deploy separately when needed:

```bash
npx supabase functions deploy lemon-webhook --project-ref pxfzolhemduyfqpziauo
npx supabase functions deploy create-cart-checkout --project-ref pxfzolhemduyfqpziauo
npx supabase functions deploy subscribe-newsletter --project-ref pxfzolhemduyfqpziauo
```
