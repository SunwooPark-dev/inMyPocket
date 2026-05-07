# Repo-State Ledger and Ownership Split Plan

**Goal:** Preserve the current dirty `inMyPoket` worktree, separate ownership of changes, and choose the next safe execution slice without modifying code.

**Mode:** Plan-only / read-only investigation. No code implementation, no reset/clean/pull/rebase/merge/push, no external transmission.

**Active workspace:** `/mnt/c/Users/sunwo/workspace/inMyPoket`

---

## 1. Current repo root and branch state

### Confirmed repo root

Read-only checks confirmed the active repo is:

```text
/mnt/c/Users/sunwo/workspace/inMyPoket
```

Commands run:

```bash
pwd
git rev-parse --show-toplevel
```

Both returned `/mnt/c/Users/sunwo/workspace/inMyPoket`.

### Current branch state

Command:

```bash
git status --short --branch
```

Branch header:

```text
## codex/hosted-proof-pr...origin/codex/hosted-proof-pr [ahead 1, behind 1]
```

Implication:

- Do not push, pull, merge, or rebase in the next slice.
- Treat integration work as blocked until ownership is split and remote history is reconciled deliberately.

---

## 2. Dirty worktree ledger

### Overall scale

Command:

```bash
git diff --stat
```

Observed summary:

```text
140 files changed, 21230 insertions(+), 21029 deletions(-)
```

This is a large dirty worktree. Feature work should pause until ownership is classified.

### Tracked modified groups

Command:

```bash
git diff --name-only
```

The tracked diff includes broad groups:

1. GitHub / repo config
   - `.github/workflows/ci.yml`
   - `.gitignore`
   - `eslint.config.mjs`
   - `next.config.ts`
   - `tsconfig.json`

2. Project docs and governance docs
   - `README.md`
   - many `docs/*` governance, proof, roadmap, release, and plan documents

3. Package and lockfiles
   - `package.json`
   - `package-lock.json`
   - `pnpm-lock.yaml`

4. Scripts and operations tooling
   - many `scripts/*.mjs`, `scripts/*.ts`, `scripts/*.ps1`, `scripts/*.py`, and SQL verification scripts

5. App routes and UI
   - `src/app/admin/page.tsx`
   - `src/app/page.tsx`
   - `src/app/printable/page.tsx`
   - multiple API routes

6. Library code
   - many `src/lib/*` files including `operator-next-actions.ts`, observation, source, Supabase, waitlist, and governance modules

7. Tests and fixtures
   - multiple `tests/*.test.ts`
   - visual baseline fixture
   - smoke evidence fixture

### Tracked deleted files

The status output shows deleted tracked files including:

```text
D src/app/api/founding-member/checkout/route.ts
D src/app/api/observations/route.ts
D src/app/api/stripe/webhook/route.ts
D src/app/founding-member/cancel/page.tsx
D src/app/founding-member/success/page.tsx
D src/lib/founding-member-storage.ts
D src/lib/founding-member.ts
D src/lib/server-storage.ts
D src/lib/stripe.ts
```

Interpretation:

- These likely relate to payment/founding-member lane removal or deactivation.
- Do not restore or delete further files until the non-payment/operator proof direction is frozen for this branch.

### Untracked files

Command:

```bash
git ls-files --others --exclude-standard
```

Untracked files observed:

```text
.hermes/plans/2026-04-29_172642-small-verified-fix-loop.md
docs/api-boundary-refactor-plan.md
docs/operator-first-mvp-contract.md
docs/operator-observation-queue-integration-manifest-2026-04-24.md
docs/plans/2026-04-17-hosted-proof-next-ops-plan.md
docs/plans/2026-04-23-operator-first-mvp-implementation-breakdown.md
docs/plans/2026-04-29-continuous-evolution-controller-plan.md
docs/security-boundary-rules.md
docs/wiki/codex-agent-handoff.md
docs/wiki/hardening-execution-graph.md
docs/wiki/hardening-state.md
docs/wiki/index.md
scripts/check-boundaries.mjs
scripts/check-secrets.mjs
scripts/harden-published-view-direct-grants.ps1
scripts/harden-published-view-direct-grants.sql
scripts/public-smoke.ps1
scripts/seed-eugene-97401-verified.mjs
scripts/show-hardening-handoff.ts
scripts/show-supabase-sql-handoff.ts
scripts/verify-published-view-direct-grants.sql
src/app/api/admin/observations/route.ts
src/lib/admin-observation-storage.ts
src/lib/api-paths.ts
src/lib/comparison-availability.ts
src/lib/operator-observation-queue.ts
src/lib/public-observation-server.ts
src/lib/source-quality.ts
src/lib/waitlist-storage.ts
tests/operator-observation-queue.test.ts
tests/ops-boundary-scripts.test.ts
tests/release-health-freshness.test.ts
tests/secret-scan.test.ts
tests/source-quality.test.ts
```

Important note:

- `src/lib/operator-observation-queue.ts` exists and is untracked.
- `tests/operator-observation-queue.test.ts` exists and is untracked.
- These are likely owned by the recent operator queue summary / next-action CTA slice, but they must be confirmed before commit.

---

## 3. Package scripts and executable commands

`package.json` scripts confirmed:

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

Current primary verification ladder should remain:

```bash
pnpm boundary:check
pnpm secret:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

The all-in-one package script is also available:

```bash
pnpm ops:local-preflight
```

Focused operator queue test target:

```bash
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
```

Admin/browser QA commands may require runtime setup and credentials; do not assume they are available without a separate smoke plan.

---

## 4. Files likely owned by the current operator-queue slice

Likely owned by the most recent slice:

```text
src/lib/operator-observation-queue.ts
tests/operator-observation-queue.test.ts
src/app/admin/page.tsx
```

Reason:

- Recent work added private operator queue summary counts.
- Recent work added `getOperatorObservationQueueNextAction(summary)` behavior.
- Admin page was updated to show summary badges and a next-action CTA.

Ownership risk:

- Two of these files are untracked:
  - `src/lib/operator-observation-queue.ts`
  - `tests/operator-observation-queue.test.ts`
- `src/app/admin/page.tsx` is tracked modified and may include unrelated older modifications.

Next ownership step:

```bash
git status --short -- src/lib/operator-observation-queue.ts tests/operator-observation-queue.test.ts src/app/admin/page.tsx
git diff -- src/app/admin/page.tsx
git diff --no-index /dev/null src/lib/operator-observation-queue.ts
git diff --no-index /dev/null tests/operator-observation-queue.test.ts
```

Read-only caveat:

- `git diff --no-index` may exit non-zero when differences exist. That is expected; do not treat it as failure.

---

## 5. Files that must not be touched in the next slice

Do not touch broad unrelated groups during ownership split:

```text
.github/workflows/ci.yml
package-lock.json
pnpm-lock.yaml
supabase/**
scripts/** except read-only inspection
src/app/api/founding-member/** deleted paths
src/app/api/stripe/** deleted paths
src/lib/stripe.ts deleted path
src/lib/founding-member*.ts deleted paths
docs/** except the single ledger/plan file already being written
```

Do not run broad formatters, automated fixers, dependency install, or migration commands.

Forbidden next-slice commands:

```bash
git reset
git clean
git pull
git rebase
git merge
git push
pnpm install
pnpm lint --fix
```

---

## 6. Source-of-truth conflict ledger

### A. North Atlanta-only contract

File:

```text
docs/operator-first-mvp-contract.md
```

Status:

- Untracked, but internally explicit and recent.
- Declares itself the canonical project-facing contract for the next local operator lane.
- Freezes target public pilot as North Atlanta only:
  - ZIPs: `30328`, `30022`, `30076`
  - Retailers: `kroger`, `aldi`, `walmart`
- Says Eugene restoration and mixed-pilot UX are out of scope for this lane.
- Says payment/growth/consumer polish are non-goals.

Recommended authority for next operator queue stabilization slice:

- Treat as provisional source-of-truth until committed/accepted.
- Because it is untracked, do not assume it is repository-wide truth for integration without ownership confirmation.

### B. Eugene pilot mention

File:

```text
docs/product-harness-status.md
```

Status:

- Tracked modified.
- Mentions Eugene `97401` as a Fred Meyer / Albertsons / Walmart pilot area.
- Also says payment is not part of the active product model.

Conflict:

- Eugene availability conflicts with the North Atlanta-only lane in `operator-first-mvp-contract.md`.

Recommended treatment:

- Mark as broader/historical public UX status until a docs truth pass reconciles it.
- Do not use it to expand the next operator-first implementation slice.

### C. Supabase hardening handoff

File:

```text
docs/wiki/index.md
```

Status:

- Untracked under `docs/wiki/`.
- Points to hardening handoff docs.
- Says remaining blocker is external Supabase state.
- Lists commands including `pnpm ops:harden-published-view:apply`, `pnpm smoke:local -SkipPayment`, `pnpm ops:evidence`, and `pnpm ops:verify`.

Conflict/risk:

- This is a hardening/proof handoff lane, not the same as the local operator queue product slice.
- It may be true for Supabase boundary closure but should not silently drive UI/product work.

Recommended treatment:

- Treat as a separate ops-proof lane.
- Do not run hosted/Supabase apply commands in the ownership split slice.

### D. Non-payment / operator proof

Files:

```text
docs/operator-first-mvp-contract.md
docs/product-harness-status.md
src/lib/operator-next-actions.ts
package.json
```

Status:

- Multiple files agree that payment is not the immediate active lane.
- Deleted Stripe/founding-member files reinforce that payment may be intentionally deactivated.
- `operator-next-actions.ts` still contains a later-priority `reopen-payment` action when payment is deferred, but it is not a current gate.

Recommended treatment:

- Freeze next slice as non-payment/operator-first.
- Payment proof must remain deferred unless the user explicitly reopens monetization/payment.

---

## 7. Next recommended slice options

### Option A — Commit-ready ownership split

Purpose:

- Separate current operator queue slice from unrelated dirty work.
- Decide whether untracked files are intended source/test files.

Steps:

1. Run read-only path-scoped status/diff for the three likely owned files.
2. Inspect `src/lib/operator-observation-queue.ts` and `tests/operator-observation-queue.test.ts` fully.
3. Inspect only the relevant hunks in `src/app/admin/page.tsx`.
4. Create a file-level ownership ledger with:
   - owned by current slice
   - pre-existing dirty change
   - generated/artifact
   - do-not-touch
5. Run focused test:
   ```bash
   node --test --experimental-strip-types tests/operator-observation-queue.test.ts
   ```
6. Run full preflight only if no new edits were made:
   ```bash
   pnpm boundary:check && pnpm secret:check && pnpm typecheck && pnpm lint && pnpm test && pnpm build
   ```

Blocker conditions:

- If `src/app/admin/page.tsx` has unrelated large changes mixed into the same hunks.
- If untracked operator queue files are not intended source files.
- If branch remains ahead/behind and user asks to push/merge.

Recommendation:

- This is the safest immediate next slice.

### Option B — Docs truth pass

Purpose:

- Reconcile North Atlanta-only, Eugene, Supabase hardening, and non-payment/operator-proof docs.

Steps:

1. Freeze authoritative docs for the next lane.
2. Mark stale/provisional docs explicitly.
3. Update only docs after a separate plan.
4. Run docs-relevant checks plus full preflight if code paths are referenced.

Blocker conditions:

- If user wants product implementation before choosing source-of-truth.
- If docs are untracked and ownership is unknown.

### Option C — Admin browser QA

Purpose:

- Verify the admin queue summary and next-action CTA visually.

Steps:

1. Start dev server in a tracked background process.
2. Unlock/admin-smoke only with known safe local env.
3. Capture browser checklist or screenshot.
4. Do not mutate app data unless a separate test fixture plan exists.

Blocker conditions:

- Missing admin unlock credentials.
- `.env.local` uncertainty.
- Browser smoke would create persistent data without cleanup plan.

### Option D — Operator queue stabilization

Purpose:

- Continue implementation after ownership is split.

Possible small slices:

1. Filter queue by state: missing evidence / duplicates / stale.
2. Add publishability checklist display.
3. Align queue states with `docs/operator-first-mvp-contract.md`.

Blocker conditions:

- Ownership split not completed.
- Source-of-truth not frozen.
- Current green state not preserved.

---

## 8. Recommended immediate path

Choose Option A first:

```text
A. commit-ready ownership split
```

Reason:

- The worktree is too dirty for safe feature continuation.
- The branch is both ahead and behind remote.
- Critical source/test files are untracked.
- The recent operator queue changes are valuable and should not be lost or mixed with unrelated changes.

After Option A, choose one of:

1. Option C if the goal is UI confidence.
2. Option B if the goal is product governance/source-of-truth clarity.
3. Option D only after A and either B or C are sufficiently clear.

---

## 9. Verification commands for the execution phase

### Ownership-only read checks

```bash
pwd
git rev-parse --show-toplevel
git status --short --branch
git status --short -- src/lib/operator-observation-queue.ts tests/operator-observation-queue.test.ts src/app/admin/page.tsx
git diff --stat -- src/app/admin/page.tsx
git diff -- src/app/admin/page.tsx
git ls-files --others --exclude-standard
```

### Focused operator queue verification

```bash
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
```

Expected if current queue slice is intact:

```text
# fail 0
```

### Full local quality ladder

```bash
pnpm boundary:check && pnpm secret:check && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Expected:

- boundary check passes
- secret scan passes
- typecheck passes
- lint passes with max warnings 0
- test exits 0
- Next build exits 0

### UI verification, separate gate only

```bash
pnpm dev
```

Then browser-smoke `/admin` only after confirming local admin unlock prerequisites. Compile green is not UX green; mark browser QA incomplete if not performed.

---

## 10. Blocker conditions

Stop and ask before proceeding if any of these occur:

1. The repo root is not `/mnt/c/Users/sunwo/workspace/inMyPoket`.
2. `git status` no longer shows the expected branch or has changed in a way that suggests another actor modified the tree.
3. The operator queue source/test files disappear or change ownership.
4. Any command reveals secrets; redact values and stop.
5. User asks for push/merge/rebase/pull before branch divergence is reconciled.
6. A verification command fails; preserve logs and use the failure as the next plan input.
7. Admin browser QA requires credentials or persistent writes that are not explicitly scoped.

---

## 11. Final output contract for future execution reports

Use this exact compact structure after future execution:

```md
Status:
Files changed:
Commands run:
Verification:
Risks:
Next action:
```

Report once. Do not duplicate sections, repeat command blocks, expose internal thinking, or mix raw tool noise into the final user-facing summary.
