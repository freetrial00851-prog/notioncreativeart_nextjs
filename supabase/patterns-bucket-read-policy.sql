-- DEPRECATED: do not run this file on new projects.
-- The open "authenticated users can read patterns" policy let ANY signed-in
-- user mint a signed URL for ANY PDF. Use patterns-bucket-read-policy-v2-secure.sql
-- instead (also inlined in full-setup.sql / storage-setup.sql).
--
-- This file now applies the secure policy so accidental runs are safe.

drop policy if exists "authenticated users can read patterns" on storage.objects;
drop policy if exists "owner read purchased pattern" on storage.objects;
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
