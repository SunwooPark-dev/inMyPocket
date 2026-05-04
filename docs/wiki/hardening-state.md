# Hardening State

Last updated: 2026-04-23

## Start State

The current hardening lane began with a local app that could render the Eugene `97401` pilot flow, but the operator proof still had an external blocker: publishable-key direct REST reads could return governed `published_price_observations` rows.

## Current State

- Public basket reads are server-owned.
- Payment runtime remains out of scope.
- `pnpm boundary:check` blocks tracked local/generated artifacts such as `.ops-evidence/`, `tmp-*`, `supabase/.temp/`, and non-example `.env*` files.
- `pnpm secret:check` scans tracked text files for common committed key/token patterns.
- `pnpm ops:harden-published-view:apply` is the operator repair command for direct published-view grant drift.
- `pnpm ops:harden-published-view:verify` expects `forbidden_direct_grant_count = 0` and `service_role_select_grant_count = 1`.
- Smoke and ops evidence failure output suppress raw REST response bodies.
- Command ownership and artifact flow are mapped in `docs/wiki/hardening-execution-graph.md`.

## Remaining External Blocker

This is an external Supabase state blocker, not a local app-code blocker.

Role order:

1. Supabase Boundary Operator applies and verifies published-view direct-grant hardening in the linked Supabase project.
2. Local Proof Verifier reruns local smoke and ops evidence after Supabase proof is supplied.
3. Docs/Handoff Reconciler refreshes generated proof artifacts and reconciles stale docs after verification passes.

Run the hardening command in a linked Supabase environment:

```powershell
pnpm ops:show-hardening
pnpm ops:show-supabase-sql
pnpm ops:local-preflight
pnpm ops:harden-published-view:status
pnpm ops:harden-published-view:apply
pnpm smoke:local -SkipPayment
pnpm ops:evidence
pnpm ops:verify
```

## Finish Criteria

- Direct publishable-key REST reads on `published_price_observations` are denied or return zero governed rows.
- `pnpm ops:evidence` and `pnpm ops:verify` refresh the canonical proof artifacts after the linked Supabase hardening is applied.
- Hosted proof is observed through GitHub Actions or a provided workflow artifact link.
