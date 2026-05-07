# Commit-ready Patch Manifest — Operator Observation Queue

**Created:** 2026-04-29 19:42:49 local runtime  
**Repo:** `/mnt/c/Users/sunwo/workspace/inMyPoket`  
**Branch:** `codex/hosted-proof-pr` (`ahead 1, behind 1` versus origin at audit time)  
**Mode:** small ownership split + verification preparation

## Goal

Prepare the smallest commit-ready slice for the private operator observation queue in the admin console, without absorbing unrelated payment/readiness cleanup or broad dirty-worktree changes.

This slice should make private stored observations easier for the operator to triage by surfacing:

- total stored records
- needs-review count
- clear count
- priority warning states
- next action CTA
- per-record local warning pills

## Ownership manifest

### Include in this slice

1. `src/lib/operator-observation-queue.ts`
   - **Verdict:** owned.
   - **Reason:** new pure queue classifier/summarizer/CTA module for private observation triage.
   - **Commit role:** production logic.

2. `tests/operator-observation-queue.test.ts`
   - **Verdict:** owned.
   - **Reason:** focused tests for queue classification, summary, and next-action CTA.
   - **Commit role:** regression coverage.

3. `src/app/admin/page.tsx`
   - **Verdict:** partially owned.
   - **Owned hunks only:**
     - import `getRecentStoredObservations` from `../../lib/admin-observation-storage`
     - import queue helpers from `../../lib/operator-observation-queue`
     - fetch recent observations with explicit limit `50`
     - build queue, summary, next action, and ID lookup map
     - change saved-record section label to `Private observation queue`
     - add summary badge row
     - add `Next action: ...` CTA copy
     - add per-record queue state badges
     - change missing-evidence state from quiet to warning
     - change empty copy from `live` to `private`
   - **Explicitly excluded/restored:** runtime readiness/payment text and env readiness item cleanup. The unrelated payment/readiness hunk was restored so this diff now stays focused on queue ownership.

4. `src/lib/admin-observation-storage.ts`
   - **Verdict:** owned supporting dependency.
   - **Reason:** tiny admin-specific barrel that re-exports admin-safe observation storage functions from `observation-storage.ts`. It keeps admin route/page imports off the mixed `server-storage` barrel and aligns with `scripts/check-boundaries.mjs` rule: active admin routes must use `admin-observation-storage`, not `server-storage`.
   - **Commit role:** boundary-compatible import adapter.

5. `.hermes/plans/2026-04-29_185339-repo-state-ledger-ownership-split.md`
   - **Verdict:** optional include.
   - **Reason:** planning artifact created before this manifest. Include only if the commit policy allows Hermes planning provenance in the same commit.

6. `.hermes/plans/2026-04-29_192519-ownership-audit-operator-observation-queue.md`
   - **Verdict:** optional include.
   - **Reason:** read-only ownership audit artifact. Include only if planning provenance is desired.

7. `.hermes/plans/2026-04-29_194249-commit-ready-operator-observation-queue-manifest.md`
   - **Verdict:** optional include.
   - **Reason:** this manifest.

### Exclude from this slice

Do not include broad dirty-worktree changes outside the files above. In particular, do not stage unrelated docs, generated evidence, workflow files, local artifacts, or payment/readiness cleanup hunks.

`package.json` and `tsconfig.json` are currently dirty but are **not owned wholesale by this queue slice**. `package.json` contains a same-line `test` script change that includes `tests/operator-observation-queue.test.ts` mixed with broader prior governance/script changes; stage it only via an explicit hunk/line-level decision in a separate ownership pass. `tsconfig.json` appears as line-ending churn and should not be included in this slice unless separately justified.

## Current split result

`src/app/admin/page.tsx` was rechecked after the split. Its remaining diff is queue-specific:

- import changes for admin-safe storage + queue helpers
- queue derivation variables
- private observation queue UI section
- no remaining runtime readiness/payment text hunk in this file diff

## Exact next verification commands

Run after ownership confirmation:

```bash
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
pnpm boundary:check
pnpm secret:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Equivalent full ladder:

```bash
pnpm boundary:check && pnpm secret:check && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Expected risk points during verification

1. **Boundary check:** should pass only if `src/lib/admin-observation-storage.ts` is included with the admin page import change.
2. **Typecheck:** may reveal type mismatches between stored observation shape and queue helper input.
3. **Lint:** may flag formatting in the large JSX hunk.
4. **Build:** may surface Next/server component import boundaries.
5. **Dirty tree:** branch remains `ahead 1, behind 1`; do not pull/rebase/merge/reset/clean during this slice.

## Blocker conditions

Stop and re-audit before staging/commit if any of these occur:

- `src/app/admin/page.tsx` diff regains payment/readiness/runtime cleanup hunks.
- `src/lib/admin-observation-storage.ts` is missing while admin page imports it.
- full verification fails and logs point outside the owned file set.
- `git status` shows additional new/modified files caused by verification tools that are not clearly generated and intentionally ignored.
- branch divergence requires history reconciliation before pushing.

## Recommended next action

Verification was run after ownership split:

- `node --test --experimental-strip-types tests/operator-observation-queue.test.ts` → pass, 3/3 tests.
- `pnpm boundary:check && pnpm secret:check && pnpm typecheck && pnpm lint && pnpm test && pnpm build` → pass, 105/105 tests, production build completed.

Next, prepare a surgical staging checklist for only the owned/supporting files. If staging is performed manually, do not use broad `git add .`; stage the owned files/hunks only and keep `package.json`/`tsconfig.json` excluded unless a separate ownership decision explicitly includes them.
