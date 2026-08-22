-- purchases only ever had a SELECT policy ("read own purchases") — there was
-- never an INSERT policy at all, so the free-pattern direct-download flow's
-- client-side upsert into purchases was silently blocked by RLS from the
-- start (the upsert call doesn't check for errors, so this went unnoticed).
-- The old, overly-broad storage policy masked the symptom by letting
-- signed URLs succeed regardless; the new ownership-checking storage policy
-- correctly exposed it, since no real purchases row ever existed.
--
-- This lets a signed-in user insert a purchases row for themselves — but
-- ONLY when the target product is actually free (price = 0), so this can't
-- be used to "claim" a paid pattern without going through checkout. Paid
-- purchases are still created exclusively by the lemon-webhook Edge
-- Function, which uses the service-role key and bypasses RLS entirely —
-- this policy has no effect on that path.

create policy "users can claim free patterns"
on public.purchases for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.products
    where products.id = purchases.product_id
    and products.price = 0
  )
);
