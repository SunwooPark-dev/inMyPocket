# Accepted Risks

## Summary

This ledger records risks that are currently accepted, explicitly deferred, or waiting on external input.

Use this file as the operator-facing source of truth for:

- what is intentionally not solved yet
- why it is currently acceptable
- what would reopen the issue

## Public UX

### Weekly updates lane stays non-payment in the current business model

- **Status:** accepted for the current environment
- **Reason:** the product is currently non-payment, but it still needs a live public weekly-updates signup path
- **Current treatment:** the public page keeps the weekly-updates form visible and routes non-payment signups through `/api/waitlist` when checkout is unavailable
- **Why acceptable:** users still get a working signup path without tying weekly updates to checkout
- **Reopen when:** the product intentionally decides to introduce donations, ads gating, or a new paid offering that changes the public signup language

### Printable note density on non-exact items

- **Status:** accepted
- **Reason:** some items still need explanatory notes when the match is estimated or near-size
- **Current treatment:** notes are hidden for exact matches and shown only when transparency is needed
- **Why acceptable:** this preserves trust without turning the printable route back into a dense report
- **Reopen when:** there is a better way to signal near-match reasoning without any extra per-row text

### Nearest-store context is pilot-bounded and informational only

- **Status:** accepted for v1
- **Reason:** the product now shows the closest tracked store, but it still uses one canonical tracked branch per retailer and ZIP rather than a full branch directory
- **Current treatment:** nearest-store context is shown as supporting information only and never changes the cheapest-store ranking
- **Why acceptable:** this adds real-store context without turning the current pilot into a route-planning or full store-discovery product
- **Reopen when:** the product needs multiple tracked branches per retailer, address search, or branch-level route optimization

### Geolocation is session-explicit rather than persistent

- **Status:** accepted privacy guardrail
- **Reason:** browser geolocation is useful for nearest-store distance, but automatic cross-session reacquisition would be a behavior and privacy drift
- **Current treatment:** ZIP remains the canonical remembered input; geolocation runs only after an explicit click in the current session and is not stored as a durable auto-run state
- **Why acceptable:** users keep location context benefits without turning one click into persistent background location behavior
- **Reopen when:** the product intentionally adopts a stronger cross-session location experience with explicit privacy copy and consent handling

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
- **Current contract note:** a fresh admin observation save is internal evidence and recent-observation proof, not an automatic publication event for `published_price_observations`
- **Why acceptable:** the underlying proof is still available and reproducible
- **Reopen when:** the operator evidence bundle falls out of sync with the underlying proof steps

## Monetization

### Direct payment is not part of the current product model

- **Status:** accepted direction
- **Reason:** the project is currently exploring donation and advertising support rather than direct user payment
- **Current treatment:** the public product remains fully non-payment, and payment proof is no longer part of the active merge gate
- **Why acceptable:** public UX and operations proof can continue without tying core product access to checkout
- **Reopen when:** the product explicitly decides to reintroduce a paid membership or other direct payment lane

## Verification

These risks are considered current and accepted only while the latest verified local gate remains green:

- `pnpm typecheck` passes
- `pnpm lint` passes
- `pnpm test` passes
- `pnpm build` passes
- `pnpm smoke:local -SkipPayment` continues to pass when that lane is re-run
