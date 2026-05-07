# Security Boundary Rules

## Summary

This document defines the repo-wide boundary rules for public, admin, and operator code paths.

These rules are global defaults, not optional guidance.

## Public Surface Rules

- Public pages must not instantiate a direct Supabase browser/public client for governed basket reads.
- Public basket data must be resolved on the app server and rendered from a server-owned read path.
- Public code must not import mixed admin/operator storage barrels when a narrower server-only module exists.
- Public runtime must not expose service credentials, evidence routes, or base-table access paths.
- Public UX may show governed published data, but it must not reveal internal review, evidence, or operator-only controls.
- Direct payment checkout and Stripe webhook routes are not part of the active runtime and must not be reintroduced without an explicit product decision.

## Admin Surface Rules

- Manual observation save/read routes must live under `/api/admin/*`.
- Admin routes must require the existing admin authorization gate before reading or writing data.
- Evidence download routes must stay under the admin namespace and remain blocked when unauthenticated.
- Internal evidence rows must not be described as public publication events.

## Storage and Data Rules

- `price_observations` remains an internal evidence/base table.
- `published_price_observations` remains the governed publication surface.
- `anon`, `authenticated`, and `public` must not have direct grants on `published_price_observations`; use `pnpm ops:harden-published-view:apply` to repair drift.
- Direct-grant repair tooling and smoke/evidence failure output must print only sanitized summaries and must not print Supabase keys, raw REST headers, or raw REST response bodies.
- `.ops-evidence/` is local/generated and must not be committed or used as an external handoff without review; prefer sanitized `pnpm ops:handoff` output or hosted CI artifact links.
- App code must keep a hard distinction between “public published data” and “internal evidence rows”.
- New code must not collapse public and admin storage concerns into one convenience barrel unless that barrel is server-only and narrow by contract.

## Review Triggers

Treat any of the following as boundary regressions:

- a client component importing a Supabase read helper for basket data
- a public route fetching `/api/admin/*`
- an admin write path living outside `/api/admin/*`
- a shared barrel re-exporting both public and admin data helpers without clear isolation
- docs or smoke claiming a manual save is the same as publication

## Automated Guard

- Run `pnpm boundary:check` locally when boundary-sensitive files change.
- Run `pnpm secret:check` before handing off code that touched scripts, docs, configs, or environment handling.
- CI runs both commands before typecheck so legacy route strings, direct-read regressions, local artifact tracking, and committed secret patterns fail early.
- `pnpm boundary:check` also fails if local/generated artifacts such as `.ops-evidence/`, `tmp-*`, `supabase/.temp/`, or non-example `.env*` files are tracked.
- `pnpm secret:check` scans tracked text files for common committed token/key patterns and long sensitive env assignments.

## Current Contract

- Public basket reads are server-side only.
- Admin observation writes use `/api/admin/observations`.
- The public app no longer depends on a direct Supabase publishable-key read path for governed basket data.
- Publishable-key direct REST reads on `published_price_observations` must be denied or return zero governed rows.
