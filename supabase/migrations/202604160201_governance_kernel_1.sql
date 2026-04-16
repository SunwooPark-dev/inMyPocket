create table if not exists public.price_publication_snapshots (
  id uuid primary key default gen_random_uuid(),
  zip_code text not null,
  label text not null,
  review_status text not null default 'draft'
    check (review_status in ('draft', 'review_required', 'approved', 'published', 'retired', 'invalidated')),
  coverage_rate numeric(5,4) not null default 0 check (coverage_rate >= 0 and coverage_rate <= 1),
  approved_at timestamptz,
  approved_by text,
  published_at timestamptz,
  retired_at timestamptz,
  invalidated_at timestamptz,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_publication_snapshots_approval_fields_check
    check (
      (approved_at is null and approved_by is null)
      or (approved_at is not null and approved_by is not null)
    )
);

create unique index if not exists price_publication_snapshots_one_active_zip_idx
  on public.price_publication_snapshots (zip_code)
  where is_active = true and retired_at is null and invalidated_at is null;

alter table public.price_observations
  add column if not exists review_status text not null default 'draft'
    check (review_status in ('draft', 'review_required', 'approved', 'published', 'retired', 'invalidated')),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists published_at timestamptz,
  add column if not exists published_snapshot_id uuid references public.price_publication_snapshots(id) on delete set null,
  add column if not exists retired_at timestamptz,
  add column if not exists invalidated_at timestamptz;

alter table public.price_observations
  drop constraint if exists price_observations_approval_fields_check;

alter table public.price_observations
  add constraint price_observations_approval_fields_check
  check (
    (approved_at is null and approved_by is null)
    or (approved_at is not null and approved_by is not null)
  );

create index if not exists price_observations_published_snapshot_idx
  on public.price_observations (published_snapshot_id, store_id, canonical_product_id, price_type, published_at desc);

create or replace view public.published_price_observations as
with active_snapshots as (
  select
    id,
    zip_code,
    is_active,
    coverage_rate
  from public.price_publication_snapshots
  where is_active = true
    and review_status = 'published'
    and retired_at is null
    and invalidated_at is null
)
select
  observation.id,
  observation.canonical_product_id,
  observation.retailer_id,
  observation.store_id,
  observation.zip_code,
  observation.channel,
  observation.price_type,
  observation.price_amount,
  observation.measurement_value,
  observation.measurement_unit,
  observation.pack_label,
  observation.comparability_grade,
  observation.source_url,
  observation.source_label,
  observation.collected_at,
  observation.confidence,
  observation.is_estimated_weight,
  observation.is_membership_required,
  observation.is_coupon_required,
  observation.is_club_only,
  observation.review_status,
  observation.approved_at,
  observation.approved_by,
  observation.published_at,
  observation.published_snapshot_id,
  observation.retired_at,
  observation.invalidated_at,
  snapshot.is_active as snapshot_is_active,
  snapshot.coverage_rate as snapshot_coverage_rate
from public.price_observations as observation
join active_snapshots as snapshot
  on snapshot.id = observation.published_snapshot_id
 and snapshot.zip_code = observation.zip_code
where observation.review_status = 'published'
  and observation.approved_at is not null
  and observation.approved_by is not null
  and observation.published_at is not null
  and observation.retired_at is null
  and observation.invalidated_at is null
  and observation.channel <> 'store_call'
  and observation.collected_at >= now() - interval '24 hours'
  and (
    observation.channel <> 'weekly_ad'
    and observation.price_type <> 'weekly_ad'
    or observation.collected_at >= now() - interval '12 hours'
  );

revoke all on public.price_publication_snapshots from anon, authenticated;
