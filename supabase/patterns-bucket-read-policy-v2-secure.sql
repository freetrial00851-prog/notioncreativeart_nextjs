-- The previous policy (patterns-bucket-read-policy.sql) let ANY signed-in
-- user generate a signed URL for ANY file in the 'patterns' bucket — the
-- app's own UI only showed download links to people who'd actually bought
-- (or claimed, for free items) the pattern, but that check lived only in
-- the browser, not in the database. Anyone could open dev tools and call
-- createSignedUrl() directly with a product id they never purchased.
--
-- This replaces it with a real ownership check: a signed URL for
-- "<product_id>.pdf" only succeeds if the requesting user has a matching
-- row in purchases, or is an admin (needed for the admin "Test download"
-- button, which checks arbitrary products regardless of purchase history).

drop policy if exists "authenticated users can read patterns" on storage.objects;
drop policy if exists "read own purchased patterns or admin" on storage.objects;

create policy "read own purchased patterns or admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'patterns'
  and (
    exists (
      select 1 from public.purchases
      where purchases.user_id = auth.uid()
      and purchases.product_id = (regexp_replace(storage.objects.name, '\.pdf$', ''))::uuid
    )
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  )
);
