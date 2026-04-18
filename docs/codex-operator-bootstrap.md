# Codex Operator Bootstrap

Last refreshed: 2026-04-16

## Purpose

This is the default operator entrypoint for Codex usage in `inMyPoket`.

Use this runbook when you need to decide:

- whether a Codex capability is safe to assume in this repo
- which first-wave Codex lane to use
- what evidence or artifact closes the loop after a Codex-assisted follow-up

## Codex Start Here

| Trigger | Approved lane | Open first | Verification / backstop |
| --- | --- | --- | --- |
| Evidence looks stale or docs disagree with artifacts right now | Manual proof-freshness runbook | `docs/ops-proof-freshness-operationalization.md` | `.ops-evidence`, `pnpm ops:evidence`, `pnpm ops:verify`, `docs/release-readiness-checklist.md` |
| Evidence/readiness drift keeps recurring enough to justify automation | First-wave automation lane | `docs/codex-automation-playbooks.md` | The automation output must point back to `.ops-evidence`, the affected docs, or the exact refresh command |
| You discovered durable repo truth during handoff or repeated work | Memory hygiene lane | `docs/codex-memory-guidelines.md` | Promote repo-wide behavior changes into `README.md` or `docs/*`; do not leave them only in memory |
| You need to know whether a Codex feature is safe to assume here | Support boundary lane | `docs/codex-support-scope.md` | Follow the `Supported Now` / `Partially Supported` / `Not Yet In Scope` rules exactly |
| You need to know what Codex work comes next | Adoption lane | `docs/codex-adoption-plan.md` | Confirm the target packet is actually in scope and not deferred |
| You want a GitHub review workflow | Later-wave lane | `docs/codex-adoption-plan.md` | Treat as deferred until explicit review-volume or collaboration demand exists |

## Setup Order

1. Confirm the Codex support boundary in `docs/codex-support-scope.md`.
2. If proof is stale right now, use `docs/ops-proof-freshness-operationalization.md` first.
3. If the same kind of follow-up keeps recurring, use `docs/codex-automation-playbooks.md`.
4. If the task creates durable operational truth, use `docs/codex-memory-guidelines.md`.
5. If none of the above applies, fall back to the normal repo runbooks and keep Codex usage within the support boundary.

## First-Wave Automation Lane

Use the automation lane for recurring repo follow-up, not one-off proof reconciliation.

Current approved playbooks:

- `Release Readiness Follow-Up`
- `Ops Proof Freshness Follow-Up`

Closeout rule:

- the automation must produce an inbox item or operator-facing note
- that output must point to a concrete repo artifact or next command
- if the result changes repo truth, update the relevant doc rather than leaving the conclusion only in the automation output

## Memory Lane

Use memory only for durable context that is stable across tasks and not already better expressed in repo docs.

Closeout rule:

- if the note changes operator behavior, promote it into repo docs
- if the note is task-local or time-sensitive, keep it out of durable memory
- after `pnpm ops:verify` or a handoff closeout, prune or replace stale working-memory notes

## Verification Checklist

Before considering a Codex-assisted operator task complete, confirm:

- the chosen lane was allowed by `docs/codex-support-scope.md`
- the output points to one real repo artifact, doc update, or command-based next step
- `.ops-evidence` and docs are not left in contradiction
- `docs/release-readiness-checklist.md` and `docs/product-harness-status.md` still match the current verified state
- if repo-wide behavior changed, the source-of-truth doc was updated instead of relying on memory alone

## Blocked / Fallback Path

If local verification is blocked:

- record the blocker in the operator-facing output
- point to the missing artifact, permission, or environment dependency
- do not upgrade a partially supported lane into a default lane
- fall back to the existing repo docs and manual operator workflow until the blocker is removed

## Related Docs

- `docs/codex-support-scope.md`
- `docs/codex-adoption-plan.md`
- `docs/codex-automation-playbooks.md`
- `docs/codex-memory-guidelines.md`
- `docs/ops-proof-freshness-operationalization.md`
- `docs/codex-first-wave-acceptance.md`
- `docs/release-readiness-checklist.md`
- `docs/operator-evidence-bundle.md`
- `docs/product-harness-status.md`
