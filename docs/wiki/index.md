# Project Wiki Index

Last updated: 2026-04-23

## Hardening Handoff

- [Hardening State](./hardening-state.md): current boundary-hardening status, external blocker, finish criteria.
- [Hardening Execution Graph](./hardening-execution-graph.md): command-to-file-to-artifact flow for the Supabase direct-grant lane.
- [Codex Agent Handoff](./codex-agent-handoff.md): repo-local agent audit and current no-install decision.

## Current Operator Rule

The active local work is complete enough to hand off to a linked Supabase operator. The remaining blocker is external Supabase state:

```powershell
pnpm ops:show-hardening
pnpm ops:show-supabase-sql
pnpm ops:local-preflight
pnpm ops:harden-published-view:apply
pnpm smoke:local -SkipPayment
pnpm ops:evidence
pnpm ops:verify
```

Do not commit or externally share `.ops-evidence/` per-run bundles, browser profiles, screenshots, PDFs, tmp logs, or non-example `.env` files.
