# Governance Runtime/Apply Controller — 2026-04-16

## Executive verdict

Status: on-track. Hosted governance rollout proof is now closed for the current `30328` governed slice.

Three-pass conclusion:

1. Apply path first looked merely "not yet verified."
2. Cross-check then confirmed the hosted project was linked and wrapper-backed Supabase CLI execution was workable.
3. Hosted migration + hosted seed were actually applied, a hosted seed drift was then found and repaired for ZIP `30328`, and env-loaded runtime proof now shows both governed populated and governed empty-state branches.

Net result:
- implementation safety improved: homepage/printable fail closed on empty governed publishable data
- hosted migration status: applied
- hosted governed seed status: corrected to a runtime-valid `30328` Kroger regular basket with 16 published rows linked to snapshot `30328000-0000-0000-0000-000000000001`
- runtime proof status: env-loaded server-component render now proves both populated `30328` and empty `30022` governed branches

## Harness lanes and integrated verdict

### Lane A — operator/apply
Verdict: hosted rollout is no longer blocked. The wrapper-backed CLI path was used successfully, and the hosted governance slice for `30328` was then repaired to match the repo seed contract.

Evidence:
- repo is linked to hosted Supabase project `ndifsahnedlokhfvohcl` (`dev-launchpad`)
- `.env.local` points to `https://ndifsahnedlokhfvohcl.supabase.co`
- hosted migration apply succeeded through the wrapper-backed CLI path
- hosted schema/view verification succeeded after apply
- `supabase` CLI is not installed in PATH
- wrapper-backed CLI execution works in this WSL environment:
  - `pnpm dlx supabase@latest --version` => `2.92.0`
  - `node scripts/run-powershell-script.mjs ./scripts/supabase-cli.ps1 --version` => `2.92.0`
- `psql` is not installed in PATH
- repo is migration-driven, so direct SQL is not the preferred path

Canonical apply verdict:
- local apply via global PATH install: unnecessary
- hosted apply via Supabase migration tooling: executed successfully
- direct table repair: used only narrowly for the hosted `30328` governed slice after seed drift was detected (`deletedCount=1`, `insertedCount=16`, `verifiedCount=16`)

Smallest next executable step:
- move from governance rollout proof closure to Demand Harness 1, while keeping the current governed proof artifacts available for re-checks

### Lane B — data/seed
Verdict: repo seed is governance-ready and the hosted `30328` governed data path is now aligned with it.

Evidence:
- `supabase/seed.sql` now inserts a deterministic `price_publication_snapshots` row for ZIP `30328`
- `supabase/seed.sql` now links a governed published observation to that snapshot via `published_snapshot_id`
- `supabase/seed.sql` now sets the required governance fields on `price_observations`
- `tests/governance-seed-30328-contract.test.ts` now enforces both the deterministic snapshot contract and the runtime-valid basket-density contract
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
- at least sixteen `kroger-30328` `product_page` `regular` rows in `public.price_observations`
  - `zip_code='30328'`
  - `review_status='published'`
  - `approved_at` + `approved_by` present
  - `published_at` present
  - `published_snapshot_id` points to snapshot row
  - not retired/invalidated
  - not `store_call`
  - freshness satisfies governance TTL

### Lane C — runtime/public surface
Verdict: runtime now proves both governed populated and governed empty-state behavior under env-loaded hosted data.

Evidence:
- homepage and printable both source `getPublicEffectiveObservations()`
- governed public observations come from `published_price_observations` + selector gating
- compare layer now uses `getPublishableBasketSummaries()` for page-level summary selection
- `getPublishableBasketSummaries()` filters to `publishReady && comparableCount > 0`
- homepage and printable both contain explicit governed empty-state branches if no cheapest publishable summary exists
- targeted RED→GREEN test added to verify empty and under-threshold summary cases
- local smoke now proves public route reachability plus streamed loading-shell copy:
  - `GET /` streamed loading shell copy
  - `GET /printable` streamed loading shell headline
- env-loaded server-component render against hosted data confirms:
  - populated `30328` branch on homepage + printable (`hasEmpty=false`, `hasKroger=true`, `hasBananas=true`)
  - empty `30022` branch on homepage + printable (`hasEmpty=true` with the expected CTA/helper copy)
- regression verification passed:
  - `node --test --experimental-strip-types tests/normalization.test.ts`
  - `node --test --experimental-strip-types tests/publication-governance-lane-a.test.ts`
  - `pnpm test`
  - `pnpm build`

Remaining runtime proof gap:
- no blocking gap remains for the current governance slice; future changes should preserve both the env-loaded populated and env-loaded empty-state runtime proofs

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
1. Governance Kernel 1 hosted apply is complete
2. Hosted schema/view proof is complete
3. Hosted `30328` governed seed path is complete
4. Governed runtime proof for populated and empty-state branches is complete
5. Next implementation slice is Demand Harness 1

Learning/product sequence:
1. Demand Harness 1 remains the next learning lane
2. But it stays behind governance apply/seed/runtime proof for implementation ordering

## Immediate next actions

1. Refresh ops/controller docs with the hosted proof results from this cycle
2. Preserve the hosted `30328` governed slice as the canonical populated runtime fixture
3. Start Demand Harness 1 implementation

## Non-goals for this slice
- Stripe/payment reactivation
- geography expansion
- public UX polish unrelated to governed publication safety
