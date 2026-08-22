-- The 'patterns' bucket already has policies for admin uploads, but none
-- granting read/select access — which is what createSignedUrl() needs to
-- work from the browser (the Supabase Dashboard itself bypasses RLS, which
-- is why the file is visible there but signed URLs fail on the live site).
-- The app already gates who gets shown a download link (via the purchases
-- table + auth check before calling createSignedUrl), so this just lets any
-- signed-in user's browser session actually generate the signed URL itself.

create policy "authenticated users can read patterns"
on storage.objects for select
to authenticated
using (bucket_id = 'patterns');
