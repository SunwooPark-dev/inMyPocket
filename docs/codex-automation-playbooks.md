# Codex Automation Playbooks

Last refreshed: 2026-04-16

## Purpose

This document standardizes the first approved recurring Codex automation lanes for `inMyPoket`.

These playbooks focus on the repo's actual recurring pain points:

- evidence freshness drift
- release-readiness drift
- handoff gaps between proof generation and operator follow-up

## Guardrails

- Use automation only for repeatable follow-up work that already has a stable expected output.
- Do not depend on desktop-app-only browser or computer-use features.
- Keep prompts repo-specific and evidence-oriented.
- Open an inbox item rather than silently concluding that there is nothing to do.
- Treat `.ops-evidence`, `docs/release-readiness-checklist.md`, and `docs/product-harness-status.md` as the closeout backstop, not the automation output alone.

## Playbook 1: Release Readiness Follow-Up

- **Goal:** reopen the readiness lane when release docs or proof artifacts may have drifted
- **Who creates it:** the current repo operator when readiness drift becomes recurring enough to justify a standing reminder
- **Where it should run:** the current repo thread or repo-owned Codex automation destination
- **Suggested cadence:** weekly or before a planned handoff/release review
- **Prompt shape:**
  - inspect the latest readiness docs and evidence pointers
  - identify stale or contradictory status across `README.md`, `docs/product-harness-status.md`, `docs/release-readiness-checklist.md`, and `.ops-evidence`
  - produce a concise operator-facing follow-up note with blockers, outdated docs, and next verification steps
- **Expected output:**
  - one short summary of stale items
  - one flat list of required follow-up actions
  - explicit mention of whether payment remains deferred
- **Closeout artifact:** updated readiness docs or an operator-facing note that points to the exact doc/command follow-up
- **Fallback path:** if local verification is blocked, record the blocker and point to the missing artifact, permission, or environment dependency instead of marking the lane complete

## Playbook 2: Ops Proof Freshness Follow-Up

- **Goal:** prompt a new proof pass when evidence is aging out of trustworthiness
- **Who creates it:** the current repo operator when proof freshness is repeatedly becoming a manual follow-up burden
- **Where it should run:** the current repo thread or repo-owned Codex automation destination
- **Suggested cadence:** weekly or after materially relevant runtime/doc changes
- **Prompt shape:**
  - inspect the latest `.ops-evidence` pointers, release-health files, and operator-proof handoff state
  - call out stale timestamps, missing hosted provenance, or new contradictions between docs and artifacts
  - recommend whether to run `pnpm ops:evidence` and `pnpm ops:verify`
- **Expected output:**
  - current freshness verdict
  - stale reasons if any
  - exact next command/operator step if a refresh is needed
- **Closeout artifact:** refreshed `.ops-evidence` state or an operator-facing note that explains why refresh is blocked or deferred
- **Fallback path:** if proof cannot be refreshed locally, point to the missing hosted artifact, access, or environment dependency and leave an explicit handoff note

## Naming Convention

Use short names that match the operator outcome, for example:

- `Release Readiness Follow-Up`
- `Ops Proof Freshness Follow-Up`

## What Not To Automate Yet

- PR review-comment handling as a default recurring automation
- browser-driven UI review loops
- SSH/devbox maintenance flows
- broad personal productivity reminders unrelated to repo proof or handoff

## Related Templates

- `docs/templates/codex-automation-release-readiness.md`
- `docs/templates/codex-automation-ops-proof-freshness.md`
- `docs/codex-operator-bootstrap.md`
