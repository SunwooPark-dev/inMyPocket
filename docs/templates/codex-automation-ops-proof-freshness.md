# Automation Template: Ops Proof Freshness Follow-Up

Name: `Ops Proof Freshness Follow-Up`

## Intended use

Use as a recurring Codex automation for proof freshness checks after artifact-aging or doc/runtime changes.

## Destination

- preferred destination: current repo thread inbox item
- execution context: local repo context for `inMyPoket`

## Cadence

- weekly, or
- after materially relevant runtime, CI, or doc changes

## Prompt

Inspect the latest `.ops-evidence` pointers, release-health files, and operator-proof handoff state for `inMyPoket`. Call out stale timestamps, missing hosted provenance, or contradictions between docs and artifacts. Recommend whether to run `pnpm ops:evidence` and `pnpm ops:verify`, and state the exact next step.

## Expected output

- current freshness verdict
- stale reasons if any
- exact next command or operator follow-up

## Closeout rule

- if freshness is stale, point to the exact refresh command
- if docs drift from artifacts, name the doc that must be updated
- do not treat hosted proof as complete without observed hosted artifacts
