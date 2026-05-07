# Boundary Smoke Checklist

## Goal

Use this checklist whenever boundary-sensitive work touches public basket reads, admin routes, or operator evidence.

## Public Read Checks

1. Confirm homepage and printable routes still render with governed published data.
2. Confirm public pages do not require a browser-side Supabase client for basket reads.
3. Confirm unsupported ZIP handling still returns the pilot-only message.
4. Confirm nearest-store context remains informational and does not reorder the cheapest result.

## Admin Route Checks

1. Confirm unauthenticated access to `/api/admin/observations` returns `401`.
2. Confirm authenticated admin save still succeeds through `/api/admin/observations`.
3. Confirm saved observation appears in recent observations after refresh.
4. Confirm unauthenticated access to `/api/admin/evidence/{uuid}` returns `401` without exposing signed URLs or evidence content.
5. Confirm malformed evidence ids return `404` without calling the evidence store.
6. Confirm valid-but-missing evidence ids return `404`.
7. Confirm valid evidence downloads return `307` with a `Location` header.
8. Confirm storage or signing failures map to `500` without public leakage.

## Publication Boundary Checks

1. Confirm a fresh manual admin save does not appear in `published_price_observations` before a governed publication step.
2. Confirm public pages still use governed published rows when they exist.
3. Confirm the explicit no-publishable-summary branch still renders honestly when none exist.
4. Confirm publishable-key direct REST reads on `published_price_observations` are denied or return zero governed rows.
5. If direct governed rows are returned, run `pnpm ops:harden-published-view:apply` from a linked Supabase environment and rerun smoke.
6. Confirm `pnpm ops:harden-published-view:verify` reports `forbidden_direct_grant_count = 0` and `service_role_select_grant_count = 1`.

## Regression Commands

```powershell
pnpm boundary:check
pnpm secret:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm smoke:local -SkipPayment
```

For evidence smoke/debug runs, capture and inspect the `Location` header rather than treating the body as the success signal, and do not print or persist admin cookies, signed URLs, raw Supabase REST response bodies, or evidence body contents in repo-local debug artifacts.
