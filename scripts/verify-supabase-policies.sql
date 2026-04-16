select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'price_observations',
    'observation_evidence',
    'founding_member_signups'
  )
order by schemaname, tablename, policyname;

select
  table_schema,
  table_name
from information_schema.views
where table_schema = 'public'
  and table_name = 'published_price_observations';

select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'published_price_observations'
order by grantee, privilege_type;

select
  id,
  name,
  public
from storage.buckets
where id = 'observation-evidence';

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
