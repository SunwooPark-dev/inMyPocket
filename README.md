# inMyPoket

`inMyPoket` is a mobile-first MVP for a senior-friendly grocery basket comparison service focused on North Atlanta pilot ZIP clusters.

## What is implemented

- Senior-friendly landing page with large-type basket comparison
- Seeded pilot data for 3 retailers across 3 ZIP clusters with Supabase-backed live overrides
- Anchor basket normalization and scenario pricing logic
- Provenance, trust badges, and publish-gate summaries
- Printable shopping list view
- Weekly-updates signup lane with self vs caregiver audience framing
- Admin unlock flow with signed cookie session
- Admin manual observation save flow with optional evidence upload
- Stripe Checkout and webhook routes are implemented in code; live payment proof remains deferred until Stripe test-mode secrets are supplied
- MVP operations documentation

## Commands

```bash
pnpm install
pnpm dev
pnpm dev:3001
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start:3001
pnpm port:check
pnpm import:legacy -- --dry-run
pnpm smoke:local
pnpm ops:evidence
pnpm ops:verify
pnpm ops:attest-hosted
pnpm ops:handoff
pnpm visual:update-baseline
pnpm visual:check
```

## Notes

- Runtime persistence is Supabase-first. Seed observations remain as fallback records until live entries override them.
- Public basket pages now read from a sanitized published view rather than the full private observations table.
- Evidence files are expected to live in a private Supabase Storage bucket.
- Base tables and the `observation-evidence` bucket now carry explicit deny policies for `anon` and `authenticated`; public access is limited to the sanitized published view.
- Founding member checkout is Stripe Checkout based and requires the env vars listed in `.env.example`.
- In the current documented runtime state, payment remains explicitly deferred until Stripe test-mode secrets are supplied.
- Admin unlock now requires both `ADMIN_ACCESS_TOKEN` and `ADMIN_SESSION_SECRET`.
- Admin unlock now surfaces remaining attempts and cooldown guidance in the form, based on the current local rate-limit policy.
- `/admin` now also exposes a recent unlock-incident list for the current local runtime, so operators can inspect recent invalid/throttled unlock activity without tailing server logs.
- `/admin` now also lists the currently accepted local limits in-app, so operators do not need to cross-reference the risk ledger just to understand the current runtime boundaries.
- `/admin` now also lists operator next actions in-app, so the current proof state and accepted limits immediately tell operators what to do next.
- `/admin` now also surfaces external blockers and an external proof handoff packet, so hosted/payment follow-up requirements are visible without opening docs first.
- `/admin` now reads the latest release-health verdict and latest evidence step labels so operators can see the current non-payment status without opening raw artifact files.
- `/admin` now also shows hosted CI provenance when `hosted-attestation.json` exists, and explicitly labels local simulations so they are not mistaken for observed hosted runs.
- `/admin` now also shows the latest advisory visual regression verdict, so operators can see visual drift status alongside ops and hosted provenance.
- `/admin` now also shows proof freshness and concrete stale reasons, so a newer visual or hosted artifact cannot be mistaken for the state reflected in the last `release-health` verification.
- The public compare/print flow now preserves all six comparison scenarios instead of silently collapsing non-default views on the printable route.
- The weekly-updates form now supports self vs caregiver copy/trust framing and emits lightweight browser-side waitlist events for the homepage lane.
- Member-only, coupon-required, club-only, and weekly-ad values stay separated from the default basket total.
- The repo-local bootstrap script writes `.env.local` in the correct project root and prints the correct Stripe webhook route.
- Supabase is invoked through `pnpm dlx supabase@latest`, and Stripe can be run from the repo-local wrapper if `.tools/stripe-cli/stripe.exe` exists.
- PowerShell-backed `pnpm` tasks now auto-select `powershell`, `pwsh`, or `powershell.exe`, so WSL/Linux shells do not need a hardcoded `powershell` binary name.
- `pnpm visual:check` now auto-selects `python` or `python3` before running the visual verifier.
- When working from WSL/Linux, install dependencies inside that environment instead of reusing Windows-installed `node_modules`; if `pnpm build` reports missing Next Turbopack native bindings on `linux/x64`, remove `node_modules` and reinstall (`CI=true pnpm install --frozen-lockfile`).
- `/api/waitlist` remains the live non-payment weekly-updates path when checkout is disabled; `/api/founding-member/checkout` stays available for the Stripe-backed payment lane when Stripe test-mode secrets are supplied.
- `pnpm smoke:local` runs the local HTTP smoke sequence against a running app and leaves Supabase/Stripe live proof as explicit follow-up items.
- `pnpm smoke:local` now also checks non-default comparison scenario routes so compare/print parity is covered in the local non-payment lane.
- `pnpm ops:evidence` generates an immutable operator-facing evidence bundle under `.ops-evidence/ops-evidence-<timestamp>/`, writes `manifest.json` inside the bundle, refreshes `.ops-evidence/LATEST.md` and `.ops-evidence/latest-run.json`, records whether live Supabase proof was available, and exits non-zero if smoke or capture steps fail.
- `pnpm ops:verify` consumes the latest evidence pointers and manifest, verifies contract consistency, and writes canonical release-health verdicts to `.ops-evidence/release-health.json` and `.ops-evidence/release-health.md`.
- `pnpm ops:verify` also writes `.ops-evidence/operator-proof.json` and `.ops-evidence/operator-proof.md`, so operators get one checklist-oriented artifact instead of reconstructing proof from multiple files.
- `pnpm ops:verify` now also records external blockers and handoff requirements inside `operator-proof`, so the remaining hosted/payment work is action-ready.
- `.ops-evidence/operator-proof.json` is now the handoff-ready machine-readable summary for external hosted/payment follow-up, and `/admin` mirrors that same packet in-app.
- `pnpm ops:verify` also emits `.ops-evidence/external-proof-handoff.json` and `.ops-evidence/external-proof-handoff.md` as standalone follow-up packets for GitHub-hosted and Stripe proof work.
- `pnpm ops:handoff` prints the current external proof handoff packet directly in the terminal from `.ops-evidence/external-proof-handoff.json`.
- `pnpm ops:verify` now records freshness-aware canonical truth: current vs stale, hosted observation status, verification scope, and source timestamps for ops/hosted/visual inputs.
- `pnpm ops:attest-hosted` is for CI use: it stamps provenance metadata for the current hosted run into `.ops-evidence/hosted-attestation.json` from `latest-run.json`, so CI can write hosted provenance before the final canonical `ops:verify` pass.
- UI screenshot/PDF capture is now treated as an environment-sensitive proof lane; when capture is unavailable, the bundle records that explicitly instead of overstating the non-payment verdict.
- `pnpm visual:update-baseline` refreshes the committed visual baseline for homepage desktop/mobile and printable mobile.
- `pnpm visual:check` captures a fresh candidate set, compares it against the committed visual baseline, and writes advisory diff artifacts under `.ops-evidence/visual-regression-*`.
- `pnpm ops:verify` folds the latest advisory visual regression result into `release-health.json` / `release-health.md` without turning it into a hard release blocker, and CI now runs `visual:check` plus `ops:attest-hosted` before `ops:verify` so the canonical verdict reflects the same run's visual advisory and hosted provenance.
- `pnpm port:check` reports whether port `3000` is already occupied and prints the owning process when possible.
- `pnpm start:3001` starts the production server on port `3001` after first confirming the port is free.
- `pnpm dev:3001` starts the dev server on port `3001` after first confirming the port is free; if a restricted terminal blocks `next dev` child-process startup, the wrapper prints guidance.
- GitHub Actions now enforces the non-payment quality gate (`typecheck`, `lint`, `test`, `build`) and a hosted Windows `ops:evidence` + `ops:verify` + hosted attestation lane, plus an advisory visual regression check with uploaded diff artifacts.
- Current project status and release gating live in:
  - `docs/product-harness-status.md`
  - `docs/release-readiness-checklist.md`
  - `docs/accepted-risks.md`
  - `docs/roadmap-slices.md`
  - `docs/operator-evidence-bundle.md`
