task statement
- Verify real Supabase migration application, private bucket readiness, and Stripe Checkout/webhook end-to-end flow for inMyPoket.

desired outcome
- Confirm the app can connect to Supabase and Stripe in a real environment and complete a founding-member checkout plus admin evidence upload smoke.

known facts/evidence
- App now contains Supabase repository code, Stripe Checkout/webhook routes, admin unlock flow, and evidence upload handling.
- `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build`, and `pnpm import:legacy -- --dry-run` pass.
- Environment variables for Supabase, Stripe, APP_URL, and ADMIN_ACCESS_TOKEN are all currently missing in this shell.
- No `.env.local` file exists in the repo.
- `supabase` CLI and `stripe` CLI are not available on PATH in this environment.
- `supabase/config.toml` is absent; only `supabase/migrations/202604130001_inmypoket_foundations.sql` exists.

constraints
- Need real secrets and project linkage to run live smoke.
- Must not fake or simulate external verification as if it were real.
- Keep evidence private and avoid exposing signed URLs publicly.

unknowns/open questions
- Which Supabase project URL/key set should be used.
- Which Stripe test account and `price_id` should be used.
- Whether the user wants local `.env.local` or OS-level env vars for secrets.

likely codebase touchpoints
- `src/lib/server-storage.ts`
- `src/app/api/observations/route.ts`
- `src/app/api/founding-member/checkout/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/lib/admin-auth.ts`
