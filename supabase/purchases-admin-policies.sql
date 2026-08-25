-- Admin Orders UI: ACCESS REVOKED is inferred from missing purchases rows.
-- Without these policies, admins only see their own purchases (read own purchases),
-- so every other customer's order falsely shows ACCESS REVOKED.
-- REVOKE ACCESS deletes purchases by order_id from the browser client — needs DELETE.

drop policy if exists "admin read all purchases" on public.purchases;
create policy "admin read all purchases" on public.purchases
  for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

drop policy if exists "admin delete purchases" on public.purchases;
create policy "admin delete purchases" on public.purchases
  for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
