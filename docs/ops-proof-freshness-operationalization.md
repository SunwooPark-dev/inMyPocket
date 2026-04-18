# Ops Proof Freshness Operationalization

Last refreshed: 2026-04-16

## Purpose

This runbook operationalizes the highest-value first-wave Codex lane: keeping proof artifacts and operator docs from drifting apart.

Use this when:

- `.ops-evidence` is newer than the docs that summarize it
- docs and artifacts disagree about the current non-payment state
- hosted provenance or external handoff state changed
- an operator needs to know whether a new proof refresh is required

## Trigger Conditions

Start this lane when any of the following is true:

- `.ops-evidence/LATEST.md` or `latest-run.json` is newer than the last meaningful doc update
- `release-health.json` says `freshnessStatus` is not the state implied by operator docs
- `operator-proof.json` contains blockers or next actions that are not reflected in `docs/release-readiness-checklist.md` or `docs/product-harness-status.md`
- a manual review finds contradictory claims between `.ops-evidence` and repo docs

## Start Here

1. Open `docs/codex-operator-bootstrap.md`.
2. Choose the `Evidence looks stale or docs disagree with artifacts` row.
3. Use the `Ops Proof Freshness Follow-Up` playbook from `docs/codex-automation-playbooks.md` or the template in `docs/templates/codex-automation-ops-proof-freshness.md`.

## Required Inputs

- `.ops-evidence/LATEST.md`
- `.ops-evidence/latest-run.json`
- `.ops-evidence/release-health.json`
- `.ops-evidence/operator-proof.json`
- `docs/release-readiness-checklist.md`
- `docs/operator-evidence-bundle.md`
- `docs/product-harness-status.md`
- `.github/workflows/ci.yml`

## Operator Procedure

1. Read the latest `.ops-evidence` pointers and identify the newest canonical evidence snapshot.
2. Compare the current snapshot against:
   - `docs/release-readiness-checklist.md`
   - `docs/operator-evidence-bundle.md`
   - `docs/product-harness-status.md`
3. Classify the outcome:
   - `current`: docs match current proof
   - `stale-docs`: docs lag behind current proof
   - `stale-proof`: proof itself needs refresh
   - `blocked`: local verification cannot establish the next truth state
4. If `stale-docs`, update the affected docs directly.
5. If `stale-proof`, point to `pnpm ops:evidence` and `pnpm ops:verify` as the next verification commands.
6. If `blocked`, leave an operator-facing note naming the missing artifact, permission, or environment dependency.

## Closeout Artifact

A successful run must leave one of these behind:

- updated repo docs that now match current proof, or
- an operator-facing note that points to the exact refresh command or blocker

The lane is not complete if the conclusion exists only in memory or only in an automation output.

## Verification Backstop

Before closing this lane, confirm:

- `.ops-evidence` and docs no longer contradict each other
- `docs/release-readiness-checklist.md` and `docs/product-harness-status.md` match the same verified state
- `docs/operator-evidence-bundle.md` points to canonical latest-run pointers, not stale hardcoded bundle paths
- if hosted proof is still local-simulated, docs continue to say so
- if payment is still deferred, docs continue to say so

## Fallback Path

If local verification cannot settle the state:

- capture the blocker in the operator-facing output
- keep the latest verified state explicit
- avoid upgrading assumptions from partial support to standard practice
- defer to the existing repo docs and handoff artifacts until the missing dependency is available

## Related Docs

- `docs/codex-operator-bootstrap.md`
- `docs/codex-automation-playbooks.md`
- `docs/templates/codex-automation-ops-proof-freshness.md`
- `docs/release-readiness-checklist.md`
- `docs/operator-evidence-bundle.md`
- `docs/product-harness-status.md`
