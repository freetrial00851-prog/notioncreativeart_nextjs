-- Contact form inbox — Edge Function `contact-message` inserts rows (service
-- role) and emails CONTACT_NOTIFY_EMAIL via Resend.
--
-- RLS is enabled with NO policies: anon, authenticated, and the browser
-- client cannot read or write. Only the service-role key (Edge Functions)
-- bypasses RLS. Do not add a public INSERT policy — that would skip the
-- origin check, honeypot, and rate limit.
--
-- NOT applied automatically. Review this file, then run it in the SQL
-- Editor only after the owner approves.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  order_number text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

revoke all on table public.contact_messages from anon, authenticated;

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);
