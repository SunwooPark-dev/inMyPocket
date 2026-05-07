# Surgical Staging Manifest — Operator Observation Queue

**Created:** 2026-04-29 22:27:12 local runtime  
**Repo:** `/mnt/c/Users/sunwo/workspace/inMyPoket`  
**Branch:** `codex/hosted-proof-pr`  
**Mode:** manifest only — no code edits, no staging, no commit, no push/pull/rebase/merge/reset/clean.

## Goal

Make the operator observation queue slice safe for a later surgical staging step by defining exactly which files/hunks may be staged and which dirty worktree changes must remain excluded.

This manifest intentionally does **not** perform `git add`.

## Read-only checks run

Required checks were run read-only:

1. `git status --short --branch`
2. `git diff -- src/lib/operator-observation-queue.ts`
3. `git diff -- tests/operator-observation-queue.test.ts`
4. `git diff -- src/lib/admin-observation-storage.ts`
5. `git diff -- src/app/admin/page.tsx`
6. `git diff -- package.json`
7. `git diff -- tsconfig.json`

Additional workspace checks:

- `pwd`
- `git rev-parse --show-toplevel`
- `date +%Y-%m-%d_%H%M%S`

## Repo state snapshot

```text
repo root: /mnt/c/Users/sunwo/workspace/inMyPoket
branch: codex/hosted-proof-pr...origin/codex/hosted-proof-pr [ahead 1, behind 1]
git status --short --branch line count: 172
```

The worktree remains broadly dirty. This slice must not use broad staging.

## Include files

### 1. `src/lib/operator-observation-queue.ts`

**Verdict:** include whole file.  
**Git state:** untracked; `git diff -- src/lib/operator-observation-queue.ts` is empty because the file is not tracked yet.  
**Observed size:** 300 lines.  
**Reason:** this is the core queue logic for private operator diagnostics, queue state formatting, summary counts, and next-action guidance. It is directly owned by this slice.

**Staging method recommendation:**

```bash
git add src/lib/operator-observation-queue.ts
```

### 2. `tests/operator-observation-queue.test.ts`

**Verdict:** include whole file.  
**Git state:** untracked; `git diff -- tests/operator-observation-queue.test.ts` is empty because the file is not tracked yet.  
**Observed size:** 256 lines.  
**Reason:** focused regression coverage for the operator observation queue. Directly validates private diagnostics, next-action behavior, and stored observation mapping. It is directly owned by this slice.

**Staging method recommendation:**

```bash
git add tests/operator-observation-queue.test.ts
```

### 3. `src/lib/admin-observation-storage.ts`

**Verdict:** include whole file.  
**Git state:** untracked; `git diff -- src/lib/admin-observation-storage.ts` is empty because the file is not tracked yet.  
**Observed size:** 7 lines.  
**Reason:** supporting boundary shim that lets admin UI import observation storage through an admin-owned module path. Required by `src/app/admin/page.tsx` after the queue UI split.

Current file content shape:

```ts
export {
  createEvidenceDownloadUrl,
  getRecentStoredObservations,
  readStoredObservations,
  saveImportedObservation,
  saveObservation
} from "./observation-storage.ts";
```

**Staging method recommendation:**

```bash
git add src/lib/admin-observation-storage.ts
```

### 4. `src/app/admin/page.tsx`

**Verdict:** include only queue-related hunks via patch mode.  
**Git state:** tracked modified.  
**Reason:** this file is only partially owned by this slice. After the prior split, remaining observed diff is queue-specific, but the file lives in a broadly dirty worktree and must still be staged with hunk review rather than broad file staging.

**Staging method recommendation:**

```bash
git add -p src/app/admin/page.tsx
```

Accept only hunks matching the `include_hunks` section below. If any hunk contains payment/readiness cleanup, unrelated copy changes, docs-only references, or anything outside operator observation queue UI wiring, answer `n` and stop for review.

## Include hunks

### `src/app/admin/page.tsx` hunk A — imports and queue derivation

**Include:** yes.

Expected hunk shape:

```diff
-import { getRecentStoredObservations } from "../../lib/server-storage";
+import { getRecentStoredObservations } from "../../lib/admin-observation-storage";
+import {
+  buildOperatorObservationQueue,
+  formatOperatorObservationQueueState,
+  getOperatorObservationQueueNextAction,
+  summarizeOperatorObservationQueue
+} from "../../lib/operator-observation-queue";
...
-    unlocked && isSupabaseConfigured() ? await getRecentStoredObservations() : [];
+    unlocked && isSupabaseConfigured() ? await getRecentStoredObservations(50) : [];
+  const privateObservationQueue = buildOperatorObservationQueue(recentObservations);
+  const privateObservationQueueSummary = summarizeOperatorObservationQueue(privateObservationQueue);
+  const privateObservationQueueNextAction = getOperatorObservationQueueNextAction(
+    privateObservationQueueSummary
+  );
+  const privateObservationQueueItemsById = new Map(
+    privateObservationQueue.items.map((item) => [item.observation.id, item])
+  );
```

**Reason:** wires the admin page to the new admin-safe storage facade and derives private queue diagnostics from recent stored observations.

### `src/app/admin/page.tsx` hunk B — private observation queue UI

**Include:** yes.

Expected hunk shape:

```diff
-        <SectionCard eyebrow="Saved live records" title="Recent stored observations">
+        <SectionCard eyebrow="Private observation queue" title="Recent stored observations">
+          <p className="hero__lede">
+            These saved records stay private until governed publication approves and snapshots them.
+          </p>
+          <div className="badge-row">
+            ... Stored / Needs review / Clear / priority state badges ...
+          </div>
+          <p className="hero__lede">
+            Next action: {privateObservationQueueNextAction.label} ...
+          </p>
...
-            <p className="hero__lede">No live manual observations stored yet. Saved records will appear here.</p>
+            <p className="hero__lede">No private manual observations stored yet. Saved records will appear here.</p>
...
+                const queueItem = privateObservationQueueItemsById.get(observation.id);
+                const states = queueItem?.states ?? [];
...
+                      {states.length > 0 ? (
+                        states.map((state) => (
+                          <span key={state} className="pill pill--warn">
+                            {formatOperatorObservationQueueState(state)}
+                          </span>
+                        ))
+                      ) : (
+                        <span className="pill pill--quiet">Private queue: no local warning</span>
+                      )}
...
-                      <span className="pill pill--quiet">No evidence</span>
+                      <span className="pill pill--warn">No evidence</span>
```

**Reason:** adds operator-facing private queue diagnostics without publishing private saves. The `No evidence` warning is part of the local private queue review signal.

## Exclude files

### `package.json`

**Verdict:** exclude.  
**Reason:** dirty but not owned wholesale by this queue slice. The `test` script contains a same-line mixed change that includes `tests/operator-observation-queue.test.ts` plus broader prior governance/script changes (`boundary:check`, `secret:check`, smoke/hardening scripts, additional tests, Stripe removal). Staging the whole file would expand the slice.

**Staging method recommendation:**

```text
do not stage package.json
```

If the test script registration is desired later, create a separate ownership slice for package scripts and dependency cleanup.

### `tsconfig.json`

**Verdict:** exclude.  
**Reason:** observed diff is full-file line-ending churn with no semantic TypeScript option change. Including it would pollute review.

**Staging method recommendation:**

```text
do not stage tsconfig.json
```

### Broader dirty tree

**Verdict:** exclude.  
**Reason:** `git status --short --branch` reports 172 lines, including unrelated docs, workflows, generated/evidence files, scripts, API routes, and other libraries/tests. They are not required for the operator observation queue slice.

**Examples to exclude:**

- unrelated docs and `.github/workflows/*`
- generated evidence or local artifacts
- `package-lock.json`, `pnpm-lock.yaml`, broad script changes
- files under `docs/`, `scripts/`, `src/app/api/admin/observations/`, other `src/lib/*`, or `tests/*` unless separately ownership-approved
- any file not directly required by operator observation queue

## Exact later staging sequence

Only if the user explicitly allows staging in an execution step:

```bash
git add src/lib/operator-observation-queue.ts
git add tests/operator-observation-queue.test.ts
git add src/lib/admin-observation-storage.ts
git add -p src/app/admin/page.tsx
```

For `git add -p src/app/admin/page.tsx`:

- accept hunk A only if it matches imports + queue derivation above
- accept hunk B only if it matches private queue UI above
- reject any hunk that includes unrelated payment/readiness cleanup, package/script changes, docs, workflow, or generated artifact edits

## Verification commands after staging

After the later staging step, verify the cached diff before any commit:

```bash
git diff --cached --stat
git diff --cached --name-only
git diff --cached
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
pnpm boundary:check && pnpm secret:check && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Expected staged file names:

```text
src/app/admin/page.tsx
src/lib/admin-observation-storage.ts
src/lib/operator-observation-queue.ts
tests/operator-observation-queue.test.ts
```

If `package.json`, `tsconfig.json`, docs, workflows, generated files, or unrelated source/test files appear in `git diff --cached --name-only`, the staging is not commit-safe.

## Rollback-safe unstaging instructions

If a wrong file or hunk is staged, unstage only the mistaken path:

```bash
git restore --staged <file>
```

Examples:

```bash
git restore --staged package.json
git restore --staged tsconfig.json
git restore --staged src/app/admin/page.tsx
```

Do not use destructive cleanup commands. Do not run `git reset --hard`. Do not run `git clean`.

## Final warnings

```text
never use git add .
never use git add -A
never stage package.json for this slice
never stage tsconfig.json for this slice
never commit before reviewing git diff --cached
never push from the current ahead/behind branch state as part of this slice
```

## Blockers before commit

- Cached diff has not been created or reviewed yet.
- Branch remains `[ahead 1, behind 1]`; pull/rebase/merge/push must be a separate slice.
- `package.json` test script registration is intentionally excluded from this queue slice, so the focused queue test must continue to be run directly in verification.
- Broad dirty worktree remains; commit safety depends on surgical staging only.

## Recommended next action

Proceed only with the explicit execution step for surgical staging, using the exact allowed commands above. After staging, inspect `git diff --cached` and rerun focused + full verification before deciding whether commit is safe.
