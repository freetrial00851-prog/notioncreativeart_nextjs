# Supabase — notioncreativeart_nextjs

This Next.js app uses its **own** Supabase project.

| Setting | Value |
|---------|--------|
| **Project ref** | `anlsellghialszuuvipw` |
| **API URL** | `https://anlsellghialszuuvipw.supabase.co` |
| **Dashboard** | https://supabase.com/dashboard/project/anlsellghialszuuvipw |

## First-time setup (empty database)

```bash
# 1. Build the combined SQL file
node scripts/build-setup-sql.mjs

# 2. Open Supabase SQL Editor and paste supabase/full-setup.sql → Run
#    https://supabase.com/dashboard/project/anlsellghialszuuvipw/sql/new

# 3. Verify tables exist
node scripts/check-database.mjs
```

### Which SQL file to run?

| Your situation | File to run |
|----------------|-------------|
| **Empty database** / no tables yet | `full-setup.sql` |
| `full-setup.sql` failed **after** tables were created (e.g. duplicate constraint) | `full-setup-continue.sql` |

If you see **`relation "public.purchases" does not exist`**, your database is still empty — run **`full-setup.sql`**, not the continue script.

## Auth redirect URLs

See **[AUTH-SETUP.md](./AUTH-SETUP.md)** for Google OAuth (required on new projects).

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
npx supabase functions deploy lemon-webhook --project-ref anlsellghialszuuvipw --no-verify-jwt
npx supabase functions deploy create-cart-checkout --project-ref anlsellghialszuuvipw
npx supabase functions deploy subscribe-newsletter --project-ref anlsellghialszuuvipw
npx supabase functions deploy download-order-receipt --project-ref anlsellghialszuuvipw
npx supabase functions deploy chat-support --project-ref anlsellghialszuuvipw
npx supabase functions deploy chat-escalate --project-ref anlsellghialszuuvipw
```

Callback URL for Lemon Squeezy → Settings → Webhooks (Test mode):

`https://anlsellghialszuuvipw.supabase.co/functions/v1/lemon-webhook`

Subscribe to `order_created` and `order_refunded`. JWT verification is off because Lemon signs with HMAC, not a Supabase JWT.

### `lemon-webhook` secrets

```bash
npx supabase secrets set LEMON_WEBHOOK_SECRET=your_test_mode_signing_secret --project-ref anlsellghialszuuvipw
npx supabase secrets set LEMON_WEBHOOK_SECRET_LIVE=your_live_mode_signing_secret --project-ref anlsellghialszuuvipw
```

Create separate webhooks in Lemon Squeezy for **test mode** and **live mode** (same callback URL). The function accepts either signing secret. Test and live secrets are different — do not overwrite one with the other.

Paid `order_created` events also send a branded order-confirmation email via **Resend** (same project `RESEND_API_KEY` as `chat-escalate`). Email failures are logged only — they never fail the webhook or block purchase creation.

### `chat-support` secrets

```bash
npx supabase secrets set GROQ_API_KEY=your_groq_api_key --project-ref anlsellghialszuuvipw
```

Get a free key at https://console.groq.com (uses `openai/gpt-oss-20b`; `llama-3.1-8b-instant` was decommissioned 16 Aug 2026).

### `chat-escalate` secrets

```bash
npx supabase secrets set RESEND_API_KEY=your_resend_api_key --project-ref anlsellghialszuuvipw
```

Get a free key at https://resend.com. Escalations email `freetrial00851@gmail.com` via Resend (`from: onboarding@resend.dev` until a custom domain is verified).
