# Auth setup — Google sign-in (project `anlsellghialszuuvipw`)

The error **"Unsupported provider: provider is not enabled"** means Google OAuth is
**not turned on** in this Supabase project yet. The app code is fine — enable it in the
dashboard (5 minutes).

## 1. Enable Google in Supabase

1. Open [Authentication → Providers → Google](https://supabase.com/dashboard/project/anlsellghialszuuvipw/auth/providers?provider=Google)
2. Turn **Enable Sign in with Google** ON
3. Paste your **Client ID** and **Client Secret** from Google Cloud Console (see step 2)
4. Save

### Copy credentials from your old project (easiest)

If Google already works on **notioncreativeart.com** / project `npkqvhdsyyxphcinhcej`:

1. Open the **old** project → Authentication → Providers → Google
2. Copy **Client ID** and **Client Secret**
3. Paste them into the **new** project (`anlsellghialszuuvipw`) → Save

You can reuse the same Google OAuth app — just add the new callback URL (step 2).

---

## 2. Google Cloud Console

1. [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Open your OAuth 2.0 Client ID (Web application)
3. Under **Authorized redirect URIs**, add:

```
https://anlsellghialszuuvipw.supabase.co/auth/v1/callback
```

Keep any existing URIs (e.g. old Supabase project callback). Save.

---

## 3. Supabase URL configuration

[Authentication → URL Configuration](https://supabase.com/dashboard/project/anlsellghialszuuvipw/auth/url-configuration)

| Field | Value |
|-------|--------|
| **Site URL** | `https://notioncreativeartnextjs.vercel.app` |

**Redirect URLs** (add all, then Save):

```
http://localhost:3000/**
http://localhost:3001/**
https://notioncreativeartnextjs.vercel.app/**
https://notioncreativeart.com/**
```

The app uses `/auth/callback` after Google sign-in; wildcards above cover it.

---

## 4. Test

1. Incognito → https://notioncreativeartnextjs.vercel.app/signup
2. **Continue with Google** → pick account → should land on `/account`
3. Local: `npm run dev` → http://localhost:3000/signup (same flow)

---

## Email sign-up / password reset

Same **Site URL** and **Redirect URLs** apply to verification and reset emails.
No extra code changes needed.

### Branded "Confirm signup" email template

1. Open [Authentication → Email Templates → Confirm signup](https://supabase.com/dashboard/project/anlsellghialszuuvipw/auth/templates)
2. **Subject:** `Confirm your Notion Creative Art account`
3. **Body:** paste the HTML from [`email-templates/confirm-signup.html`](./email-templates/confirm-signup.html) (uses `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`)
4. Save

Matches order-confirmation branding: navy `#243B5A`, sage `#6F8760`, Playfair Display + Manrope, with a proper **Confirm Email Address** button.

### Password requirements (client + server)

The app only **requires** 8+ characters and at least one digit. Uppercase, lowercase, and symbols are optional (shown as strength hints in the UI).

Supabase Auth can enforce stricter rules **server-side** even when the client allows a password. If sign-up fails with a weak-password error for passwords like `pattern8`, relax the project setting:

1. Open [Authentication → Sign In / Up → Email → Password Requirements](https://supabase.com/dashboard/project/anlsellghialszuuvipw/auth/providers?provider=Email)
2. Set **Minimum password length** to `8`
3. Set **Required characters** to **Digits only** (or **No required characters** if you only want the 8-char minimum enforced by Supabase)
4. Save

Without this dashboard change, Supabase may still reject passwords missing uppercase/lowercase/symbols regardless of client validation.


1. Open [Authentication → Email Templates → Reset password](https://supabase.com/dashboard/project/anlsellghialszuuvipw/auth/templates)
2. **Subject:** `Reset your Notion Creative Art password`
3. **Body:** paste the HTML from [`email-templates/reset-password.html`](./email-templates/reset-password.html) (uses `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`)
4. Save

Same layout and branding as confirm-signup, with a **Reset Password** button.
