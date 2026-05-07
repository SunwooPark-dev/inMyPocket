# Continuous Evolution Controller Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Keep inMyPoket moving forward without losing the current local/operator-first safety base: first stabilize the dirty worktree, then ship one small operator-value slice at a time.

**Architecture:** Treat evolution as a controller loop rather than a big rewrite. Each implementation wave starts by freezing source-of-truth and running the quality ladder, selects one small failing or high-value slice, applies TDD/log-driven changes, and reports evidence before choosing the next slice. The next product direction stays operator-first/local-stability-first; payment, broad redesign, and pilot expansion remain postponed unless explicitly reactivated.

**Tech Stack:** Next.js 16, React, TypeScript, Node test runner, pnpm, Supabase-backed governance concepts, WSL-mounted Windows repo.

---

## 0. Confirmed context from plan-time inspection

### Confirmed repo root

All execution commands must run from:

```bash
cd /mnt/c/Users/sunwo/workspace/inMyPoket
```

The backend cwd during planning was `/mnt/c/Users/sunwo`, not the repo root. Do not rely on implicit cwd.

### Confirmed current branch/worktree risk

Read-only inspection showed:

```text
codex/hosted-proof-pr...origin/codex/hosted-proof-pr [ahead 1, behind 1]
```

The worktree is heavily dirty with many modified/deleted/untracked files across docs, scripts, app routes, libs, tests, migrations, and workflows.

**Execution constraint:** no reset, clean, checkout, rebase, merge, pull, broad formatter, or broad generated-file staging unless the operator explicitly approves.

### Source-of-truth ranking for this plan

1. **Live repo files read during planning** — highest local authority for what exists now.
2. **`docs/operator-first-mvp-contract.md`** — highest product/implementation contract for the next operator-first lane.
3. **`package.json` scripts** — authoritative command list.
4. **`docs/wiki/index.md`** — current Supabase hardening handoff note; useful but narrower than the product contract.
5. **`docs/roadmap-slices.md` and `docs/product-harness-status.md`** — useful historical/planning docs, but they contain older payment/Eugene language that must not silently override the operator-first contract.

### Key tension to preserve, not blur

- `operator-first-mvp-contract` says the next lane should converge on North Atlanta only and operator-visible queues.
- `roadmap-slices` still includes older Stripe/payment sequencing.
- `product-harness-status` still mentions Eugene `97401`.
- `wiki/index` says the local work is mostly complete enough for Supabase operator handoff, with remaining external Supabase state.

The next implementation wave must not average those together. It must pick one explicit lane per patch.

---

## 1. Definition of “continue evolving” for the next wave

### Execute now

The next wave should do these, in order:

1. Freeze current repo truth and run the cheap quality ladder.
2. If anything fails, fix the first meaningful failure cluster only.
3. If the quality ladder is already green, implement the smallest operator-first improvement: expose or strengthen one operator queue/status behavior with regression coverage.
4. Report changed files, commands, verification, and risks.

### Postpone

- Payment/Stripe resurrection.
- Broad consumer redesign.
- Hosted-proof work that does not improve local operator reliability.
- Pilot expansion or Eugene restoration.
- Large doc rewrite unless docs are the selected failing slice.

### Out of scope for this plan

- Pushing to GitHub.
- Rebasing/merging the behind remote branch.
- Applying hosted Supabase SQL without explicit credentials/operator approval.
- Calling the product “complete” beyond the acceptance bar below.

### Acceptance bar

This wave can be called done only when:

- the repo root and dirty state are explicitly reported,
- the quality ladder is run or each skipped command has a reason,
- exactly one fix/improvement slice is implemented,
- the matching focused verification passes,
- the broader relevant gates pass or are reported as `[blocked]` / `[risk]`,
- the final report lists changed files, commands, verification results, and remaining risks.

---

## 2. Executable command ladder

Run from `/mnt/c/Users/sunwo/workspace/inMyPoket`.

### Cheap baseline ladder

```bash
pnpm boundary:check
pnpm secret:check
pnpm typecheck
pnpm lint
pnpm test
```

### Build gate

```bash
pnpm build
```

### Full local preflight after individual gates are understood

```bash
pnpm ops:local-preflight
```

### Ops/hardening commands only when that lane is selected

```bash
pnpm ops:show-hardening
pnpm ops:show-supabase-sql
pnpm smoke:public
pnpm ops:verify
```

### Local server smoke only when route/UI behavior is touched

```bash
pnpm build
pnpm start:3109
pnpm smoke:public:3109
```

---

## 3. Task 1: Freeze current repo truth before touching code

**Objective:** Prevent accidental worktree damage and select the next slice based on live state, not stale docs.

**Files:**
- Read only: `README.md`
- Read only: `package.json`
- Read only: `docs/operator-first-mvp-contract.md`
- Read only: `docs/wiki/index.md`
- Read only: `docs/roadmap-slices.md`
- Read only: `docs/product-harness-status.md`

**Step 1: Confirm root and branch**

Run:

```bash
cd /mnt/c/Users/sunwo/workspace/inMyPoket
pwd
git rev-parse --show-toplevel
git status --short --branch
```

Expected:

- `pwd` and `git rev-parse` both point to `/mnt/c/Users/sunwo/workspace/inMyPoket`
- branch divergence and dirty files are visible

**Step 2: Capture exact changed-file scope**

Run:

```bash
git diff --name-only
git ls-files --others --exclude-standard
```

Expected:

- output is recorded in the execution notes
- no edits made yet

**Step 3: Re-read the current contract snippets**

Run:

```bash
node -e "const fs=require('fs'); for (const f of ['docs/operator-first-mvp-contract.md','docs/wiki/index.md','docs/roadmap-slices.md']) { console.log('\n--- '+f+' ---'); console.log(fs.readFileSync(f,'utf8').slice(0,2500)); }"
```

Expected:

- operator-first lane, hardening handoff, and older roadmap slices are visibly separated

**Step 4: Do not commit**

Commit is intentionally omitted for this task because it is read-only.

---

## 4. Task 2: Run the baseline quality ladder and choose the lane

**Objective:** Decide whether the next work is failure recovery or proactive operator-first improvement.

**Files:**
- Read only: `package.json`
- Potentially generated by tools: `.next/`, `.ops-evidence/` only if later commands require them

**Step 1: Run boundary check**

Run:

```bash
pnpm boundary:check
```

Expected:

- PASS, or a precise boundary violation that becomes the selected failure slice

**Step 2: Run secret scan**

Run:

```bash
pnpm secret:check
```

Expected:

- PASS, or a precise tracked-file secret-pattern finding that becomes the selected failure slice

**Step 3: Run typecheck**

Run:

```bash
pnpm typecheck
```

Expected:

- PASS, or a precise TypeScript/Next type generation failure that becomes the selected failure slice

**Step 4: Run lint**

Run:

```bash
pnpm lint
```

Expected:

- PASS, or exact lint lines that become the selected failure slice

**Step 5: Run tests**

Run:

```bash
pnpm test
```

Expected:

- PASS, or exact failing test file(s) that become the selected failure slice

**Step 6: Run build only after cheaper checks**

Run:

```bash
pnpm build
```

Expected:

- PASS, or exact build/runtime error that becomes the selected failure slice

**Step 7: Commit**

No commit for this task. It is a verification/selection task.

---

## 5. Task 3A: If a baseline command fails, fix only the first failure cluster

**Objective:** Recover the current dirty worktree to a verified baseline before adding new product behavior.

**Files:**
- Modify: exact files identified by the failing command only
- Test: exact failing test file or checker script target only

**Step 1: Reproduce the selected failure**

Run the same failing command again. Example:

```bash
pnpm test
```

Expected:

- same failure appears
- log identifies a concrete file/test/line/behavior

**Step 2: Add or tighten a focused regression if the failure is behavioral**

If the failure is not a pure compile/lint issue, add a failing test in the smallest relevant test file.

Likely files by cluster:

- Boundary script behavior: `tests/ops-boundary-scripts.test.ts`
- Secret scan behavior: `tests/secret-scan.test.ts`
- Operator queue behavior: `tests/operator-observation-queue.test.ts`
- Publication behavior: `tests/publication-governance-lane-a.test.ts`
- Source quality behavior: `tests/source-quality.test.ts`
- Release health behavior: `tests/release-health-freshness.test.ts`

Example test shape for an operator queue regression:

```ts
test('missing evidence observations stay operator-visible and unpublished', () => {
  const queue = buildOperatorObservationQueue([
    {
      id: 'obs-missing-evidence',
      sourceUrl: 'https://example.com/item',
      evidenceRef: null,
      lifecycle: 'review_required',
    },
  ]);

  assert.deepEqual(queue.missingEvidence.map((item) => item.id), [
    'obs-missing-evidence',
  ]);
  assert.equal(queue.publishable.some((item) => item.id === 'obs-missing-evidence'), false);
});
```

Only use this exact code if the existing helper/API matches it. Otherwise adapt the smallest existing test helper already present in the file.

**Step 3: Run focused test/check and verify RED**

Examples:

```bash
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
pnpm boundary:check
pnpm secret:check
```

Expected:

- test/check fails for the expected reason, not because of syntax/import errors

**Step 4: Implement the smallest fix**

Modify only the file(s) identified by the failure. Do not combine unrelated docs/product cleanup.

**Step 5: Run focused verification and verify GREEN**

Run the same focused command again.

Expected:

- selected failure passes

**Step 6: Run broader quality ladder**

Run:

```bash
pnpm boundary:check
pnpm secret:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Expected:

- all pass, or any remaining failure is clearly reported as separate `[risk]` / `[blocked]`

**Step 7: Commit only if explicitly allowed**

Suggested commit if allowed:

```bash
git add <changed-test-files> <changed-source-files>
git commit -m "fix: recover local verification baseline"
```

Do not commit by default in this branch state.

---

## 6. Task 3B: If baseline is green, implement one operator-visible queue improvement

**Objective:** Continue product evolution in the safest direction: make one operator queue/status more explicit and test-backed.

Use this task only if Task 2 passes through `pnpm build`.

### Chosen improvement

Strengthen the operator-facing visibility for **missing evidence** or **stale now** observations, whichever is already closest to existing code.

Selection rule:

1. Inspect `src/lib/operator-observation-queue.ts` if present.
2. Inspect `tests/operator-observation-queue.test.ts` if present.
3. Choose the queue with existing helper structure and the smallest missing assertion.
4. If neither helper exists or APIs differ, stop and create a smaller plan update instead of inventing a new architecture.

**Files likely to change:**
- Modify: `tests/operator-observation-queue.test.ts`
- Modify: `src/lib/operator-observation-queue.ts`
- Possibly modify: `src/app/admin/page.tsx`
- Possibly modify: `src/lib/operator-next-actions.ts`

**Step 1: Inspect exact queue API**

Run:

```bash
node -e "const fs=require('fs'); for (const f of ['src/lib/operator-observation-queue.ts','tests/operator-observation-queue.test.ts','src/lib/operator-next-actions.ts']) { if (fs.existsSync(f)) { console.log('\n--- '+f+' ---'); console.log(fs.readFileSync(f,'utf8').slice(0,5000)); } else { console.log('MISSING '+f); } }"
```

Expected:

- exact exported helper names and test patterns are visible

**Step 2: Write the failing low-level regression**

Add one test to `tests/operator-observation-queue.test.ts` matching the existing style.

Target behavior:

- an observation that lacks evidence/provenance must appear in an operator-visible queue,
- it must not be included in any publishable/public-ready list,
- the test should assert exact IDs or counts.

Template if compatible with existing APIs:

```ts
test('missing evidence is visible as operator work and not publishable', () => {
  const result = buildOperatorObservationQueue([
    makeObservation({
      id: 'missing-evidence-1',
      evidenceRef: null,
      lifecycle: 'review_required',
    }),
  ]);

  assert.deepEqual(
    result.missingEvidence.map((item) => item.id),
    ['missing-evidence-1'],
  );
  assert.deepEqual(
    result.publishable.map((item) => item.id),
    [],
  );
});
```

If the existing API uses different names, preserve the intent but use real helpers.

**Step 3: Verify RED**

Run:

```bash
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
```

Expected:

- FAIL for missing queue behavior or missing assertion support
- not a syntax/import error

**Step 4: Implement minimal queue logic**

Modify `src/lib/operator-observation-queue.ts` only enough to satisfy the test.

Minimal logic shape if compatible:

```ts
const hasEvidence = (observation: OperatorObservation): boolean =>
  Boolean(observation.evidenceRef || observation.evidenceUrl || observation.evidencePath);

export function buildOperatorObservationQueue(observations: OperatorObservation[]) {
  const missingEvidence = observations.filter((observation) => !hasEvidence(observation));
  const publishable = observations.filter(
    (observation) => hasEvidence(observation) && isOtherwisePublishable(observation),
  );

  return {
    missingEvidence,
    publishable,
    // preserve existing queues here
  };
}
```

Do not introduce new DB schema or admin UI redesign in this task.

**Step 5: Verify GREEN**

Run:

```bash
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
```

Expected:

- PASS

**Step 6: Run broader relevant checks**

Run:

```bash
pnpm typecheck
pnpm test
pnpm lint
```

Expected:

- PASS

**Step 7: Commit only if explicitly allowed**

Suggested commit if allowed:

```bash
git add tests/operator-observation-queue.test.ts src/lib/operator-observation-queue.ts src/app/admin/page.tsx src/lib/operator-next-actions.ts
git commit -m "feat: make missing-evidence operator work visible"
```

Only include files actually changed.

---

## 7. Task 4: Report and decide the next evolution slice

**Objective:** End with a truthful handoff and a clear next smallest move.

**Files:**
- No required file changes
- Optional docs update only if the implementation changed documented behavior

**Step 1: Capture final diff**

Run:

```bash
git diff --stat
git diff --name-only
```

Expected:

- changed files are known
- unrelated dirty files are not claimed as part of this wave

**Step 2: Capture command outcomes**

Record every command run and PASS/FAIL/blocked status.

**Step 3: Write final report in Korean**

Use this exact structure:

```markdown
## 변경 파일
- `path`: 변경 이유와 범위

## 실행한 명령어
- `command`: PASS/FAIL/[blocked], 핵심 로그

## 검증 결과
- boundary: PASS/FAIL/[not run]
- secret: PASS/FAIL/[not run]
- typecheck: PASS/FAIL/[not run]
- lint: PASS/FAIL/[not run]
- test: PASS/FAIL/[not run]
- build: PASS/FAIL/[not run]
- ops/smoke: PASS/FAIL/[not run] + 이유

## 남은 리스크
- [risk] 현재 dirty worktree 중 이번 패치 범위 밖 항목
- [blocked] 외부 Supabase/hosted/credential 의존성
- [next] 다음에 고칠 가장 작은 항목
```

**Step 4: Recommend next slice**

Pick exactly one:

1. If baseline is still failing: continue baseline recovery.
2. If baseline is green and missing-evidence queue was improved: next queue is `stale now` or `duplicates`.
3. If operator queues are covered: tighten North Atlanta-only public lane.
4. If local operator flow is stable: update docs truth pass.

---

## 8. Harness execution model for this plan

When executing in this same session:

1. Controller reads this plan once.
2. Controller creates TODOs for Task 1 through Task 4.
3. Dispatch one implementation subagent per task, not parallel implementers.
4. After each implementation task:
   - dispatch spec-compliance review subagent,
   - only after spec passes, dispatch code-quality review subagent,
   - if either reviewer finds issues, send the implementer back to fix and re-review.
5. Do not move to the next task while either review has open issues.

Because the current worktree is dirty and branch-diverged, subagents must be told:

- no git destructive commands,
- no commits unless explicitly allowed,
- no broad formatting,
- cite all commands and outputs.

---

## 9. Short execution prompt

Use this when starting implementation:

> Work in `/mnt/c/Users/sunwo/workspace/inMyPoket`. Preserve the dirty `codex/hosted-proof-pr` worktree. First freeze repo truth with `pwd`, `git rev-parse --show-toplevel`, `git status --short --branch`, `git diff --name-only`, and reads of `package.json`, `docs/operator-first-mvp-contract.md`, `docs/wiki/index.md`, and `docs/roadmap-slices.md`. Then run `pnpm boundary:check`, `pnpm secret:check`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`. If any command fails, fix only the first meaningful failure cluster with TDD/log-driven changes. If all pass, implement exactly one operator-visible queue improvement, preferably missing-evidence or stale-now visibility, with a failing test first. Do not commit, push, reset, rebase, merge, pull, or broaden scope unless explicitly approved. Final report must list changed files, commands run, verification results, and remaining risks.
