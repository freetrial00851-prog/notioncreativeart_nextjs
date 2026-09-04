-- CRITICAL: stop anon/authenticated from calling get_abandoned_cart_candidates.
-- This SECURITY DEFINER RPC returns customer emails. Intent: service_role only.
-- Run immediately in Supabase SQL Editor.

revoke all on function public.get_abandoned_cart_candidates() from public;
revoke execute on function public.get_abandoned_cart_candidates() from anon;
revoke execute on function public.get_abandoned_cart_candidates() from authenticated;

grant execute on function public.get_abandoned_cart_candidates() to service_role;
