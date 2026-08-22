-- Run this in Supabase SQL Editor.
-- Fixes: Google sign-ins were getting a blank profile name, because Google
-- populates raw_user_meta_data with given_name/family_name/full_name/name,
-- not the first_name/last_name keys our email-signup flow uses.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  full_name text;
begin
  full_name := new.raw_user_meta_data->>'full_name';
  if full_name is null then
    full_name := new.raw_user_meta_data->>'name';
  end if;

  insert into public.profiles (id, first_name, last_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'given_name',
      split_part(full_name, ' ', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'last_name',
      new.raw_user_meta_data->>'family_name',
      nullif(substring(full_name from position(' ' in full_name) + 1), '')
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- One-time backfill for accounts (like your own test account) created before this fix,
-- pulling from their Google metadata that's already stored in auth.users:
update public.profiles p
set
  first_name = coalesce(p.first_name, coalesce(u.raw_user_meta_data->>'given_name', split_part(u.raw_user_meta_data->>'full_name', ' ', 1), split_part(u.raw_user_meta_data->>'name', ' ', 1))),
  last_name = coalesce(p.last_name, coalesce(u.raw_user_meta_data->>'family_name', nullif(substring(u.raw_user_meta_data->>'full_name' from position(' ' in u.raw_user_meta_data->>'full_name') + 1), '')))
from auth.users u
where p.id = u.id and (p.first_name is null or p.last_name is null);
