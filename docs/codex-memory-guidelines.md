# Codex Memory Guidelines

Last refreshed: 2026-04-16

## Purpose

This document defines how to use Codex/OMX memory for this repo without turning durable context into stale clutter.

## Durable Memory Belongs Here

Store durable context in OMX project memory when it is:

- stable across many tasks
- expensive to rediscover
- important for consistent operator decisions
- not already clearer in a repo doc that should remain the source of truth

Examples:

- recurring operator constraints
- stable verification expectations
- known environment caveats that repeatedly affect execution

## Do Not Store These As Durable Memory

- transient task status that belongs in the current thread
- stale timestamps or once-off release verdicts
- personal preferences that are not repo-wide conventions
- anything that should instead be updated in `README.md` or `docs/*`

## Working Memory Rules

Use working memory for:

- current-task breadcrumbs
- temporary blockers
- short-lived investigation notes
- handoff fragments that will soon be promoted into a real doc or discarded

Prune or replace it once the task is complete.

## Source Of Truth Rules

- Repo docs win for stable operator workflows and project policy.
- Project memory supports repo docs; it should not silently fork them.
- If a durable note starts changing operator behavior, promote it into a repo doc.
- If a memory entry duplicates a current doc, delete or avoid the duplicate.

## Trigger Rules

Promote memory into repo docs when:

- the note changes operator behavior
- the note affects merge, release, or evidence-maintenance decisions
- the same fact is likely to matter in future handoffs

Prune or replace memory when:

- `pnpm ops:verify` establishes a newer canonical state
- `external-proof-handoff` blockers are resolved or replaced by newer evidence
- the note no longer makes sense without thread-local context

## Good Examples

- "Hosted CI provenance is informative but does not replace canonical release-health verification."
- "Payment remains deferred unless Stripe test-mode secrets are explicitly present and proven."

## Bad Examples

- "Latest release is green" without a date or source
- "Run this exact one-off command tomorrow" as a durable project rule
- copying full checklist text from `docs/release-readiness-checklist.md` into memory

## Review Rule

Whenever adding durable memory, ask:

1. Is this still likely to be true across future tasks?
2. Is memory the right home, or should a repo doc be updated instead?
3. Will another operator understand why this note exists without thread-specific context?

## Related Templates

- `docs/templates/codex-memory-bootstrap.md`
- `docs/codex-operator-bootstrap.md`
