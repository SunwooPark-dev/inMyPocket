# Accepted Risks

## Summary

This ledger records risks that are currently accepted, explicitly deferred, or waiting on external input.

Use this file as the operator-facing source of truth for:

- what is intentionally not solved yet
- why it is currently acceptable
- what would reopen the issue

## Public UX

### Weekly updates lane stays non-payment until Stripe proof is reopened

- **Status:** accepted for the current environment
- **Reason:** Stripe checkout proof is still deferred, but the product still needs a live public weekly-updates signup path
- **Current treatment:** the public page keeps the weekly-updates form visible and routes non-payment signups through `/api/waitlist` when checkout is unavailable
- **Why acceptable:** users still get a working signup path while payment proof remains out of scope for the current merge gate
- **Reopen when:** Stripe payment proof is ready and product messaging should change from the non-payment waitlist lane to the paid founding-member lane

### Printable note density on non-exact items

- **Status:** accepted
- **Reason:** some items still need explanatory notes when the match is estimated or near-size
- **Current treatment:** notes are hidden for exact matches and shown only when transparency is needed
- **Why acceptable:** this preserves trust without turning the printable route back into a dense report
- **Reopen when:** there is a better way to signal near-match reasoning without any extra per-row text

## Operations

### Admin unlock throttling is not distributed

- **Status:** accepted MVP risk
- **Reason:** current lockout behavior is sufficient for the pilot but not durable across multiple runtimes
- **Current treatment:** local/process-level throttling with lockout and retry-after behavior
- **Why acceptable:** this is adequate for the current internal/admin operator surface
- **Reopen when:** the product needs stronger abuse controls across multiple instances or public exposure increases

### Supabase proof is collected from multiple evidence sources

- **Status:** accepted documentation gap
- **Reason:** policy and bucket proof were gathered through CLI query output, REST checks, and smoke results rather than one single operator artifact
- **Current treatment:** `pnpm ops:evidence` now writes an immutable per-run evidence bundle and refreshes `.ops-evidence/LATEST.md`, while the underlying proof still comes from scripts, smoke output, and live checks
- **Why acceptable:** the underlying proof is still available and reproducible
- **Reopen when:** the operator evidence bundle falls out of sync with the underlying proof steps

## Payment

### Stripe payment proof deferred

- **Status:** explicitly deferred
- **Reason:** the current environment is missing:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_ID_FOUNDING_MEMBER`
- **Current treatment:** payment is excluded from the current merge gate and release-readiness claim
- **Why acceptable:** public UX and operations proof can still progress independently
- **Reopen when:** Stripe test-mode secrets are supplied and checkout/webhook proof can be collected

## Verification

These risks are considered current and accepted only while the following remain true:

- `pnpm typecheck` passes
- `pnpm lint` passes
- `pnpm build` passes
- `pnpm smoke:local -SkipPayment` continues to pass
