-- CRITICAL: the original "update own profile" policy only checked that a
-- user was updating their OWN row (auth.uid() = id) — it never restricted
-- WHICH columns they could change. Any signed-up customer could call
-- `supabase.from('profiles').update({ is_admin: true }).eq('id', <self>)`
-- from the browser and grant themselves full admin access.
--
-- This replaces it with a WITH CHECK clause that blocks is_admin from
-- being changed through this self-service path — it must stay exactly
-- what it already was. Every other profile field (name, billing address,
-- phone, etc.) is still freely self-editable as before. is_admin can still
-- be changed by you directly via Supabase Dashboard → Table Editor (which
-- uses a privileged connection that bypasses RLS entirely).

drop policy "update own profile" on public.profiles;

create policy "update own profile" on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select p.is_admin from public.profiles p where p.id = auth.uid())
  );
