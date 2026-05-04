# Live Smoke Checklist

## 0. Recommended Codex baseline

Use this baseline when an operator is running the smoke lane through Codex-assisted workflows:

- Codex CLI `0.121.0` or newer, matching the official Codex changelog entry from `2026-04-15`
- `gpt-5.4` for planning, verification, and final judgment
- `gpt-5.4-mini` for lighter exploration and cheaper helper passes
- Avoid `gpt-5.2-codex`, `gpt-5.1-codex*`, `gpt-5.1`, and `gpt-5` for new ChatGPT-sign-in Codex sessions because OpenAI removed them from the model picker on `2026-04-07` and from Codex on `2026-04-14`

## 1. Fill local secrets

### Required now

Populate [`.env.local`](../.env.local) with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `ADMIN_ACCESS_TOKEN`
- `ADMIN_SESSION_SECRET`

### Optional legacy Stripe config

The current milestone does not use direct payment. These keys are only relevant if a future product direction explicitly reintroduces a Stripe lane.

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

## 3. Legacy Stripe note

No Stripe preparation is required for the current milestone.

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
Current scope note: the automated local smoke lane proves route reachability and streamed loading-shell copy for `/` and `/printable`; it does not by itself prove the explicit governed no-publishable-summary empty-state branch end-to-end against a migrated DB state.

## 5. Core smoke sequence

1. Open `/admin`
2. Unlock with `ADMIN_ACCESS_TOKEN`
3. Save a manual observation with an evidence file
4. Confirm recent observations show the saved record and evidence link
5. Confirm the fresh manual save does not appear in `published_price_observations` before a governed publication step
6. Go to `/`
7. Confirm the homepage shows a 5-digit ZIP input as the primary location control
8. Confirm the homepage shows ZIP-first location controls in raw route smoke, and verify nearest-store plus weekly-updates bridge surfaces through UI evidence or interactive browser rendering rather than raw HTML alone
9. Confirm dashboard still renders with stored observations preferred over seeds
10. Confirm public basket pages respond and stream the expected loading-shell copy when reading from `published_price_observations`
11. Separately confirm the explicit governed empty-state copy renders when no publishable summary exists

## Location behavior

- ZIP remains the canonical location input for pricing and ranking.
- Browser geolocation is optional and only enriches nearest-store distance; it must not reorder the cheapest-store answer.
- Unsupported 5-digit ZIPs should show a pilot-area message instead of silently falling back.
- Browser memory should restore the last supported ZIP, but geolocation should only run after an explicit click in the current session.

## 6. Optional monetization follow-up

Direct payment is not part of the active product model.

- Do not run a Stripe payment smoke lane for the current milestone.
- If the product later adopts donation or advertising flows, create a separate monetization proof checklist instead of reusing the old payment gate.

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
