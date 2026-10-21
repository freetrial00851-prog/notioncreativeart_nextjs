-- Hide reviews.reviewer_email from the public API (anon + signed-in users).
-- RLS only filters ROWS, so before this the email column of every approved review could be read
-- with ...rest/v1/reviews?select=reviewer_email.
--
-- Run in the Supabase SQL editor AFTER the matching code (AdminReviews explicit columns) is deployed.
-- Safe to re-run. The storefront and admin pages only select explicit non-email columns, and
-- submit_review() is SECURITY DEFINER, so none of them are affected.

revoke select on public.reviews from anon, authenticated;

grant select (
  id, product_id, user_id, reviewer_name, rating, body,
  is_verified, purchase_id, status, created_at, moderated_at, moderated_by
) on public.reviews to anon, authenticated;

-- Check (should return an error "permission denied for table reviews" / column):
--   set role anon; select reviewer_email from public.reviews limit 1; reset role;
-- And this must still work:
--   set role anon; select id, rating, body from public.reviews where status = 'approved' limit 1; reset role;
