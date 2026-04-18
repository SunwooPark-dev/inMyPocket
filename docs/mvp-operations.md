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

## Codex operator baseline

- Baseline refreshed on `2026-04-16` against the official [Codex changelog](https://developers.openai.com/codex/changelog).
- Recommended Codex CLI baseline for local operator workflows is `0.121.0` or newer. OpenAI published `Codex CLI 0.121.0` on `2026-04-15`.
- For ChatGPT-sign-in Codex sessions, use `gpt-5.4` for planning, merge-gate judgment, and final review.
- Use `gpt-5.4-mini` for lighter repository exploration and cheaper helper work. OpenAI added `gpt-5.4-mini` to the Codex app, CLI, IDE extension, and web on `2026-03-17`.
- Do not set new ChatGPT-sign-in defaults to `gpt-5.2-codex`, `gpt-5.1-codex-mini`, `gpt-5.1-codex-max`, `gpt-5.1-codex`, `gpt-5.1`, or `gpt-5`. OpenAI removed those models from the ChatGPT-sign-in picker on `2026-04-07` and from Codex on `2026-04-14`.
- If the recommended models are missing, update the Codex CLI, IDE extension, or Codex app first, then confirm account, plan, and environment availability before assuming the repo is overriding your model availability.

## Codex Start Here

- If evidence looks stale or docs disagree with artifacts, start with `docs/codex-operator-bootstrap.md`, then use the approved automation lane from `docs/codex-automation-playbooks.md`.
- If you discover durable repo truth during a handoff or repeated task, start with `docs/codex-operator-bootstrap.md`, then follow `docs/codex-memory-guidelines.md` and promote repo-wide behavior changes into docs.
- If you are unsure whether a Codex feature is safe to assume here, check `docs/codex-support-scope.md` before using it.
- If you want the rollout order for future Codex work, check `docs/codex-adoption-plan.md`.

## Codex support boundary

- This repo supports Codex-assisted code/document work and the operator bootstrap flow as current documented lanes.
- This repo treats automations, OMX-backed memory/state, GitHub review tooling, and image-generation tooling as partially supported: available in the tool surface, but only documented repo playbooks should be treated as standardized operator paths.
- This repo does not currently standardize app-level background computer use, the Codex in-app browser workflow, remote devbox over SSH, or broad plugin rollout as required operating assumptions.
- If recommended models are missing, check client version first, then confirm account/plan/environment availability before assuming the repo is overriding your setup.
- See `docs/codex-operator-bootstrap.md` for the default entrypoint, `docs/codex-support-scope.md` for the full supported / partial / out-of-scope matrix, `docs/codex-automation-playbooks.md` for approved recurring automation lanes, and `docs/codex-memory-guidelines.md` for durable context rules.

