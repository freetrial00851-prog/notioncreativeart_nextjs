-- Storefront page views for Shop Manager stats (Views on the admin dashboard).
-- Run manually in Supabase SQL Editor on project anlsellghialszuuvipw:
--   https://supabase.com/dashboard/project/anlsellghialszuuvipw/sql/new
--
-- First-party visit counts for the selected dashboard date range (today / 7d / 30d).
-- Not a Google Analytics integration.

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  created_at timestamptz not null default now(),
  constraint page_views_path_format check (
    char_length(path) between 1 and 512
    and path like '/%'
  )
);

create index if not exists page_views_created_at_idx
  on public.page_views (created_at desc);

alter table public.page_views enable row level security;

-- Clients cannot backdate rows (would inflate historical dashboard stats).
create or replace function public.page_views_stamp_created_at()
returns trigger
language plpgsql
as $$
begin
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists page_views_stamp_created_at on public.page_views;
create trigger page_views_stamp_created_at
  before insert on public.page_views
  for each row
  execute function public.page_views_stamp_created_at();

-- Guests and signed-in shoppers can record a storefront view.
-- Admin paths are rejected even if a client tries to insert them.
drop policy if exists "storefront insert page views" on public.page_views;
create policy "storefront insert page views"
  on public.page_views for insert
  to anon, authenticated
  with check (
    char_length(path) between 1 and 512
    and path like '/%'
    and path <> '/admin'
    and path not like '/admin/%'
  );

-- Raw analytics are not publicly readable. Admins can count/list rows.
drop policy if exists "admin read page views" on public.page_views;
create policy "admin read page views"
  on public.page_views for select
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- Precise table grants: guests may insert, only signed-in admins can read
-- (RLS still applies). Revoke leftover defaults so anon cannot SELECT.
revoke all on table public.page_views from anon;
revoke all on table public.page_views from authenticated;
grant insert on table public.page_views to anon, authenticated;
grant select on table public.page_views to authenticated;
grant all on table public.page_views to service_role;

notify pgrst, 'reload schema';
