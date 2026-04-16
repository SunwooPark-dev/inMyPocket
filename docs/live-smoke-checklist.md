# Live Smoke Checklist

## 1. Fill local secrets

### Required now

Populate [`.env.local`](../.env.local) with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `ADMIN_ACCESS_TOKEN`
- `ADMIN_SESSION_SECRET`

### Optional for payment lane

Only add these when reopening Stripe payment proof:

Populate [`.env.local`](../.env.local) with:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_FOUNDING_MEMBER`

## 2. Prepare Supabase

Run from the project root:

```powershell
.\scripts\supabase-cli.ps1 login
.\scripts\supabase-cli.ps1 init
.\scripts\supabase-cli.ps1 link --project-ref <YOUR_SUPABASE_PROJECT_ID>
.\scripts\supabase-cli.ps1 db push
```

Notes:
- If `supabase/config.toml` already exists, `supabase init` is not needed.
- The migration creates the app tables and inserts the private bucket record for `observation-evidence`.
- Verify in the Supabase dashboard that the bucket exists and is private.
- Verify the deny policies exist on `price_observations`, `observation_evidence`, `founding_member_signups`, and `storage.objects` for `observation-evidence`.

## 3. Prepare Stripe

Only for the payment lane. Skip this section if Stripe secrets are not available yet.

```powershell
.\scripts\stripe-cli.ps1 login
.\scripts\stripe-cli.ps1 listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the emitted `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

## 4. Start the app

```powershell
pnpm dev
```

Optional automated local smoke:

```powershell
pnpm smoke:local
pnpm ops:evidence
pnpm ops:verify
```

`pnpm ops:evidence` writes an immutable evidence bundle under `.ops-evidence/ops-evidence-<timestamp>/`,
includes a machine-readable `manifest.json`, refreshes `.ops-evidence/LATEST.md` and `.ops-evidence/latest-run.json`,
records whether live Supabase proof was available, and exits non-zero if smoke or capture fails.
`pnpm ops:verify` consumes the latest pointers and bundle manifest, then writes canonical release-health verdicts to `.ops-evidence/release-health.json` and `.ops-evidence/release-health.md`.
If the current environment cannot launch headless browser capture, UI screenshot/PDF evidence is recorded as unavailable rather than silently treated as green.

## 5. Core smoke sequence

1. Open `/admin`
2. Unlock with `ADMIN_ACCESS_TOKEN`
3. Save a manual observation with an evidence file
4. Confirm recent observations show the saved record and evidence link
5. Go to `/`
6. Confirm dashboard still renders with stored observations preferred over seeds
7. Confirm public basket pages still work when reading from `published_price_observations`

## 6. Optional payment smoke

Only run when Stripe test-mode secrets are present.

1. Start founding member checkout
2. Complete a Stripe test payment
3. Confirm `/founding-member/success` shows the generic success screen
4. Confirm webhook-driven signup reconciliation succeeds

## Weekly updates endpoint

- When checkout is disabled, `POST /api/waitlist` remains the live weekly-updates capture path.
- Invalid payloads should return `400`.
- Valid payloads should return `200` with a success message.

## 7. Verification commands

```powershell
pnpm typecheck
pnpm test
pnpm lint
pnpm build
pnpm import:legacy -- --dry-run
```

## 8. Supabase live proof query

Run [scripts/verify-supabase-policies.sql](../scripts/verify-supabase-policies.sql) in the linked
Supabase project and confirm:

- deny policies exist for base tables
- `published_price_observations` exists
- `anon`/`authenticated` can only read the published view
- `observation-evidence` bucket is private

## Related proof docs

- [product-harness-status.md](./product-harness-status.md)
- [release-readiness-checklist.md](./release-readiness-checklist.md)
- [accepted-risks.md](./accepted-risks.md)
- [roadmap-slices.md](./roadmap-slices.md)
- [operator-evidence-bundle.md](./operator-evidence-bundle.md)
