do $$
declare
  forbidden_direct_grant_count integer;
  service_role_select_grant_count integer;
begin
  if to_regclass('public.published_price_observations') is null then
    raise exception 'Missing public.published_price_observations';
  end if;

  select count(*)
  into forbidden_direct_grant_count
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'published_price_observations'
    and grantee in ('anon', 'authenticated', 'public');

  if forbidden_direct_grant_count <> 0 then
    raise exception 'forbidden_direct_grant_count = %, expected 0', forbidden_direct_grant_count;
  end if;

  select count(*)
  into service_role_select_grant_count
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'published_price_observations'
    and grantee = 'service_role'
    and privilege_type = 'SELECT';

  if service_role_select_grant_count <> 1 then
    raise exception 'service_role_select_grant_count = %, expected 1', service_role_select_grant_count;
  end if;
end $$;
