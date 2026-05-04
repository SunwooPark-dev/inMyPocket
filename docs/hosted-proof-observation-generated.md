# Hosted Proof Observation

Recorded: 2026-04-17T05:04:09.753Z
Repo: SunwooPark-dev/inMyPocket
Branch: main
Local HEAD: 08906747d29dffde555322b17bf4fe2e3d7d4ba7
Remote HEAD: b8e00ad5d563ec0555001490dbf8e6ef3f1fa6b9
Ahead by: 2
Behind by: 5
Result: blocked
Primary blocker: remote workflow mismatch
Secondary blocker: no observed hosted run for local HEAD
Local workflow: CI
Local workflow sha1: 77c1a6efbc86da0e43fe47a21cdcc09fddb03f2d
Remote workflow: InMyPocket CI
Remote workflow sha1: 6fab44cbd6636bfbe8cfcf940a75e8a70326b31f
Summary: No observed hosted run was found for local HEAD, and the remote default-branch workflow currently visible through GitHub does not match the local hosted proof lane.

Ahead commits:
- 0890674 fix: satisfy governed 30328 seed contract for hosted CI
- de656c0 ops: bootstrap high-agency governance (clean push)

Changed files:
- .github/workflows/ci.yml
- docs/SYNERGY_GENESIS.md
- docs/accepted-risks.md
- docs/api/FINANCE_SCHEMA.md
- docs/execution-plan-governance-kernel-then-demand-harness.md
- docs/governance-runtime-apply-controller-2026-04-16.md
- docs/harness-controller-validated-next-step-2026-04-16.md
- docs/harness-integrated-upgrade-2026-04-15.md
- docs/implementation-controller-next-slice-2026-04-15.md
- docs/implementation-ready-gap-assessment.md
- docs/live-smoke-checklist.md
- docs/mvp-operations.md
- docs/operator-evidence-bundle.md
- docs/plans/2026-04-13-senior-first-public-redesign.md
- docs/product-harness-status.md
- docs/publication-governance-spec-1.md
- docs/release-readiness-checklist.md
- docs/roadmap-slices.md
- package.json
- scripts/bootstrap-local.ps1
- scripts/capture-ui-evidence.ps1
- scripts/capture-ui-evidence.py
- scripts/check-port.ps1
- scripts/collect-ops-evidence.ps1
- scripts/import-legacy-json.ts
- scripts/live-smoke.ps1
- scripts/port-lib.ps1
- scripts/run-next-with-port.ps1
- scripts/run-powershell-script.mjs
- scripts/run-python-script.mjs
- scripts/show-external-proof-handoff.ts
- scripts/stripe-cli.ps1
- scripts/supabase-cli.ps1
- scripts/update-visual-baseline.ps1
- scripts/verify-ops-evidence.ts
- scripts/verify-supabase-policies.sql
- scripts/verify-visual-baseline.py
- scripts/write-hosted-attestation.ts
- src/app/admin/page.tsx
- src/app/api/admin/evidence/[evidenceId]/route.ts
- src/app/api/admin/logout/route.ts
- src/app/api/admin/unlock/route.ts
- src/app/api/founding-member/checkout/route.ts
- src/app/api/observations/route.ts
- src/app/api/stripe/webhook/route.ts
- src/app/api/waitlist/route.ts
- src/app/dashboard/page.tsx
- src/app/error.tsx
- src/app/favicon.ico
- src/app/founding-member/cancel/page.tsx
- src/app/founding-member/success/page.tsx
- src/app/globals.css
- src/app/layout.tsx
- src/app/loading.tsx
- src/app/login/page.tsx
- src/app/page.tsx
- src/app/printable/error.tsx
- src/app/printable/loading.tsx
- src/app/printable/page.tsx
- src/components/admin-preview-form.tsx
- src/components/admin-unlock-form.tsx
- src/components/auth-provider.tsx
- src/components/print-button.tsx
- src/components/product-comparison-table.tsx
- src/components/retailer-card.tsx
- src/components/section-card.tsx
- src/components/waitlist-form.tsx
- src/hooks/use-assets.ts
- src/lib/accepted-limits.ts
- src/lib/admin-auth.ts
- src/lib/admin-rate-limit.ts
- src/lib/admin-unlock-audit.ts
- src/lib/admin-unlock-feedback.ts
- src/lib/admin-upload.ts
- src/lib/analysis.ts
- src/lib/catalog.ts
- src/lib/compare.ts
- src/lib/comparison-scenarios.ts
- src/lib/demo-data.ts
- src/lib/domain.ts
- src/lib/env.ts
- src/lib/external-blockers.ts
- src/lib/external-proof-handoff.ts
- src/lib/founding-member-storage.ts
- src/lib/founding-member.ts
- src/lib/observation-evidence-store.ts
- src/lib/observation-feed.ts
- src/lib/observation-repository.ts
- src/lib/observation-storage.ts
- src/lib/operator-next-actions.ts
- src/lib/ops-evidence.ts
- src/lib/server-storage.ts
- src/lib/source-policy.ts
- src/lib/stripe.ts
- src/lib/supabase.ts
- src/lib/waitlist-events.ts
- src/lib/waitlist-form-content.ts
- src/lib/waitlist.ts
- src/middleware.ts
- src/types/database.ts
- tests/fixtures/smoke-evidence.pdf
- tests/governance-seed-30328-contract.test.ts
- tests/normalization.test.ts
- tests/publication-governance-lane-a.test.ts
- tests/visual-baseline/baseline-config.json
- tests/visual-baseline/home-desktop.png
- tests/visual-baseline/home-mobile.png
- tests/visual-baseline/printable-mobile.png
- tests/waitlist-harness-lane-a.test.ts
- tests/waitlist-lane-a.test.ts

Proof-critical changed files:
- .github/workflows/ci.yml
- docs/operator-evidence-bundle.md
- docs/product-harness-status.md
- docs/release-readiness-checklist.md
- package.json
- scripts/show-external-proof-handoff.ts
- scripts/verify-ops-evidence.ts
- scripts/write-hosted-attestation.ts
- src/lib/external-blockers.ts
- src/lib/external-proof-handoff.ts
- src/lib/operator-next-actions.ts
- src/lib/ops-evidence.ts

Preferred input order:
1. Workflow run URL
2. Artifact URL
3. Branch or PR URL

Recommended command set:
- git diff --stat origin/main..main -- .github/workflows/ci.yml scripts src tests package.json docs .ops-evidence
- git log --oneline origin/main..main
- git push origin HEAD:main
