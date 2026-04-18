# Automation Template: Release Readiness Follow-Up

Name: `Release Readiness Follow-Up`

## Intended use

Use as a recurring Codex automation for readiness drift checks before handoff or release review.

## Destination

- preferred destination: current repo thread inbox item
- execution context: local repo context for `inMyPoket`

## Cadence

- weekly, or
- manually before a planned release/handoff check

## Prompt

Inspect the latest readiness docs and evidence pointers for `inMyPoket`. Identify stale or contradictory status across `README.md`, `docs/product-harness-status.md`, `docs/release-readiness-checklist.md`, and `.ops-evidence`. Produce a concise operator-facing note with blockers, outdated docs, and exact next verification steps. Explicitly say whether payment remains deferred.

## Expected output

- one short stale-status summary
- one flat list of follow-up actions
- one explicit next verification step or command

## Closeout rule

- if repo truth changed, update the relevant repo doc
- if evidence is stale, point to `pnpm ops:evidence` and `pnpm ops:verify`
- do not silently conclude that there is nothing to do
