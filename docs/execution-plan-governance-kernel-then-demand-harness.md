# inMyPoket Execution Plan — Governance Kernel 1 then Demand Harness 1

Source of truth:
- `docs/harness-controller-validated-next-step-2026-04-16.md`
- `docs/publication-governance-spec-1.md`

## A. Governance Kernel 1

### A1. Schema lane
Files:
- `supabase/migrations/202604130001_inmypoket_foundations.sql` or follow-up migration

Tasks:
- add lifecycle/review metadata fields
- add minimal snapshot model for ZIP publication
- add retirement/invalidation metadata
- preserve existing public/private deny boundary

Acceptance gate:
- schema can represent `draft`, `review_required`, `approved`, `published`, `retired`, `invalidated`
- schema can identify one active snapshot per ZIP

### A2. Public-read lane
Files:
- `src/lib/observation-repository.ts`
- `src/lib/observation-feed.ts`

Tasks:
- rebuild public-read semantics around governed published rows only
- remove unsafe “newest row wins” behavior for public path
- exclude stale/store_call/invalidated/retired rows from public output

Acceptance gate:
- public path no longer exposes pass-through rows from base table semantics
- older approved public row is not shadowed by newer unapproved row

### A3. Test lane
Files:
- add targeted tests under `tests/`

Tasks:
- add publication state-machine/public-eligibility tests
- cover stale exclusion, invalidation exclusion, active snapshot behavior

Acceptance gate:
- tests fail before implementation and pass after implementation
- `pnpm test` remains green

## B. Demand Harness 1

Precondition:
- Governance Kernel 1 merged or at minimum verified locally as the active branch baseline

### B1. Homepage bridge lane
Files:
- `src/app/page.tsx`
- `src/components/waitlist-form.tsx`

Tasks:
- place weekly-updates bridge immediately after the decision card
- make CTA/copy non-payment-safe when checkout is disabled
- add one caregiver-oriented copy variant

Acceptance gate:
- CTA visible within one scroll after answer block
- copy does not imply checkout when Stripe is unavailable
- existing form remains functional

### B2. Measurement lane
Files:
- existing waitlist event helpers or new analytics helper files

Tasks:
- define minimal events: page view, CTA view, CTA click, submit attempt, submit success, submit failure, caregiver variant seen
- keep event names stable and documentation-backed

Acceptance gate:
- event contract documented
- no dead analytics calls in runtime

### B3. Documentation alignment lane
Files:
- `docs/product-harness-status.md`
- `docs/release-readiness-checklist.md`
- `docs/accepted-risks.md`
- possibly `README.md`

Tasks:
- align docs with live non-payment waitlist behavior
- align smoke expectations with current route behavior
- record caregiver copy and CTA placement change if implemented

Acceptance gate:
- no doc claims conflict with `/api/waitlist`
- release docs point to the current runtime truth

## C. Verification sequence

Run in this order:
1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`
4. targeted new governance tests
5. `pnpm build`
6. `pnpm smoke:local -SkipPayment` when env allows

## D. Stop conditions

Stop and re-plan if:
- governed publication semantics require a larger schema split than expected
- active snapshot modeling breaks existing public reads in a way not covered by tests
- demand bridge UI conflicts with the answer-first mobile layout

## E. Explicit non-goals for this cycle

- payment reactivation
- geography/store expansion
- cosmetic homepage polish unrelated to answer->signup conversion
- adding more public data surfaces before governance kernel is in place
