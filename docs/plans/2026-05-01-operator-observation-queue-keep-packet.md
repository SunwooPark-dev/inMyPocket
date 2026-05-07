# Operator observation queue keep packet — 2026-05-01

## Decision

`keep_candidate_with_staging_caveat`.

This bucket is aligned with the current operator-first MVP lane: it makes saved manual observations easier to review before any governed publication step. It does not re-open payment/checkout and does not expand the public consumer surface.

Do not make a repo-wide commit from the current dirty tree. If this bucket is committed later, stage only the allowlisted paths below plus any explicitly accepted plan docs.

## Allowlisted keep-set

Application and tests:

- `src/app/admin/page.tsx`
  - Adds a private observation queue summary to the admin page.
  - Shows stored count, review count, clear count, priority warning states, and next action.
  - Keeps saved observations private-facing; it does not publish rows to the public comparison path.
- `src/lib/admin-observation-storage.ts`
  - Small admin-facing facade over observation storage helpers.
- `src/lib/operator-observation-queue.ts`
  - Centralizes private queue diagnostics:
    - missing evidence
    - ambiguous normalization
    - duplicate publication keys
    - stale records
    - publication metadata errors
  - Produces non-destructive operator next actions.
- `tests/operator-observation-queue.test.ts`
  - Covers the private diagnostics, summary counts, next actions, governed-public selector boundary, and admin route guardrails.
- `src/app/api/admin/observations/route.ts`
  - Untracked route currently present in the bucket.
  - Provides admin-only GET/POST for recent/saved observations.
  - Must be staged explicitly if accepted; it is not included in `git diff --cached` yet.

Optional docs:

- `docs/plans/2026-05-01-operator-observation-queue-keep-packet.md`
  - This packet.

## Current path-scoped evidence

Status:

```text
M  src/app/admin/page.tsx
A  src/lib/admin-observation-storage.ts
A  src/lib/operator-observation-queue.ts
AM tests/operator-observation-queue.test.ts
?? docs/plans/2026-05-01-operator-observation-queue-keep-packet.md
?? src/app/api/admin/observations/route.ts
```

Note: `tsconfig.json` remains modified outside this bucket from Next typegen/tooling and is intentionally excluded.

Size:

```text
src/app/admin/page.tsx                   90 insertions, 32 deletions
src/lib/admin-observation-storage.ts      7 insertions
src/lib/operator-observation-queue.ts   300 insertions
tests/operator-observation-queue.test.ts 314 insertions
src/app/api/admin/observations/route.ts 164 lines, untracked
docs/plans/2026-05-01-operator-observation-queue-keep-packet.md 122 lines, untracked
```

Verification:

```text
git diff --check HEAD -- <B bucket paths>
exit 0

node --test --experimental-strip-types tests/operator-observation-queue.test.ts
5/5 pass, 0 fail, exit 0

npm test -- --test-name-pattern="operator observation queue|admin observations route"
107/107 pass, 0 fail, exit 0

npm run typecheck
exit 0
```

Typecheck note:

- `npm run typecheck` regenerated Next type metadata and the repo still shows `M tsconfig.json` outside this bucket.
- That `tsconfig.json` change is already part of the broader dirty-tree/tooling bucket and should not be bundled into this operator queue commit unless separately accepted.

## Hold / do not bundle

Keep out of this bucket unless separately reviewed:

- payment/checkout deletion or copy changes
- Supabase migration/seed/Eugene cleanup
- broad README or docs/wiki changes
- `.hermes` state
- visual baseline/generated artifacts
- package metadata and lockfile changes
- unrelated waitlist files
- `tsconfig.json` typegen side effect

## Commit candidate command sequence

Only after explicit approval to stage/commit this bucket:

```bash
git add -- \
  src/app/admin/page.tsx \
  src/lib/admin-observation-storage.ts \
  src/lib/operator-observation-queue.ts \
  tests/operator-observation-queue.test.ts \
  src/app/api/admin/observations/route.ts \
  docs/plans/2026-05-01-operator-observation-queue-keep-packet.md

git diff --cached --check
npm run typecheck
npm test -- --test-name-pattern="operator observation queue|admin observations route"
```

Then inspect `git diff --cached --stat` before committing.

## Remaining questions before acceptance

1. Should the admin page display only the latest 25 observations to match the route, or keep the page at 50 for a wider operator view?
2. Should this route test coverage be split into a dedicated `tests/admin-observations-route.test.ts` before commit, or is colocating the two route guardrail tests in the operator queue test acceptable for this slice?

## Recommendation

Accept this bucket as the next small implementation slice. The route is now test-covered for the two highest-risk guardrails found during review: unauthenticated requests do not read/write private records, and unsafe source URLs are rejected before saving.
