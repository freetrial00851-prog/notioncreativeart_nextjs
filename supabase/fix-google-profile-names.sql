-- Run this in Supabase SQL Editor.
-- Fixes: Google sign-ins were getting a blank profile name, because Google
-- populates raw_user_meta_data with given_name/family_name/full_name/name,
-- not always the single `name` key our email-signup flow uses.
--
-- Resolves one display `name` from (in order): metadata name, full_name,
-- given_name + family_name, first_name + last_name.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  full_name text;
  resolved_name text;
begin
  full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name'
  );

  resolved_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(full_name), ''),
    nullif(trim(concat_ws(' ',
      new.raw_user_meta_data->>'given_name',
      new.raw_user_meta_data->>'family_name'
    )), ''),
    nullif(trim(concat_ws(' ',
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'last_name'
    )), '')
  );

  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    resolved_name,
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$ language plpgsql security definer;

-- One-time backfill for accounts created before this fix,
-- pulling from Google/email metadata already stored in auth.users:
update public.profiles p
set name = coalesce(
  nullif(trim(p.name), ''),
  nullif(trim(u.raw_user_meta_data->>'name'), ''),
  nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
  nullif(trim(concat_ws(' ',
    u.raw_user_meta_data->>'given_name',
    u.raw_user_meta_data->>'family_name'
  )), ''),
  nullif(trim(concat_ws(' ',
    u.raw_user_meta_data->>'first_name',
    u.raw_user_meta_data->>'last_name'
  )), '')
)
from auth.users u
where p.id = u.id and (p.name is null or trim(p.name) = '');
