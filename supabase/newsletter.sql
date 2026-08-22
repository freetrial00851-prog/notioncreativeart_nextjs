-- Run this in Supabase SQL Editor

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

-- Anyone (even signed-out visitors) can subscribe
create policy "public can subscribe" on public.newsletter_subscribers for insert
  with check (true);

-- Only admins can view the list
create policy "admin read subscribers" on public.newsletter_subscribers for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
