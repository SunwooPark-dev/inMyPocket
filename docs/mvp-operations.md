# MVP Operations

## Daily runbook

1. Review the target store roster for the pilot ZIP clusters.
2. Manually validate public product-page prices for the 20 anchor items.
3. Save source URL, collected timestamp, store context, and scenario type for every record.
4. Run publish-gate checks before publishing a daily snapshot.
5. Publish the printable list and comparison dashboard only when coverage and provenance rules pass.

## Publish gate

- Source URL exists
- Collected timestamp exists and is not stale
- Store or ZIP context exists
- Price type exists
- Comparability grade exists
- Coverage rate is at least 80%, otherwise mark the basket incomplete
- Weekly ad values never mix with the base total

## Live source URL policy

- Only save `https://` URLs on the retailer's official public domain.
- Current MVP allowlist:
  - Kroger: `kroger.com`
  - ALDI: `aldi.us`
  - Walmart: `walmart.com`
- Subdomains are allowed if they stay under the official retailer domain.
- Login-gated URLs, coupon-clipping flows, and hidden endpoints are not valid sources.

## Storage model

- Manual observations are persisted in `price_observations` on Supabase Postgres.
- Public basket rendering should read from `published_price_observations`, not directly from `price_observations`.
- Raw evidence files are stored in the private `observation-evidence` bucket and linked through `observation_evidence`.
- Founding member signups and Stripe lifecycle state are stored in `founding_member_signups`.
- The dashboard merges stored observations over demo seed values for the same `store + item + priceType`.
- `price_observations`, `observation_evidence`, and `founding_member_signups` carry explicit deny policies for `anon` and `authenticated`.
- `storage.objects` also carries an explicit restrictive deny policy for the `observation-evidence` bucket.

## Admin access

- `/admin` requires unlock with `ADMIN_ACCESS_TOKEN`.
- Unlock sets an httpOnly cookie session.
- Observation read/write APIs and evidence download APIs require the same admin session.

## Payments

- Founding member checkout uses Stripe Checkout.
- Status changes are written by `/api/stripe/webhook`.
- `checkout.session.completed` marks paid.
- `checkout.session.expired` marks canceled.
- `invoice.payment_failed` marks payment failed for recurring follow-up states.
- In the current environment, payment proof is deferred until Stripe test-mode secrets are supplied.

## Migration

- Legacy JSON files are import-only.
- Dry run: `pnpm import:legacy -- --dry-run`
- Real import: `pnpm import:legacy`

## Local bootstrap

- Correct bootstrap script: `scripts/bootstrap-local.ps1`
- Correct webhook route for Stripe CLI forwarding: `/api/stripe/webhook`
