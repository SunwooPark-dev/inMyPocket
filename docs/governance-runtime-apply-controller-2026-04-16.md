# Governance Runtime/Apply Controller — 2026-04-16

## Executive verdict

Status: conditionally on-track, but still blocked for real database rollout.

Three-pass conclusion:

1. Apply path looked merely "not yet verified."
2. Cross-check showed the hosted project is linked, but Governance Kernel 1 is not actually applied there yet.
3. Runtime cross-check then exposed a fail-open risk on homepage/printable when no governed publishable summaries existed; that gap is now tightened in app code and re-verified by tests/build.

Net result:
- implementation safety improved: homepage/printable now fail closed on empty governed publishable data
- deployment status still blocked: hosted Supabase schema is behind the repo migration
- seed status still blocked: `supabase/seed.sql` is not governance-ready for ZIP `30328`

## Harness lanes and integrated verdict

### Lane A — operator/apply
Verdict: blocked for execution in this environment, but apply target is clear.

Evidence:
- repo is linked to hosted Supabase project `ndifsahnedlokhfvohcl` (`dev-launchpad`)
- `.env.local` points to `https://ndifsahnedlokhfvohcl.supabase.co`
- hosted REST checks show Governance Kernel 1 is not applied yet:
  - `price_publication_snapshots` table missing
  - `published_price_observations.published_snapshot_id` missing
- `supabase` CLI is not installed in PATH
- `psql` is not installed in PATH
- repo is migration-driven, so direct SQL is not the preferred path

Canonical apply verdict:
- local apply: blocked here
- hosted apply via Supabase migration tooling: intended safest path once CLI is available
- direct SQL: not recommended except explicit operator decision outside normal migration flow

Smallest next executable step:
- install or expose Supabase CLI in PATH, then run the hosted migration apply for linked project `ndifsahnedlokhfvohcl`

### Lane B — data/seed
Verdict: current seed is not governance-ready.

Evidence:
- `supabase/seed.sql` has no `price_publication_snapshots` insert
- `supabase/seed.sql` does not set governance fields on `price_observations`
- `supabase/seed.sql` does not contain ZIP `30328`
- app governance path requires:
  - active published snapshot
  - `coverage_rate >= 0.8`
  - published observations linked by `published_snapshot_id`
  - approved/published metadata present
  - fresh rows only

Minimal 30328 governance seed contract:
- one row in `public.price_publication_snapshots`
  - `zip_code='30328'`
  - `review_status='published'`
  - `is_active=true`
  - `coverage_rate>=0.8`
  - not retired/invalidated
- one or more rows in `public.price_observations`
  - `zip_code='30328'`
  - `review_status='published'`
  - `approved_at` + `approved_by` present
  - `published_at` present
  - `published_snapshot_id` points to snapshot row
  - not retired/invalidated
  - not `store_call`
  - freshness satisfies governance TTL

### Lane C — runtime/public surface
Verdict: runtime now fails closed correctly when no publishable governed summaries exist.

Evidence:
- homepage and printable both source `getPublicEffectiveObservations()`
- governed public observations come from `published_price_observations` + selector gating
- compare layer now uses `getPublishableBasketSummaries()` for page-level summary selection
- `getPublishableBasketSummaries()` filters to `publishReady && comparableCount > 0`
- homepage and printable both return explicit fallback shells if no cheapest publishable summary exists
- targeted RED→GREEN test added to verify empty and under-threshold summary cases
- regression verification passed:
  - `node --test --experimental-strip-types tests/normalization.test.ts`
  - `node --test --experimental-strip-types tests/publication-governance-lane-a.test.ts`
  - `pnpm test`
  - `pnpm build`

Remaining runtime proof gap:
- recorded smoke evidence proves route availability and UI capture, but does not yet prove the explicit no-publishable-governed-summary empty-state branch end-to-end against a migrated DB state

## What changed in this cycle

### Runtime hardening
- added `getPublishableBasketSummaries()` in `src/lib/compare.ts`
- homepage switched from raw `buildBasketSummary(...)` to governed publishable summaries
- printable switched from raw `buildBasketSummary(...)` to governed publishable summaries
- added tests asserting fail-closed behavior for:
  - empty governed public observations
  - below-threshold publication coverage / non-publishable summaries

### Verification
- RED proof captured first:
  - missing export failure in `tests/normalization.test.ts`
- then GREEN after implementation:
  - `pnpm test`: 60/60 pass
  - `pnpm build`: pass

## Updated canonical sequence

Engineering sequence:
1. Apply Governance Kernel 1 to hosted Supabase through normal migration tooling
2. Add governance-aware 30328 snapshot seed path
3. Run governed runtime smoke against homepage + printable with migrated schema/data
4. Then move to Demand Harness 1

Learning/product sequence:
1. Demand Harness 1 remains the next learning lane
2. But it stays behind governance apply/seed/runtime proof for implementation ordering

## Immediate next actions

1. Unblock operator tooling
   - install/expose Supabase CLI in PATH
2. Apply migration to linked hosted project
   - confirm `price_publication_snapshots` exists
   - confirm `published_price_observations` exposes governance columns
3. Create minimal 30328 governed seed path
   - snapshot row
   - linked published observations
4. Re-run smoke with governed data presence and governed-empty-state checks
5. Only after that, proceed to homepage demand bridge work

## Non-goals for this slice
- Stripe/payment reactivation
- geography expansion
- public UX polish unrelated to governed publication safety
