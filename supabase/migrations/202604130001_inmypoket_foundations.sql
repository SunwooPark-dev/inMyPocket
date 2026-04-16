create extension if not exists pgcrypto;

create table if not exists public.observation_evidence (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  original_name text not null,
  content_type text not null,
  byte_size bigint not null check (byte_size > 0),
  uploaded_at timestamptz not null default now()
);

create table if not exists public.price_observations (
  id uuid primary key default gen_random_uuid(),
  canonical_product_id text not null,
  retailer_id text not null,
  store_id text not null,
  zip_code text not null,
  channel text not null,
  price_type text not null,
  price_amount numeric(10,2) not null check (price_amount > 0),
  measurement_value numeric(10,2) not null check (measurement_value > 0),
  measurement_unit text not null,
  pack_label text not null,
  comparability_grade text not null,
  source_url text not null,
  source_label text not null,
  collected_at timestamptz not null,
  confidence text not null,
  notes text,
  is_estimated_weight boolean not null default false,
  is_membership_required boolean not null default false,
  is_coupon_required boolean not null default false,
  is_club_only boolean not null default false,
  evidence_id uuid references public.observation_evidence(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists price_observations_store_item_price_type_idx
  on public.price_observations (store_id, canonical_product_id, price_type, collected_at desc);

create table if not exists public.founding_member_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  zip_code text not null,
  plan_code text not null,
  status text not null default 'pending_checkout',
  stripe_customer_id text,
  stripe_checkout_session_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists founding_member_signups_email_idx
  on public.founding_member_signups (email, created_at desc);

alter table public.observation_evidence enable row level security;
alter table public.price_observations enable row level security;
alter table public.founding_member_signups enable row level security;

revoke all on public.observation_evidence from anon, authenticated;
revoke all on public.price_observations from anon, authenticated;
revoke all on public.founding_member_signups from anon, authenticated;

drop policy if exists "deny anon authenticated observation evidence" on public.observation_evidence;
create policy "deny anon authenticated observation evidence"
on public.observation_evidence
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny anon authenticated price observations" on public.price_observations;
create policy "deny anon authenticated price observations"
on public.price_observations
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "deny anon authenticated founding member signups" on public.founding_member_signups;
create policy "deny anon authenticated founding member signups"
on public.founding_member_signups
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

create or replace view public.published_price_observations as
select
  id,
  canonical_product_id,
  retailer_id,
  store_id,
  zip_code,
  channel,
  price_type,
  price_amount,
  measurement_value,
  measurement_unit,
  pack_label,
  comparability_grade,
  source_url,
  source_label,
  collected_at,
  confidence,
  is_estimated_weight,
  is_membership_required,
  is_coupon_required,
  is_club_only
from public.price_observations;

revoke all on public.published_price_observations from anon, authenticated;
grant select on public.published_price_observations to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('observation-evidence', 'observation-evidence', false)
on conflict (id) do nothing;

drop policy if exists "deny anon authenticated observation evidence bucket" on storage.objects;
create policy "deny anon authenticated observation evidence bucket"
on storage.objects
as restrictive
for all
to anon, authenticated
using (bucket_id <> 'observation-evidence')
with check (bucket_id <> 'observation-evidence');
