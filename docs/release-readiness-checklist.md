# Release Readiness Checklist

Last refreshed: 2026-04-16

## Quality gates

Last re-verified locally: 2026-04-16

- [x] `pnpm typecheck`
- [x] `pnpm lint`
- [x] `pnpm test`
- [x] `pnpm build`
- [x] GitHub Actions CI quality gate exists for non-payment checks
- [x] GitHub Actions CI hosted `ops:evidence` lane uploads non-payment automation-proof artifacts
- [x] Evidence contract verifier exists and emits canonical release-health verdicts
- [x] `/admin` surfaces the latest canonical release-health verdict for operators
- [x] Dedicated external handoff artifacts exist for hosted/payment follow-up (`external-proof-handoff.json` / `.md`)
- [x] Hosted CI provenance can be stamped into `hosted-attestation.json`
- [ ] A real GitHub-hosted run/artifact has been observed for this workspace (current state remains local-simulated until the matching repo / PR / workflow run is supplied)
- [x] Advisory visual regression baseline exists for `/` and `/printable`
- [x] Release-health now records the latest advisory visual regression status
- [x] Hosted CI now runs visual advisory and hosted attestation before canonical verification so same-run truth is preserved
- [x] Release-health now records freshness, stale reasons, and verification scope when newer upstream proof artifacts exist or hosted observation is local-only

## Public UX

- [x] Homepage first viewport is summary-first
- [x] Homepage accepts a 5-digit ZIP as the primary location control
- [x] Primary and secondary public CTAs are visible
- [x] Homepage shows closest tracked-store context without changing cheapest-store ranking
- [x] Weekly-updates bridge remains visible near the top of the homepage after the shopping decision context
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
- [x] Fresh admin saves stay internal until governed publication occurs
- [x] Base table direct read from anon was denied
- [x] Evidence bucket exists and is private
- [x] Governed no-publishable-summary empty-state branch has been observed in env-loaded runtime against migrated governed data

## Monetization

- [x] Public experience remains fully usable without checkout
- [x] Weekly updates stay on the non-payment waitlist path
- [x] Direct payment is not treated as part of the current release gate

Current status:
- Donation and advertising are the current monetization directions under consideration; direct payment is not part of the active milestone.

## Documentation

- [x] README reflects current commands and runtime notes
- [x] Live smoke checklist exists
- [x] MVP operations doc exists
- [x] README and operator docs record the current Codex baseline (`0.121.0+`, `gpt-5.4`, `gpt-5.4-mini`) and the `2026-04-07` / `2026-04-14` ChatGPT-sign-in model availability change
- [x] Product harness status doc exists
- [x] Accepted-risk ledger is consolidated into one operator-facing section
- [x] Roadmap slices are documented for continuation
- [x] Operator evidence bundle exists
- [x] Codex operator bootstrap exists for first-wave automation/memory usage
- [x] Codex first-wave acceptance artifact exists
- [x] Ops proof freshness operationalization runbook exists
- [x] Codex package docs are in sync with current proof surfaces (`docs/codex-support-scope.md`, `docs/codex-adoption-plan.md`, `docs/codex-automation-playbooks.md`, `docs/codex-memory-guidelines.md`, `docs/codex-operator-bootstrap.md` vs `.ops-evidence/release-health.md`, `.ops-evidence/operator-proof.md`, and `docs/product-harness-status.md`)
- [x] External proof handoff artifacts exist and are exportable from the repo
- [x] Public UX is stable enough to stop further polish for the current milestone
- [x] Hosted proof blocker is narrowed to a concrete observed mismatch when no real GitHub-hosted proof run is available

## Codex operator next step

- If proof is stale right now or docs disagree with artifacts, start with `docs/codex-operator-bootstrap.md`, then follow `docs/ops-proof-freshness-operationalization.md` before editing docs manually.
- If the same class of drift keeps recurring, use the approved automation lane from `docs/codex-automation-playbooks.md`.
- If a new operator truth emerges during handoff, follow `docs/codex-memory-guidelines.md` and promote any repo-wide behavior change into docs.
- Do not treat GitHub review handling as a first-wave default lane until the repo-specific workflow doc exists.

## Accepted risks / deferrals

- Admin unlock throttling is still an MVP-grade control, not a distributed durable limiter.
- Direct payment is intentionally out of scope for the current milestone.
- Print-preview validation has been checked through generated PDF output rather than an interactive browser print dialog.
- Current smoke proof for `/` and `/printable` includes streamed loading-shell capture plus env-loaded governed populated (`30328`) and empty-state (`30022`) runtime render against migrated hosted data.

See also:

- `docs/accepted-risks.md`
- `docs/roadmap-slices.md`
- `docs/operator-evidence-bundle.md`
- `docs/codex-operator-bootstrap.md`
- `docs/codex-automation-playbooks.md`
- `docs/codex-memory-guidelines.md`
- `docs/codex-first-wave-acceptance.md`
- `docs/ops-proof-freshness-operationalization.md`
- `docs/hosted-proof-observation-2026-04-16.md`
- `docs/codex-proof-run-2026-04-16-ops-proof-freshness.md`
- `docs/codex-proof-run-2026-04-16-release-readiness.md`
- `.ops-evidence/hosted-proof-request.json`
- `.ops-evidence/hosted-proof-request.md`
- `.ops-evidence/external-proof-handoff.json`
- `.ops-evidence/external-proof-handoff.md`
