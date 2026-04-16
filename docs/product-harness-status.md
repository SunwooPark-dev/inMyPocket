# Product Harness Status

## Summary

This document captures the current product harness state for `inMyPoket` across four buckets:

1. public UX
2. operations proof
3. payment
4. release readiness

The active product milestone is a long-horizon roadmap state, not a one-shot launch push.

Last refreshed: 2026-04-16

## 1. Public UX

### Status

- Stable for the current public milestone
- Senior-first public experience is now summary-first on `/`
- Printable view is now decision-first and reads more like a shopping helper than a technical export

### Current evidence

- Mobile-first hero and decision card are the first visible blocks on `/`
- Public controls are collapsed by default and no longer compete with the top answer
- Store comparison is one-column on mobile
- Compare and printable routes now preserve all supported non-payment price scenarios
- Weekly updates form now supports both self-serve and caregiver-oriented copy in the non-payment lane
- Printable page communicates the shopping decision in the first three lines
- Detail stays collapsed by default

### Remaining UX risks

- Printable note density is reduced, but some non-exact items still require explanatory text
- Supporting copy is readable, but the weakest secondary text is still the first place age-related readability strain would show up
- Weekly updates use the non-payment `/api/waitlist` lane when checkout is disabled, so copy and evidence must stay aligned with the current non-payment runtime rather than assuming Stripe is present

## 2. Operations Proof

### Status

- Substantially proven

### Current evidence

- `pnpm smoke:local -SkipPayment` passed
- `/` returned `200`
- `/printable` returned `200`
- `POST /api/waitlist` returned `400` for invalid payloads
- `POST /api/waitlist` returned `200` for a valid weekly-updates signup
- Locked `/admin` hid readiness and env details
- Unauthenticated observations route was blocked
- Admin unlock lockout returned `429` with `Retry-After`
- Valid admin unlock succeeded
- Authenticated observations route was reachable
- Admin observation save with evidence succeeded
- Saved observation appeared in recent observations
- Evidence download route redirected
- Unauthenticated evidence route was blocked
- Public Supabase view exposed the saved sanitized observation

### Live Supabase proof

- `published_price_observations` exists
- Public published view returned `200`
- Private base table `price_observations` returned `401 permission denied`
- Deny policies exist on:
  - `price_observations`
  - `observation_evidence`
  - `founding_member_signups`
- `observation-evidence` storage bucket exists and is private
- Restrictive deny policy exists on `storage.objects` for the `observation-evidence` bucket

### Remaining ops risks

- Policy proof is now consolidated in `docs/operator-evidence-bundle.md` and refreshed through immutable per-run evidence bundles, but the underlying evidence still comes from multiple reproducible sources
- Admin unlock throttling remains an MVP-level control and is not a durable distributed rate-limit system

## 3. Payment

### Status

- Explicitly deferred in the current environment

### Reason

- `STRIPE_SECRET_KEY` is missing
- `STRIPE_WEBHOOK_SECRET` is missing
- `STRIPE_PRICE_ID_FOUNDING_MEMBER` is missing

### Impact

- Checkout and webhook reconciliation are not yet proven in this environment
- Payment cannot be part of the current merge gate for “stable now”
- Payment remains part of the project harness and should reopen once Stripe test-mode secrets are supplied

## 4. Release Readiness

### Status

- Partially prepared

### Current evidence

- `README.md` documents the project, commands, and live-flow notes
- `docs/live-smoke-checklist.md` captures local/live smoke steps
- `docs/mvp-operations.md` captures the daily runbook, publish gate, storage model, admin access, and payment flow intent
- `.github/workflows/ci.yml` enforces the non-payment quality gate and runs a hosted `ops:evidence` lane with uploaded automation-proof artifacts
- `pnpm ops:verify` now emits canonical release-health verdicts from the latest evidence pointers and bundle manifest
- `/admin` now surfaces the canonical release-health verdict, operator-evidence checklist, accepted local limits, explicit external blockers, and an external proof handoff packet for operators
- Hosted CI provenance can now be written into `.ops-evidence/hosted-attestation.json` and surfaced in `/admin` as provenance-only context when present
- A minimal advisory visual regression lane now protects `/` and `/printable` from silent drift
- The release-health surface now includes the latest advisory visual regression status so ops and visual drift are visible together
- Hosted CI now evaluates visual advisory and writes hosted provenance before canonical verification so the hosted release-health verdict is same-run honest
- Release-health is now freshness-aware and scope-aware, so newer visual or hosted artifacts can make the last verified verdict explicitly stale and local-only proof cannot masquerade as hosted-observed proof

### Remaining release work

- Keep the release checklist, accepted-risk ledger, roadmap slices, and operator evidence bundle in sync as the project changes
- Reopen the payment lane once Stripe test-mode secrets are available

## Merge Gate

The current project can be considered stable for the public-UX + operations-proof milestone only if all of the following remain true:

- `pnpm typecheck` passes
- `pnpm lint` passes
- `pnpm build` passes
- Public UX remains summary-first on `/`
- Printable remains helper-first on `/printable`
- Public/private trust boundary evidence remains valid
- Payment is either proven or explicitly deferred with a reason

Current verdict:

- Public UX: stable enough to stop polishing
- Operations proof: sufficient for the current milestone
- Payment: deferred

## Next Roadmap Slices

1. Keep the non-payment waitlist harness, smoke expectations, and release docs aligned
2. Operator evidence bundle and release-readiness maintenance
3. Stripe test-mode checkout + webhook proof once Stripe prerequisites exist
4. Optional final public UX polish after payment flow is visible

Related docs:

- `docs/release-readiness-checklist.md`
- `docs/accepted-risks.md`
- `docs/roadmap-slices.md`
- `docs/operator-evidence-bundle.md`
