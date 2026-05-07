# Ownership Audit — Operator Observation Queue

**Mode:** read-only ownership audit only.  
**Implementation status:** no code changes, no tests/builds executed, no git staging/commit/push/pull/rebase/merge/reset/clean.  
**Allowed write:** this plan/report file only.

---

## Goal

Audit the candidate operator observation queue slice in the dirty `inMyPoket` repo and separate:

- files/hunks owned by the current operator observation queue slice
- files/hunks that appear unrelated
- blocker conditions before commit preparation or further implementation

The immediate engineering goal is **not feature development**. It is to decide whether the current slice can become a small, commit-ready patch without dragging in unrelated work.

---

## Repo root

Confirmed by read-only commands:

```bash
pwd
git rev-parse --show-toplevel
```

Result:

```text
/mnt/c/Users/sunwo/workspace/inMyPoket
```

---

## Branch state

Command:

```bash
git status --short --branch
```

Branch header:

```text
## codex/hosted-proof-pr...origin/codex/hosted-proof-pr [ahead 1, behind 1]
```

Interpretation:

- Branch is diverged from remote.
- Do **not** push, pull, merge, or rebase during this ownership split.
- Treat commit/push decisions as blocked until patch ownership is explicitly confirmed.

---

## Candidate files

Requested candidate files:

```text
src/lib/operator-observation-queue.ts
tests/operator-observation-queue.test.ts
src/app/admin/page.tsx
```

Existence checks:

```text
src/lib/operator-observation-queue.ts          300 lines, untracked
tests/operator-observation-queue.test.ts      256 lines, untracked
src/app/admin/page.tsx                        484 lines, tracked modified
```

`git diff -- src/lib/operator-observation-queue.ts` and `git diff -- tests/operator-observation-queue.test.ts` returned no output because both files are untracked. Use `git diff --no-index /dev/null <file>` only in a future manifest step if a full new-file diff is needed; it exits non-zero by design when differences exist.

---

## Required command results

### 1. `pwd`

```text
/mnt/c/Users/sunwo/workspace/inMyPoket
```

### 2. `git rev-parse --show-toplevel`

```text
/mnt/c/Users/sunwo/workspace/inMyPoket
```

### 3. `git status --short --branch`

Key result:

```text
## codex/hosted-proof-pr...origin/codex/hosted-proof-pr [ahead 1, behind 1]
```

Status remains very dirty: many tracked modifications/deletions plus untracked docs/scripts/source/tests and `.hermes/` plans.

### 4. `git diff -- src/app/admin/page.tsx`

Returned a tracked diff with four logical hunks:

1. import/storage swap and queue imports
2. recent observation loading + queue derivation + readiness item removals
3. direct-payment helper sentence shortening
4. saved records UI converted into private observation queue UI

Detailed hunk ownership is below.

### 5. `git diff -- src/lib/operator-observation-queue.ts`

No output because file is untracked.

### 6. `git diff -- tests/operator-observation-queue.test.ts`

No output because file is untracked.

### 7. `git ls-files --others --exclude-standard`

Includes the two candidate untracked files:

```text
src/lib/operator-observation-queue.ts
tests/operator-observation-queue.test.ts
```

Also includes many unrelated untracked files under `.hermes/`, `docs/`, `scripts/`, `src/`, and `tests/`. Do not treat the untracked set as one slice.

### 8. `rg "operator-observation|observation queue|operator queue|diagnostic|admin" src tests docs`

Ran both:

```bash
rg -n "operator-observation|observation queue|operator queue|diagnostic|admin" src tests docs -m 5
rg --no-ignore -n "operator-observation|operator observation|observation queue|operator queue|diagnostic|admin" src tests docs -m 5
```

Both returned exit code `1` with no output, even though exact file reads confirmed matching text in the candidate untracked files. Treat this as a search/tool visibility mismatch on the WSL/mounted workspace or ignore/index behavior. For this audit, exact `read_file`, `git diff`, and direct file existence checks are higher-confidence than the empty `rg` result.

### 9. `package.json` scripts

Confirmed executable scripts include:

```bash
pnpm dev
pnpm build
pnpm start
pnpm boundary:check
pnpm secret:check
pnpm lint
pnpm typecheck
pnpm test
pnpm smoke:public
pnpm smoke:local
pnpm ops:evidence
pnpm ops:verify
pnpm ops:local-preflight
pnpm visual:check
```

Primary verification ladder after ownership is confirmed:

```bash
pnpm boundary:check && pnpm secret:check && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Focused operator queue verification after ownership is confirmed:

```bash
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
```

---

## Per-file ownership verdict

### 1. `src/lib/operator-observation-queue.ts`

**Verdict:** owned.

Reasoning:

- New untracked source file dedicated to operator observation queue logic.
- Defines queue state model:
  - `missing_evidence`
  - `ambiguous_normalization`
  - `duplicate`
  - `stale`
  - `publication_error`
- Exposes queue helpers consumed by the admin page:
  - `buildOperatorObservationQueue`
  - `summarizeOperatorObservationQueue`
  - `getOperatorObservationQueueNextAction`
  - `formatOperatorObservationQueueState`
- Uses existing domain and observation feed primitives:
  - `PriceObservation`
  - `GovernedPublicObservation`
  - `observationKey`
  - `isGovernedObservationFresh`
  - `isPublicObservationEligible`

Ownership note:

- This file should be included in the current slice if the slice is “operator observation queue diagnostics / next action”.
- Because it is untracked, the next manifest must explicitly list it as a new source file.

### 2. `tests/operator-observation-queue.test.ts`

**Verdict:** owned.

Reasoning:

- New untracked focused test file importing `../src/lib/operator-observation-queue.ts`.
- Tests the candidate slice directly:
  - private diagnostics without publishing private saves
  - non-destructive next action guidance for empty and clear queues
  - stored observation mapper preserving governance metadata for queue publication checks
- Provides the focused verification target for the source file.

Ownership note:

- This file should be included in the current slice with the source file.
- It also touches behavior in `mapStoredObservationRecord` from `src/lib/observation-repository.ts`; if that dependency has separate dirty changes, do not include those automatically. Verify dependency assumptions via tests only.

### 3. `src/app/admin/page.tsx`

**Verdict:** partially owned.

Reasoning:

- The admin page includes direct queue integration hunks that are clearly part of this slice.
- It also includes readiness/payment text changes that are related to non-payment/operator direction but not directly required for the operator observation queue UI.
- Therefore the whole file should **not** be treated as owned. Only selected hunks are candidate-owned.

---

## `src/app/admin/page.tsx` hunk ownership

### Hunk 1 — imports

Location from diff:

```text
@@ -13,7 +13,13 @@ import {
```

Relevant changes:

```diff
-import { getRecentStoredObservations } from "../../lib/server-storage";
+import { getRecentStoredObservations } from "../../lib/admin-observation-storage";
+import {
+  buildOperatorObservationQueue,
+  formatOperatorObservationQueueState,
+  getOperatorObservationQueueNextAction,
+  summarizeOperatorObservationQueue
+} from "../../lib/operator-observation-queue";
```

**Verdict:** partially owned.

Owned portion:

- Importing `operator-observation-queue` helpers is owned by this slice.

Potentially related but separate portion:

- Switching `getRecentStoredObservations` from `server-storage` to `admin-observation-storage` is required for current compiled integration if `server-storage.ts` is deleted, but it belongs to a broader storage-boundary/admin-observation slice because `src/lib/admin-observation-storage.ts` is another untracked file outside the candidate list.

Recommendation:

- Do not commit this hunk until `src/lib/admin-observation-storage.ts` ownership is classified.
- If the current operator queue slice depends on `admin-observation-storage`, either include that file in a broadened manifest or split the queue work from the storage-boundary work.

### Hunk 2 — data loading, queue derivation, readiness item removals

Location from diff:

```text
@@ -27,14 +33,18 @@ export default async function AdminPage() {
```

Relevant queue changes:

```diff
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

Removed readiness checks in same hunk:

```diff
-    ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", Boolean(appEnv.supabasePublishableKey)],
-    ["STRIPE_SECRET_KEY", Boolean(appEnv.stripeSecretKey)],
-    ["STRIPE_WEBHOOK_SECRET", Boolean(appEnv.stripeWebhookSecret)],
-    ["STRIPE_PRICE_ID_FOUNDING_MEMBER", Boolean(appEnv.stripePriceIdFoundingMember)],
```

**Verdict:** partially owned.

Owned portion:

- `getRecentStoredObservations(50)` if the queue UI intentionally limits the private queue to recent records.
- `buildOperatorObservationQueue(recentObservations)`.
- `summarizeOperatorObservationQueue(privateObservationQueue)`.
- `getOperatorObservationQueueNextAction(privateObservationQueueSummary)`.
- `privateObservationQueueItemsById` map used for row-level queue state display.

Unrelated or separate-lane portion:

- Removing Supabase publishable key readiness visibility is not directly required for operator queue display.
- Removing Stripe readiness visibility aligns with the non-payment direction, but it is a product/governance cleanup, not queue diagnostics.

Recommendation:

- Split this hunk later if preparing a minimal commit.
- Keep the queue derivation lines with the queue slice.
- Move readiness item removals into a docs/product-governance or non-payment cleanup slice unless the user explicitly wants them bundled.

### Hunk 3 — direct payment helper sentence

Location from diff:

```text
@@ -98,7 +108,7 @@ export default async function AdminPage() {
```

Change:

```diff
-Live smoke helper: run `scripts/bootstrap-local.ps1`. Direct payment is not part of the current product model, so Stripe forwarding is only relevant if the business model changes in the future.
+Live smoke helper: run `scripts/bootstrap-local.ps1`. Direct payment is not part of the current product model.
```

**Verdict:** not owned by this queue slice.

Reasoning:

- This is a copy/governance cleanup about payment model, not operator observation queue behavior.
- It may be correct product direction, but it should not be bundled into the queue diagnostics slice.

Recommendation:

- Exclude from the operator observation queue commit manifest.
- If kept, document it under a separate non-payment/product-copy cleanup slice.

### Hunk 4 — saved records UI converted to private observation queue UI

Location from diff:

```text
@@ -388,39 +398,83 @@ export default async function AdminPage() {
```

Key owned changes:

- Section eyebrow changed:
  - from `Saved live records`
  - to `Private observation queue`
- Adds private/governed publication explanation.
- Adds summary badges:
  - `Stored`
  - `Needs review`
  - `Clear`
  - priority state counts
- Adds next action CTA:
  - `Next action: {privateObservationQueueNextAction.label}`
- Changes empty state from live/manual to private/manual wording.
- Adds per-row queue states from `privateObservationQueueItemsById`.
- Changes missing evidence badge from quiet `No evidence` to warn `No evidence`.

**Verdict:** owned.

Reasoning:

- This is the runtime/UI consumer of the operator observation queue source file.
- It directly displays queue summary, row states, and next action.

Recommendation:

- Include this hunk in the current slice.
- Browser QA remains a separate later gate; compile/test green is not enough to call UX green.

---

## Should the two untracked files be included in the current slice?

### `src/lib/operator-observation-queue.ts`

**Yes — include.**

It is the core source file for the operator observation queue and is directly imported by `src/app/admin/page.tsx`.

### `tests/operator-observation-queue.test.ts`

**Yes — include.**

It is the focused test file for the queue source logic and next-action behavior.

### Caveat

The admin page also imports `src/lib/admin-observation-storage.ts`, which is untracked but outside the original candidate list. This creates a dependency risk:

```text
src/app/admin/page.tsx -> ../../lib/admin-observation-storage
```

Before a commit-ready patch manifest, classify `src/lib/admin-observation-storage.ts` as either:

1. part of a prerequisite storage-boundary slice,
2. part of the current broadened admin queue slice, or
3. an unrelated dirty work item that requires re-splitting the admin import hunk.

Without this classification, `src/app/admin/page.tsx` is only **partially owned**, not commit-ready.

---

## Exact next verification commands after ownership is confirmed

Do not run these during audit mode. Run only after the candidate patch manifest is confirmed.

### 1. Focused queue test

```bash
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
```

Expected target:

```text
# fail 0
```

### 2. Boundary and secret checks

```bash
pnpm boundary:check
pnpm secret:check
```

Expected target:

- boundary check exits 0
- secret scan exits 0
- no secret values are printed or preserved

### 3. Typecheck and lint

```bash
pnpm typecheck
pnpm lint
```

Expected target:

- `next typegen && tsc --noEmit` exits 0
- ESLint exits 0 with max warnings 0

### 4. Full tests and build

```bash
pnpm test
pnpm build
```

Expected target:

- test runner exits 0
- Next build exits 0

### 5. Combined ladder

If no targeted failures occur:

```bash
pnpm boundary:check && pnpm secret:check && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

---

## Blocker conditions

Stop before implementation/commit preparation if any of these remain unresolved:

1. `src/lib/admin-observation-storage.ts` ownership remains unknown while `src/app/admin/page.tsx` imports it.
2. Admin page readiness/payment-copy removals remain mixed with the queue hunk and the goal is a minimal queue-only slice.
3. Branch remains `ahead 1, behind 1` and user asks to push/merge/rebase/pull.
4. `rg` continues to return empty results for known matching content; use exact reads and git path-scoped checks instead.
5. Any verification command fails after ownership is confirmed; preserve logs and fix based on the failing output.
6. Any command prints credentials/API keys/tokens/passwords/connection strings; redact as `[REDACTED]` and stop.
7. Browser/admin QA requires credentials or persistent data writes that are not explicitly scoped.

---

## Recommended next action

**Recommended:** B → A → C.

### B. Split admin page hunks

First, split `src/app/admin/page.tsx` conceptually into:

- queue-owned hunks:
  - queue helper imports
  - queue derivation variables
  - private observation queue section UI
- separate/non-owned hunks:
  - readiness item removals
  - payment helper sentence shortening
- unresolved dependency hunk:
  - `admin-observation-storage` import and `getRecentStoredObservations(50)` call

Do not edit yet; make a patch manifest first.

### A. Prepare commit-ready patch manifest

Create a manifest that lists exactly what would be staged if the user approves implementation:

```text
include: src/lib/operator-observation-queue.ts
include: tests/operator-observation-queue.test.ts
include selected hunks: src/app/admin/page.tsx queue UI/import/derivation only
classify before include: src/lib/admin-observation-storage.ts
exclude: payment readiness removals unless separately approved
exclude: payment helper copy shortening unless separately approved
exclude: all unrelated dirty docs/scripts/tests/source files
```

### C. Run targeted verification

After ownership is confirmed and any split is applied:

```bash
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
pnpm boundary:check && pnpm secret:check && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

### D. Pause and ask human

Pause if the user wants a strict queue-only patch but the admin page cannot be separated cleanly from the storage-boundary changes.

---

## Final audit verdict

The current operator observation queue slice is **not yet commit-ready**, but it is close.

Current ownership verdict:

```text
src/lib/operator-observation-queue.ts        owned
tests/operator-observation-queue.test.ts    owned
src/app/admin/page.tsx                      partially owned
```

The main blocker is not the two new queue files. The main blocker is `src/app/admin/page.tsx` mixing direct queue UI with non-queue readiness/payment cleanup and an unclassified dependency on `src/lib/admin-observation-storage.ts`.

Next safest move: prepare a patch manifest and classify `src/lib/admin-observation-storage.ts` before running tests or continuing feature work.
