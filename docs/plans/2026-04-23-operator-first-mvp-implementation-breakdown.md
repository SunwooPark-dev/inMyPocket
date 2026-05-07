# Operator-First MVP Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the repo with the operator-first MVP contract before more product polish or expansion work.

**Architecture:** Start by reconciling pilot-boundary drift, then make operator-facing states and queues map cleanly onto the governed publication backend already under test. Strengthen regression coverage before touching broader UX so the operator-first lane becomes locally trustworthy and repeatable.

**Tech Stack:** Next.js, TypeScript, Supabase/Postgres contract docs, Node test runner, repo markdown docs

---

## 1. Cold verdict

Verdict: on-track, but only if the next work stays operator-first and closes contract drift before more product polish.

Why:
- the repo already has governed-publication logic, seed contract tests, source-quality checks, and an admin/operator surface
- the missing piece is not another big idea; it is alignment between the intended operator-first contract and the actual repo surface
- the biggest visible drift today is that the repo still carries Eugene-era pilot artifacts alongside the North Atlanta lane

So the next work should not start with redesign.
It should start with contract alignment.

## 2. Execution order

Run the next slices in this order:
1. pilot-boundary alignment
2. operator-state and queue contract
3. regression fixture strengthening
4. admin/operator surface tightening
5. README and ops-doc truth pass

Do not reorder these unless a blocking runtime defect forces it.

### Task 1: Pilot-boundary alignment

**Files:**
- Modify: `src/lib/catalog.ts`
- Modify: `src/lib/location-context.ts`
- Modify: `src/lib/demo-data.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/printable/page.tsx`
- Test: `tests/location-context-lane-a.test.ts`
- Docs: `docs/operator-first-mvp-contract.md`

**Step 1: Write or tighten the failing boundary tests**
- Add or tighten assertions that the active public lane is explicitly North-Atlanta-first.
- Encode how legacy Eugene data should behave: removed from active public scope, or clearly dev-only/non-default.

**Step 2: Run the focused test**
Run: `pnpm test -- --test-name-pattern="location"`
Expected: boundary mismatch or missing assertion until the code is aligned.

**Step 3: Make the minimal code changes**
- Reconcile pilot constants, location ranking, and public copy with the intended three-ZIP lane.
- Avoid broad refactors.

**Step 4: Re-run the focused test**
Run: `pnpm test -- --test-name-pattern="location"`
Expected: PASS for the intended pilot-boundary behavior.

**Step 5: Commit**
```bash
git add src/lib/catalog.ts src/lib/location-context.ts src/lib/demo-data.ts src/app/page.tsx src/app/printable/page.tsx tests/location-context-lane-a.test.ts
git commit -m "feat: align active pilot boundary with operator-first lane"
```

### Task 2: Operator-state and queue contract

**Files:**
- Modify: `src/lib/observation-feed.ts`
- Modify: `src/lib/observation-repository.ts`
- Modify: `src/lib/admin-observation-storage.ts`
- Modify: `src/app/admin/page.tsx`
- Modify: `src/components/admin-preview-form.tsx`
- Test: `tests/publication-governance-lane-a.test.ts`
- Test: `tests/source-quality.test.ts`
- Docs: `docs/operator-first-mvp-contract.md`

**Step 1: Write the failing tests first**
- Add a test for the operator-facing queue/state mapping.
- Add a test for ambiguous or duplicate observations staying out of the publishable lane.

**Step 2: Run the focused tests**
Run: `pnpm test -- --test-name-pattern="public|source"`
Expected: FAIL where state/queue semantics are not yet explicit.

**Step 3: Implement the minimal state and queue bridge**
- Keep the governed backend lifecycle intact.
- Add the operator-facing mapping and queue semantics on top.
- Prefer derived state over duplicating conflicting sources of truth.

**Step 4: Re-run the focused tests**
Run: `pnpm test -- --test-name-pattern="public|source"`
Expected: PASS for the new queue/state contract.

**Step 5: Commit**
```bash
git add src/lib/observation-feed.ts src/lib/observation-repository.ts src/lib/admin-observation-storage.ts src/app/admin/page.tsx src/components/admin-preview-form.tsx tests/publication-governance-lane-a.test.ts tests/source-quality.test.ts
git commit -m "feat: expose operator-first publication states and queues"
```

### Task 3: Regression fixture strengthening

**Files:**
- Modify: `tests/normalization.test.ts`
- Modify: `tests/publication-governance-lane-a.test.ts`
- Modify: `tests/governance-seed-30328-contract.test.ts`
- Modify: `tests/source-quality.test.ts`
- Modify: `tests/release-health-freshness.test.ts`
- Modify: `supabase/seed.sql`

**Step 1: Add failing regression cases**
- ambiguous normalization stays out of totals
- duplicate conflicts do not auto-win into the public lane
- stale-soon and stale-now thresholds are distinguishable
- North Atlanta seed/public examples remain aligned with the contract

**Step 2: Run the targeted tests**
Run: `pnpm test`
Expected: FAIL until fixtures and/or code align.

**Step 3: Implement the smallest code or seed adjustments**
- Update only the fixtures, seed rows, or helper logic required to satisfy the contract.
- Do not smuggle unrelated UX changes into this slice.

**Step 4: Re-run the full test suite**
Run: `pnpm test`
Expected: PASS with the stronger operator-first regression coverage.

**Step 5: Commit**
```bash
git add tests/normalization.test.ts tests/publication-governance-lane-a.test.ts tests/governance-seed-30328-contract.test.ts tests/source-quality.test.ts tests/release-health-freshness.test.ts supabase/seed.sql
git commit -m "test: harden operator-first publication regressions"
```

### Task 4: Admin/operator surface tightening

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/components/admin-preview-form.tsx`
- Modify: `src/components/admin-unlock-form.tsx`
- Modify: `src/lib/operator-next-actions.ts`
- Modify: `src/lib/external-blockers.ts`
- Docs: `docs/mvp-operations.md`

**Step 1: Write a short acceptance checklist**
- An operator can see what is blocked now.
- An operator can see what is stale now.
- An operator can tell which issues require review versus which are informational.

**Step 2: Add or tighten the smallest missing tests**
- If the admin surface already has route or helper coverage, extend those tests.
- If not, add helper-level assertions before broad UI tests.

**Step 3: Implement the minimal UI changes**
- Make next actions and queue-driven blockers obvious.
- Keep the surface practical rather than polished.

**Step 4: Verify the targeted behavior**
Run: `pnpm test`
Expected: PASS with operator-visible status behavior intact.

**Step 5: Commit**
```bash
git add src/app/admin/page.tsx src/components/admin-preview-form.tsx src/components/admin-unlock-form.tsx src/lib/operator-next-actions.ts src/lib/external-blockers.ts docs/mvp-operations.md
git commit -m "feat: tighten operator-facing admin workflow visibility"
```

### Task 5: README and ops-doc truth pass

**Files:**
- Modify: `README.md`
- Modify: `docs/mvp-operations.md`
- Modify: `docs/roadmap-slices.md`
- Modify: `docs/operator-first-mvp-contract.md`
- Modify: `docs/plans/2026-04-23-operator-first-mvp-implementation-breakdown.md`

**Step 1: Re-read the contract and actual repo state**
- Confirm which parts are current truth and which are target-state contract.

**Step 2: Make the docs explicit about that split**
- README should link the new contract and this plan.
- Docs should stop implying that payment or hosted-proof work is the primary immediate lane.

**Step 3: Run a docs sanity pass**
Run: `git diff -- README.md docs/mvp-operations.md docs/roadmap-slices.md docs/operator-first-mvp-contract.md docs/plans/2026-04-23-operator-first-mvp-implementation-breakdown.md`
Expected: only the intended documentation updates.

**Step 4: Commit**
```bash
git add README.md docs/mvp-operations.md docs/roadmap-slices.md docs/operator-first-mvp-contract.md docs/plans/2026-04-23-operator-first-mvp-implementation-breakdown.md
git commit -m "docs: freeze operator-first mvp execution contract"
```

## 3. Short execution prompt

Use this when starting the next implementation session:

"Implement the operator-first MVP alignment lane for inMyPoket. Start from `docs/operator-first-mvp-contract.md` and `docs/plans/2026-04-23-operator-first-mvp-implementation-breakdown.md`. First reconcile pilot-boundary drift in the active public lane, then map operator-facing states/queues onto the governed backend lifecycle, then add local regression coverage for ambiguous normalization, duplicate conflicts, and stale handling. Prefer small verifiable slices over broad product redesign."

## 4. What not to do next

Do not start with:
- payment resurrection
- broad consumer redesign
- growth or marketing experiments
- hosted proof work that leaves operator-local safety unchanged
- deleting legacy scope without first deciding how the contract should treat it
