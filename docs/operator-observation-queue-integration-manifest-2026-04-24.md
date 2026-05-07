# Operator Observation Queue Integration Manifest — 2026-04-24

## Purpose

Prepare the local operator-usability slice for safe integration without accidentally sweeping the repository's pre-existing dirty state into a commit or PR.

## Slice intent

Make the private observation queue easier to operate locally while keeping private saves separate from governed publication.

Operator-visible diagnostics covered by the slice:

- missing evidence
- dangling evidence metadata
- ambiguous normalization
- duplicates
- stale records
- publication errors / publication metadata

## Direct slice files

New files:

- `src/lib/operator-observation-queue.ts`
- `tests/operator-observation-queue.test.ts`

Modified files with slice changes:

- `src/app/admin/page.tsx`
- `src/components/admin-preview-form.tsx`
- `src/lib/observation-repository.ts`
- `package.json`

## Important integration warning

Do **not** run a broad staging command such as:

```bash
git add .
git add -A
git add package.json src/app/admin/page.tsx src/lib/observation-repository.ts
```

Reason: the repository currently has extensive pre-existing dirty state. Several files touched by this slice also contain unrelated existing edits in the same file:

- `package.json` contains unrelated script/dependency changes mixed with the operator test script update.
- `src/app/admin/page.tsx` contains unrelated readiness/payment-copy changes mixed with the private queue UI surface.
- `src/lib/observation-repository.ts` contains public Supabase client / source quality changes mixed with the mapper metadata fix.

A safe commit must stage only the slice-specific hunks, or be built in a clean worktree from a known base.

## Recommended safe integration path

1. Create a clean branch/worktree from the intended base commit.
2. Apply only the operator queue slice:
   - add `src/lib/operator-observation-queue.ts`
   - add `tests/operator-observation-queue.test.ts`
   - add the private queue UI surface to `src/app/admin/page.tsx`
   - add the private/governed save success copy to `src/components/admin-preview-form.tsx`
   - add/export `mapStoredObservationRecord()` metadata preservation in `src/lib/observation-repository.ts`
   - add `tests/operator-observation-queue.test.ts` to the package test command, without sweeping unrelated script changes
3. Run verification:

```bash
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

4. Only after the clean worktree is green, commit with a message similar to:

```text
feat(admin): surface private observation queue diagnostics

- Add private operator queue diagnostics for missing evidence, duplicates, stale rows, ambiguous normalization, and publication metadata
- Preserve stored observation governance metadata for local operator diagnostics
- Add targeted node:test coverage for queue states and mapper metadata
```

## Current local verification facts

The dirty working tree state passed the following commands after the review fixes:

```bash
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Observed result:

- targeted operator queue test: 2/2 passing
- full test suite: 104/104 passing
- typecheck: exit 0
- lint: exit 0
- production build: exit 0

## Hosted/live proof

No hosted/live proof was executed for this slice.

## Integration recommendation

Preferred next action: clean-worktree reconstruction or careful hunk-only staging.

Do not merge or PR directly from the current dirty state until the slice has been separated from unrelated edits.
