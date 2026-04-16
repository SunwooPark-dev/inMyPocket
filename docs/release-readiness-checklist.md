# Release Readiness Checklist

Last refreshed: 2026-04-16

## Quality gates

- [x] `pnpm typecheck`
- [x] `pnpm lint`
- [x] `pnpm build`
- [x] GitHub Actions CI quality gate exists for non-payment checks
- [x] GitHub Actions CI hosted `ops:evidence` lane uploads non-payment automation-proof artifacts
- [x] Evidence contract verifier exists and emits canonical release-health verdicts
- [x] `/admin` surfaces the latest canonical release-health verdict for operators
- [x] Hosted CI provenance can be stamped into `hosted-attestation.json`
- [ ] A real GitHub-hosted run/artifact has been observed for this workspace (current state remains local-simulated until the matching repo / PR / workflow run is supplied)
- [x] Advisory visual regression baseline exists for `/` and `/printable`
- [x] Release-health now records the latest advisory visual regression status
- [x] Hosted CI now runs visual advisory and hosted attestation before canonical verification so same-run truth is preserved
- [x] Release-health now records freshness, stale reasons, and verification scope when newer upstream proof artifacts exist or hosted observation is local-only

## Public UX

- [x] Homepage first viewport is summary-first
- [x] Primary and secondary public CTAs are visible
- [x] Strongest answer block appears before detail
- [x] Detail remains collapsed by default
- [x] Printable route leads with a shopping decision
- [x] Public UI does not expose admin navigation

## Operations proof

- [x] Public page route smoke passed
- [x] Printable route smoke passed
- [x] Non-payment waitlist route stays live when checkout is disabled (`POST /api/waitlist` returns `400` for invalid payloads and `200` for valid weekly-updates signups)
- [x] Locked admin hides readiness data
- [x] Admin unlock flow and lockout behavior proved
- [x] Authenticated observation save flow proved
- [x] Evidence route access control proved
- [x] Public Supabase view returned published data
- [x] Base table direct read from anon was denied
- [x] Evidence bucket exists and is private

## Payment

- [ ] Stripe checkout start proof
- [ ] Webhook receipt proof
- [ ] Signup reconciliation proof

Current status:
- Payment is deferred until Stripe test-mode secrets are available in the environment.

## Documentation

- [x] README reflects current commands and runtime notes
- [x] Live smoke checklist exists
- [x] MVP operations doc exists
- [x] Product harness status doc exists
- [x] Accepted-risk ledger is consolidated into one operator-facing section
- [x] Roadmap slices are documented for continuation
- [x] Operator evidence bundle exists
- [x] Public UX is stable enough to stop further polish for the current milestone

## Accepted risks / deferrals

- Admin unlock throttling is still an MVP-grade control, not a distributed durable limiter.
- Payment flow is intentionally deferred in the current environment due to missing Stripe secrets.
- Print-preview validation has been checked through generated PDF output rather than an interactive browser print dialog.

See also:

- `docs/accepted-risks.md`
- `docs/roadmap-slices.md`
- `docs/operator-evidence-bundle.md`
