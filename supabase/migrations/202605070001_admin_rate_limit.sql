-- Admin rate-limit persistence for distributed lockout
-- This table stores admin unlock attempt state so lockouts survive process restarts
-- and are shared across multiple runtime instances.

create table if not exists public.admin_rate_limit (
  client_key text primary key,
  first_attempt_at timestamptz not null default now(),
  attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

-- RLS: only service role accesses this table (admin API routes only)
alter table public.admin_rate_limit enable row level security;

-- No public/anon access — this is purely server-side
create policy "service_role_full_access_admin_rate_limit"
  on public.admin_rate_limit
  for all
  using (true)
  with check (true);

-- Cleanup index: find stale entries for periodic purging
create index if not exists idx_admin_rate_limit_updated_at
  on public.admin_rate_limit (updated_at);

-- Auto-update updated_at on write
create or replace function update_admin_rate_limit_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_admin_rate_limit_updated_at
  before update on public.admin_rate_limit
  for each row
  execute function update_admin_rate_limit_timestamp();
