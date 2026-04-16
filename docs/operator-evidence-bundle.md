# Operator Evidence Bundle

## Summary

This document is the operator-facing proof bundle for the current inMyPoket state.

It consolidates the evidence needed to support the current milestone claim:

- public UX is stable enough for the pilot
- operations proof is materially complete
- payment is deferred until Stripe secrets are supplied

Primary refresh path:

```powershell
pnpm ops:evidence
pnpm ops:verify
```

Generated evidence is written as an immutable per-run bundle under `.ops-evidence/ops-evidence-<timestamp>/`.
Each bundle contains `report.md`, `manifest.json`, and a dedicated `ui-assets/` folder for screenshots and printable PDF output.
The latest bundle pointers are refreshed at `.ops-evidence/LATEST.md` and `.ops-evidence/latest-run.json`.
If smoke or evidence capture fails, `pnpm ops:evidence` now exits non-zero after writing the diagnostic bundle.
Each bundle now records whether live Supabase proof was actually available in that environment.
UI capture is tracked separately from the core non-payment ops verdict, so restricted environments can report UI evidence as unavailable without overstating or understating live ops proof.
Hosted CI now runs a non-payment `ops:evidence` lane on Windows and uploads the resulting automation-proof `.ops-evidence` bundle as an artifact.
`pnpm ops:verify` consumes the latest pointers plus bundle manifest and writes canonical release-health verdicts to `.ops-evidence/release-health.json` and `.ops-evidence/release-health.md`.
`pnpm ops:verify` now also writes `.ops-evidence/operator-proof.json` and `.ops-evidence/operator-proof.md`, which package the route/access-control/trust-boundary checklist into one operator-facing summary.
That same artifact now also carries accepted local limits, explicit external blockers, operator next actions, and the external proof handoff packet for hosted/payment follow-up.
The unlocked `/admin` console now reads that canonical release-health verdict and the operator evidence bundle directly, so operators can see the verdict, proved checklist, current limits, blockers, and handoff requirements in-app.
`operator-proof.json` is the machine-readable handoff packet; `operator-proof.md` is the human-readable companion summary.
`pnpm ops:verify` also writes `.ops-evidence/external-proof-handoff.json` and `.ops-evidence/external-proof-handoff.md` as dedicated exportable packets for external hosted/payment follow-up.
Hosted CI also writes `.ops-evidence/hosted-attestation.json`, which records hosted provenance metadata for the latest run.
The unlocked `/admin` console treats that attestation as provenance-only context; the canonical verdict and proof scope come from `release-health.json`.
Local simulations of hosted provenance are now explicitly marked as simulations so the operator surface does not overclaim hosted observation.
In the current workspace, the CI lane exists but no matching GitHub repo / PR / workflow run has been observed yet, so hosted provenance remains a handoff item rather than a completed proof.
Visual regression is now a separate advisory lane: `pnpm visual:check` compares fresh homepage/printable captures against committed baselines and writes diff artifacts under `.ops-evidence/visual-regression-*`.
The canonical `release-health` verdict now also records the latest advisory visual regression status, and `/admin` surfaces that beside ops and hosted provenance.
In hosted CI, `visual:check` and `ops:attest-hosted` now run before `ops:verify`, so the canonical hosted release-health verdict consumes the same run's visual advisory and hosted provenance instead of an older snapshot.
The canonical `release-health` verdict is now freshness-aware: it records whether newer ops/hosted/visual artifacts exist than the current verification snapshot, includes an explicit verification scope, and surfaces stale reasons in `/admin`.

Last refreshed: 2026-04-16

## Environment Snapshot

### Ready

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `ADMIN_ACCESS_TOKEN`
- `ADMIN_SESSION_SECRET`

### Not ready

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_FOUNDING_MEMBER`

## Public Route Proof

Verified through local smoke:

- `/` returned `200`
- `/printable` returned `200`
- `POST /api/waitlist` returned `400` for invalid payloads
- `POST /api/waitlist` returned `200` for a valid weekly-updates signup

## Admin and Access-Control Proof

Verified through local smoke:

- locked `/admin` hides readiness and env details
- unauthenticated `/api/observations` is blocked
- admin unlock reset succeeds
- repeated invalid unlock attempts lock out with `429` and `Retry-After`
- valid admin unlock succeeds
- authenticated `/api/observations` is reachable

Current immutable bundle pointers:

- `.ops-evidence/LATEST.md`
- `.ops-evidence/latest-run.json`
- `.ops-evidence/ops-evidence-20260415-185147/report.md`

## Observation and Evidence Proof

Verified through local smoke:

- manual observation save succeeds
- saved observation appears in recent observations
- evidence route redirects for authenticated admin
- evidence route is blocked for unauthenticated access

## Supabase Trust-Boundary Proof

Verified through CLI query + REST checks:

- `published_price_observations` exists
- public published view returns `200`
- private base table `price_observations` returns `401 permission denied`
- deny policies exist on:
  - `price_observations`
  - `observation_evidence`
  - `founding_member_signups`
- `observation-evidence` bucket exists and is private
- restrictive deny policy exists on `storage.objects` for the `observation-evidence` bucket

## Commands Used

```powershell
pnpm typecheck
pnpm lint
pnpm build
pnpm smoke:local -SkipPayment
.\scripts\supabase-cli.ps1 db query --linked "select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public' and tablename in ('price_observations','observation_evidence','founding_member_signups') order by tablename, policyname;"
.\scripts\supabase-cli.ps1 db query --linked "select table_name from information_schema.views where table_schema = 'public' and table_name = 'published_price_observations';"
.\scripts\supabase-cli.ps1 db query --linked "select id, name, public from storage.buckets where id = 'observation-evidence';"
.\scripts\supabase-cli.ps1 db query --linked "select policyname, cmd, roles from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'deny anon authenticated observation evidence bucket';"
```

## Quality Gate Status

- [x] `pnpm typecheck`
- [x] `pnpm lint`
- [x] `pnpm build`
- [x] local public/admin smoke
- [x] Supabase public/private proof
- [ ] Stripe payment proof

Current verdict:

- Public UX and operations proof are acceptable for the current milestone.
- Payment remains outside the current merge gate until secrets are supplied.

## Hosted Proof Handoff

Current state:

- `.github/workflows/ci.yml` already defines the hosted `ops-evidence-gate`
- `.ops-evidence/hosted-attestation.json` is still marked `verificationScope: local-simulated`
- the current workspace is not attached to a recoverable git remote, so a real hosted run cannot be linked from local evidence alone

To close this blocker, provide:

- the matching GitHub repository
- a PR or push that triggers GitHub Actions
- the resulting workflow run link or uploaded artifact link

Expected hosted outputs:

- observed `ops-evidence-bundle` artifact from GitHub Actions
- non-simulated `.ops-evidence/hosted-attestation.json`
- `/admin` and `release-health` showing hosted observation beyond local simulation

## Deferred Proof

Stripe payment proof is intentionally deferred until the missing Stripe secrets are supplied.

When payment is reopened, collect:

- checkout start proof
- webhook receipt proof
- signup state transition proof
- replay/duplicate behavior notes
