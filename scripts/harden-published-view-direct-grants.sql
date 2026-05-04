-- Harden the public basket boundary.
--
-- Goal:
-- - Browser/publishable-key clients must not read governed rows directly.
-- - App-server/service-role reads must continue to work.
--
-- Run this against the linked Supabase project using the SQL editor or:
--
--   pnpm ops:harden-published-view:apply
--
-- After applying, run:
--
--   pnpm ops:harden-published-view:verify
--   pnpm smoke:local -SkipPayment
--
-- The focused verifier must prove:
-- - forbidden_direct_grant_count = 0
-- - service_role_select_grant_count = 1

begin;

do $$
begin
  if to_regclass('public.published_price_observations') is null then
    raise exception 'Missing public.published_price_observations';
  end if;
end $$;

revoke all privileges on table public.published_price_observations from anon;
revoke all privileges on table public.published_price_observations from authenticated;
revoke all privileges on table public.published_price_observations from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select on table public.published_price_observations to service_role;
  end if;
end $$;

commit;

select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'published_price_observations'
order by grantee, privilege_type;
