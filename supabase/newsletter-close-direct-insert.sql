-- Newsletter signups now go through the 'subscribe-newsletter' Edge
-- Function, which enforces real server-side rate limiting before inserting.
-- The old "public can subscribe" policy let ANY client insert directly via
-- the Supabase REST API, completely bypassing that rate limit — a spam
-- script could just skip the Edge Function and hit the table directly.
--
-- This removes that open policy. The Edge Function still works because it
-- uses the service-role key, which bypasses RLS entirely. Admin read access
-- is untouched.

drop policy if exists "public can subscribe" on public.newsletter_subscribers;
