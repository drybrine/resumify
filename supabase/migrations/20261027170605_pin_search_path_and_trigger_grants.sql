
-- Pin search_path on the remaining helper, and stop trigger-only functions from
-- being callable as RPCs (they are trigger functions, but the advisor flags the grant).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.protect_profile_fields() from public, anon, authenticated;
revoke all on function public.enforce_cv_limit() from public, anon, authenticated;
revoke all on function public.enforce_cv_share_entitlement() from public, anon, authenticated;
