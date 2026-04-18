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
- ZIP input is now the primary location control on `/`
- Public controls are collapsed by default and no longer compete with the top answer
- Store comparison is one-column on mobile
- Compare and printable routes now preserve all supported non-payment price scenarios
- Homepage now distinguishes the cheapest basket from the closest tracked real store
- Weekly-updates bridge remains visible high on the homepage after the shopping decision and nearest-store context
- Weekly updates form now supports both self-serve and caregiver-oriented copy in the non-payment lane
- Printable page communicates the shopping decision in the first three lines
- Detail stays collapsed by default
- Unsupported ZIPs now show a pilot-only message instead of silently remapping to `30328`

### Remaining UX risks

- Printable note density is reduced, but some non-exact items still require explanatory text
- Supporting copy is readable, but the weakest secondary text is still the first place age-related readability strain would show up
- Nearest-store context is pilot-bounded and uses one tracked branch per retailer and ZIP rather than a full branch directory
- Browser geolocation is now session-explicit enrichment only and no longer auto-replays on later visits
- Weekly updates use the non-payment `/api/waitlist` lane when checkout is disabled, so copy and evidence must stay aligned with the current non-payment runtime rather than assuming Stripe is present

## 2. Operations Proof

### Status

- Substantially proven for route/access-control/trust-boundary checks, including governed populated and governed empty-state runtime proof for the current hosted slice

### Current evidence

- `pnpm smoke:local -SkipPayment` passed
- `/` returned `200`
- `/printable` returned `200`
- `/` and `/printable` smoke evidence captured streamed loading-shell copy
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
- Public Supabase view continued to return governed published data
- Fresh manual admin saves stayed out of `published_price_observations` until publication
- Hosted governed `30328` slice now exposes `16` published `kroger-30328` regular rows in `published_price_observations`
- Env-loaded runtime render now proves governed populated `30328` and governed empty `30022` branches on both homepage and printable

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
- Manual admin saves are internal evidence rows, not public publication events, so smoke/docs must keep distinguishing save proof from publish proof
- Policy proof still comes from multiple reproducible sources and should keep being refreshed as artifacts age

## 3. Payment

### Status

- Not part of the active product model

### Reason

- The current business direction is donation and advertising support rather than direct payment

### Impact

- Checkout and webhook reconciliation are not part of the current milestone gate
- The public product remains fully non-payment
- Stripe code may remain in the repo as dormant legacy implementation, but it is not an active release dependency

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
- `.ops-evidence/external-proof-handoff.json` and `.md` now exist as dedicated exportable packets for external hosted/payment follow-up
- Hosted CI provenance can now be written into `.ops-evidence/hosted-attestation.json` and surfaced in `/admin` as provenance-only context when present
- A minimal advisory visual regression lane now protects `/` and `/printable` from silent drift
- The release-health surface now includes the latest advisory visual regression status so ops and visual drift are visible together
- Hosted CI now evaluates visual advisory and writes hosted provenance before canonical verification so the hosted release-health verdict is same-run honest
- Release-health is now freshness-aware and scope-aware, so newer visual or hosted artifacts can make the last verified verdict explicitly stale and local-only proof cannot masquerade as hosted-observed proof

### Codex operator loop

- Use `docs/codex-operator-bootstrap.md` as the entrypoint when evidence freshness, handoff context, or Codex support-boundary questions arise.
- Use the approved first-wave automation lane for stale-proof or stale-readiness follow-up before opening ad hoc recurring workflows.
- Promote durable operator truth into repo docs when memory guidance says it has crossed the source-of-truth boundary.

### Remaining release work

- Keep the release checklist, accepted-risk ledger, roadmap slices, operator evidence bundle, and Codex operator bootstrap docs in sync as the project changes
- Hosted proof remains blocked until the GitHub-observed workflow definition and artifact match the local hosted proof lane
- Revisit monetization only if the product explicitly decides to introduce donations, ads integration, or a new direct payment lane

## Merge Gate

The current project can be considered stable for the public-UX + operations-proof milestone only if all of the following remain true in the current verified workspace state:

- `pnpm typecheck` passes
- `pnpm lint` passes
- `pnpm test` passes
- `pnpm build` passes
- Public UX remains summary-first on `/`
- Printable remains helper-first on `/printable`
- Public/private trust boundary evidence remains valid
- Monetization strategy is documented and does not conflict with the current non-payment product path

Current verified local verdict on 2026-04-16:

- Public UX: stable enough to stop polishing
- Operations proof: sufficient for the current route/access-control + governed runtime milestone
- Engineering gate: green after generating Next route/layout types before `tsc`
- Payment: not planned

## Next Roadmap Slices

1. Publication-governed smoke and operator-doc maintenance
2. Operator evidence bundle and release-readiness maintenance
3. Donation/advertising model exploration if and when monetization is productized
4. Optional final public UX polish after the monetization direction becomes visible

Related docs:

- `docs/release-readiness-checklist.md`
- `docs/accepted-risks.md`
- `docs/roadmap-slices.md`
- `docs/operator-evidence-bundle.md`
- `docs/codex-operator-bootstrap.md`
- `docs/codex-automation-playbooks.md`
- `docs/codex-memory-guidelines.md`
- `docs/codex-proof-run-2026-04-16-ops-proof-freshness.md`
- `docs/codex-proof-run-2026-04-16-release-readiness.md`
- `docs/hosted-proof-observation-2026-04-16.md`
