# Hardening Execution Graph

Last updated: 2026-04-23

## Command Graph

| Command | Owns | Reads / Writes | Next Action |
| --- | --- | --- | --- |
| `pnpm ops:show-hardening` | Human-readable hardening handoff | Reads `scripts/show-hardening-handoff.ts`; writes nothing | Run before external Supabase work |
| `pnpm ops:show-supabase-sql` | SQL Editor handoff | Reads `scripts/show-supabase-sql-handoff.ts`; writes nothing | Use when Supabase CLI is not linked but SQL Editor access exists |
| `pnpm ops:local-preflight` | Local preflight gate | Runs `boundary:check`, `secret:check`, `typecheck`, `lint`, `test`, and `build`; writes generated build cache only | Run before external Supabase work |
| `pnpm ops:harden-published-view` | Dry-run instructions | Reads `scripts/harden-published-view-direct-grants.ps1`; writes nothing | Confirm target and safety rules |
| `pnpm ops:harden-published-view:status` | Non-applying direct-grant status | Runs `scripts/verify-published-view-direct-grants.sql`; exits zero when the project is not linked | Distinguish local not-linked state from real boundary failure |
| `pnpm ops:harden-published-view:apply` | Linked Supabase grant repair | Runs `scripts/harden-published-view-direct-grants.sql` and `scripts/verify-published-view-direct-grants.sql` | Requires linked Supabase project |
| `pnpm ops:harden-published-view:verify` | Verify-only direct-grant proof | Runs `scripts/verify-published-view-direct-grants.sql`; writes nothing | Use after SQL Editor/manual grant changes |
| `pnpm smoke:public` | Public-route smoke | Runs `scripts/public-smoke.ps1`; reads `APP_URL` when set; writes nothing | Safe pre-external check for dashboard/printable |
| `pnpm start:3109` / `pnpm smoke:public:3109` | Local browser preview lane | Starts/checks `http://localhost:3109`; writes generated build cache only | Use when IAB/browser is pointed at port 3109 |
| `pnpm smoke:local -SkipPayment` | Runtime route and direct-grant smoke | Runs `scripts/live-smoke.ps1`; may fail until hosted grants are hardened | Confirms app and boundary behavior |
| `pnpm ops:evidence` | Local evidence bundle | Runs `scripts/collect-ops-evidence.ps1`; writes ignored `.ops-evidence/` artifacts | Run after Supabase hardening proof |
| `pnpm ops:verify` | Canonical proof summaries | Runs `scripts/verify-ops-evidence.ts`; refreshes ignored `.ops-evidence/*proof*` and `release-health*` | Use `pnpm ops:handoff` for sanitized handoff |
| `pnpm ops:handoff` | Shareable handoff summary | Reads ignored `.ops-evidence/external-proof-handoff.json`; writes nothing | Preferred external handoff text |
| `pnpm visual:check` | Advisory visual proof | Runs visual regression tooling; writes ignored `.ops-evidence/visual-regression-*` | Advisory signal consumed by `ops:verify` |
| `pnpm boundary:check` | Repo boundary guard | Runs `scripts/check-boundaries.mjs`; writes nothing | Must pass before handoff |
| `pnpm secret:check` | Tracked-file secret scan | Runs `scripts/check-secrets.mjs`; writes nothing | Must pass before handoff |
| `pnpm test` | Regression guard proof | Runs test suite including `tests/ops-boundary-scripts.test.ts` and `tests/secret-scan.test.ts` | Must pass before handoff |
| GitHub Actions `ops-evidence-gate` | Hosted evidence lane | Runs `ops:evidence`, `visual:check`, `ops:attest-hosted`, `ops:verify`; uploads `ops-evidence-bundle` | Required for hosted-observed proof |
| Linked Supabase project state | External boundary state | Stores `published_price_observations` grants outside the repo | Must produce `forbidden_direct_grant_count = 0` and `service_role_select_grant_count = 1` |

## Artifact Rules

- `.ops-evidence/` is local/generated and ignored by git.
- Per-run reports, browser profiles, screenshots, PDFs, and raw diagnostics must not be committed or externally shared.
- Use `pnpm ops:handoff`, hosted CI artifact links, or reviewed excerpts for external handoff.
- `pnpm boundary:check` fails if ignored/generated artifacts are force-tracked.

## External Closure Order

1. Supabase Boundary Operator runs `pnpm ops:harden-published-view:apply` in a linked Supabase environment.
2. Local Proof Verifier runs `pnpm smoke:local -SkipPayment`, `pnpm ops:evidence`, and `pnpm ops:verify`.
3. Docs/Handoff Reconciler updates stale docs only after refreshed proof artifacts establish the new truth.

## Expected Closure Evidence

- `forbidden_direct_grant_count = 0`
- `service_role_select_grant_count = 1`
- Publishable-key direct REST reads are denied or return zero governed rows.
- App-server/service-role public basket reads still render the pilot basket.
