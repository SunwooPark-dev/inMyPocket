# Small Verified Fix Loop Plan

> **For Claude/Codex:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` or the local equivalent to implement this plan task-by-task. Do **not** skip the baseline read and verification gates.

**Goal:** Before changing code, re-read the verified inMyPoket repo, identify the smallest currently actionable failure or mismatch, fix only that slice, and report changed files, commands, verification, and remaining risks.

**Architecture:** Treat this as a controller plan, not a broad feature build. First freeze the real repo/source-of-truth state, then run the repo’s existing quality commands from `package.json`, then address exactly one focused failure with TDD/log-driven iteration. The execution loop must preserve the existing dirty worktree and avoid overwriting unrelated user or agent changes.

**Tech Stack:** Next.js 16, React, TypeScript, Node test runner, pnpm, Supabase contract docs, WSL/Windows-mounted workspace.

---

## 0. Plan-mode inspection summary

### Verified repo root

Confirmed repo root:

```text
/mnt/c/Users/sunwo/workspace/inMyPoket
```

The backend starting cwd was **not** the repo root:

```text
/mnt/c/Users/sunwo
```

Markers observed in `/mnt/c/Users/sunwo/workspace/inMyPoket`:

- `README.md` present
- `package.json` present
- `src/` present
- `docs/` present
- `.git/` present

### Current branch/provenance

Read-only git inspection showed:

```text
HEAD branch: codex/hosted-proof-pr
Tracking: origin/codex/hosted-proof-pr
State: ahead 1, behind 1
Recent HEAD: 9533f12 fix: recover ops evidence truthing and admin evidence download flow
Remote branch tip observed: 1c7a698 Add private observation queue diagnostics
```

### Important worktree warning

`git status --short --branch` showed a **large dirty worktree** with many modified and untracked files across docs, scripts, app routes, libs, tests, Supabase seed/migration files, and workflows.

Execution must assume this worktree contains valuable existing work. Do not run commands that discard, reset, rebase, auto-format the whole repo, or overwrite unrelated files.

### Canonical docs read before planning

Confirmed/read:

- `README.md`
- `AGENTS.md`
- `docs/operator-first-mvp-contract.md`
- `docs/plans/2026-04-23-operator-first-mvp-implementation-breakdown.md`
- `docs/product-harness-status.md`
- `docs/wiki/index.md`
- `package.json`

### Source-of-truth tension to preserve

There is a visible docs/runtime tension:

- `docs/operator-first-mvp-contract.md` freezes the next local operator lane as North Atlanta only: ZIPs `30328`, `30022`, `30076`; retailers `kroger`, `aldi`, `walmart`.
- `docs/product-harness-status.md` still mentions Eugene `97401` as an available pilot area.
- `docs/wiki/index.md` says active local work is mostly complete enough for Supabase operator handoff and lists hardening/preflight commands.
- `README.md` says payment is not active and emphasizes local non-payment/operator proof.

Execution must not collapse these into one assumed truth. Start with a source-of-truth freeze and explicitly decide which slice is being fixed.

---

## 1. Executable commands found in `package.json`

Use these exact scripts from the verified repo root.

### Core local development

```bash
pnpm install
pnpm dev
pnpm dev:3001
pnpm build
pnpm start
pnpm start:3001
pnpm start:3109
pnpm port:check
```

### Quality gates

```bash
pnpm boundary:check
pnpm secret:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm ops:local-preflight
```

`pnpm ops:local-preflight` expands to:

```bash
pnpm boundary:check && pnpm secret:check && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

### Smoke / operator evidence

```bash
pnpm smoke:public
pnpm smoke:public:3109
pnpm smoke:local
pnpm ops:evidence
pnpm ops:verify
pnpm ops:attest-hosted
pnpm ops:handoff
```

### Supabase hardening handoff

```bash
pnpm ops:show-hardening
pnpm ops:show-supabase-sql
pnpm ops:harden-published-view
pnpm ops:harden-published-view:apply
pnpm ops:harden-published-view:status
pnpm ops:harden-published-view:verify
```

### Visual lane

```bash
pnpm visual:update-baseline
pnpm visual:check
```

### Compatibility note

The repo already uses wrappers such as:

- `scripts/run-local-bin.mjs`
- `scripts/run-powershell-script.mjs`
- `scripts/run-python-script.mjs`

These exist to reduce WSL/Windows shell drift. Prefer package scripts over direct `.bin` calls.

---

## 2. Execution rules for the implementation phase

1. Work only from:

   ```bash
   cd /mnt/c/Users/sunwo/workspace/inMyPoket
   ```

2. Before edits, run read-only safety checks:

   ```bash
   pwd
   git rev-parse --show-toplevel
   git status --short --branch
   git diff --stat
   git diff --name-only
   ```

3. Do **not** use destructive git commands:

   - no `git reset --hard`
   - no `git checkout -- .`
   - no `git clean -fd`
   - no rebase/merge/pull until branch divergence is deliberately handled

4. Do **not** commit unless explicitly asked in the execution session. The worktree is already ahead/behind and dirty.

5. Do not run broad formatters or mass codemods.

6. Keep the fix small: one failure cluster, one behavior, one minimal patch.

7. If a command fails, use its log as the next input. Do not guess a fix.

---

## 3. Step-by-step plan

### Task 1: Source-of-truth freeze

**Files:**
- Read only: `README.md`
- Read only: `docs/wiki/index.md`
- Read only: `docs/operator-first-mvp-contract.md`
- Read only: `docs/product-harness-status.md`
- Read only: `docs/plans/2026-04-23-operator-first-mvp-implementation-breakdown.md`
- Read only: `package.json`

**Step 1: Reconfirm repo root and dirty state**

Run:

```bash
cd /mnt/c/Users/sunwo/workspace/inMyPoket
pwd
git rev-parse --show-toplevel
git status --short --branch
git diff --stat
```

Expected:

- root is `/mnt/c/Users/sunwo/workspace/inMyPoket`
- branch is `codex/hosted-proof-pr`
- dirty worktree is visible
- no destructive action taken

**Step 2: Create a contradiction ledger in notes, not code**

Record for the execution report:

- active operator-first target from `docs/operator-first-mvp-contract.md`
- current hardening handoff target from `docs/wiki/index.md`
- stale/broader product status from `docs/product-harness-status.md`
- any command failure that selects the actual fix slice

Do not edit docs during this step unless the selected failure is specifically a docs contradiction.

---

### Task 2: Baseline executable command check

**Files:**
- Read only: `package.json`
- Potential generated outputs: `.next/`, `.ops-evidence/`, visual artifacts depending on command. Avoid generated-heavy commands until needed.

**Step 1: Prefer cheap deterministic checks first**

Run:

```bash
pnpm boundary:check
pnpm secret:check
pnpm typecheck
pnpm lint
pnpm test
```

Expected:

- if all pass, continue to `pnpm build`
- if one fails, stop the baseline sequence and fix the first meaningful failure cluster

**Step 2: Build only after cheaper checks pass**

Run:

```bash
pnpm build
```

Expected:

- pass, or produce a focused Next.js/TypeScript/runtime error that becomes the selected repair slice

**Step 3: Full preflight only after individual checks are understood**

Run:

```bash
pnpm ops:local-preflight
```

Expected:

- pass only after individual gates pass
- if it fails after individual passes, investigate command-order/environment-specific behavior

---

### Task 3: Select exactly one smallest fix slice

Choose the first failing cluster using this priority order:

1. `boundary:check` or `secret:check` failure: fix the rule violation first because it protects public/private boundaries.
2. `typecheck` failure: fix the minimal type/runtime contract mismatch.
3. `lint` failure: fix only the reported lines.
4. `test` failure: fix only the failing test cluster.
5. `build` failure: fix the minimal Next.js build/runtime issue.
6. If all pass: do not invent a code fix; report green baseline and recommend the next product slice separately.

**Do not** combine pilot-boundary alignment, admin queue UX, Supabase hardening, and docs cleanup in one patch.

---

### Task 4: TDD/log-driven repair loop

**Files likely to change:** depends on selected failure. Use `git diff --name-only` before and after to isolate the patch.

Common likely targets based on current repo docs and status:

- Boundary/security failures:
  - `scripts/check-boundaries.mjs`
  - `scripts/check-secrets.mjs`
  - `tests/ops-boundary-scripts.test.ts`
  - `tests/secret-scan.test.ts`
  - `src/lib/public-observation-server.ts`
  - `src/lib/admin-observation-storage.ts`
  - `src/app/api/admin/observations/**`

- Type/build failures:
  - `src/app/**`
  - `src/components/**`
  - `src/lib/**`
  - `next.config.ts`
  - `tsconfig.json`
  - `package.json` only if the command itself is wrong

- Test failures in operator/publication lane:
  - `tests/operator-observation-queue.test.ts`
  - `tests/publication-governance-lane-a.test.ts`
  - `tests/governance-seed-30328-contract.test.ts`
  - `tests/source-quality.test.ts`
  - `src/lib/operator-observation-queue.ts`
  - `src/lib/source-quality.ts`
  - `src/lib/observation-repository.ts`
  - `src/lib/observation-feed.ts`

- Docs-only contradiction failures:
  - `README.md`
  - `docs/operator-first-mvp-contract.md`
  - `docs/product-harness-status.md`
  - `docs/wiki/index.md`
  - `docs/roadmap-slices.md`

**Step 1: Capture the failing log**

Run the failing command again with enough output to cite it:

```bash
# example only; replace with the actual failing command
pnpm test
```

Expected:

- same failure reproduced
- failure message identifies exact file/test/line or build phase

**Step 2: Add or tighten one focused regression when feasible**

If the failure is a behavior gap rather than a pure compile/lint failure, add one targeted test first.

Examples:

```bash
pnpm test -- --test-name-pattern="operator"
pnpm test -- --test-name-pattern="source"
pnpm test -- --test-name-pattern="publication"
```

If Node’s test-name filter does not map cleanly to this repo’s script, run the explicit relevant test file with Node:

```bash
node --test --experimental-strip-types tests/operator-observation-queue.test.ts
```

Expected:

- focused failure before implementation
- no broad unrelated test additions

**Step 3: Implement the minimal patch**

Edit only the smallest set of files needed for the reproduced failure.

Rules:

- preserve existing public/private trust boundary
- preserve non-payment product direction
- preserve operator-first local usability
- do not delete legacy data or docs unless the selected failure specifically requires it
- do not broaden scope into redesign or monetization

**Step 4: Re-run focused verification**

Run the failing command or focused test again.

Expected:

- the original failure is gone
- if a new failure appears, decide whether it is the same cluster; otherwise stop and report it as remaining risk

**Step 5: Re-run the quality ladder**

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

- all pass for a merge-ready local patch
- if one fails, continue the log-driven loop only if it is caused by the same patch; otherwise report as separate pre-existing risk

---

### Task 5: Optional operator evidence verification

Only run these if the selected fix touches ops evidence, public smoke behavior, admin observation routes, Supabase handoff, or release-health files.

**Files likely involved:**

- `scripts/collect-ops-evidence.ps1`
- `scripts/verify-ops-evidence.ts`
- `scripts/public-smoke.ps1`
- `scripts/live-smoke.ps1`
- `src/app/admin/page.tsx`
- `src/app/api/admin/observations/**`
- `src/lib/ops-evidence.ts`
- `src/lib/operator-next-actions.ts`
- `docs/operator-evidence-bundle.md`
- `docs/wiki/**`

Run:

```bash
pnpm smoke:public
pnpm ops:verify
```

If a local server is required:

```bash
pnpm build
pnpm start:3109
pnpm smoke:public:3109
```

Expected:

- public smoke succeeds against the chosen base URL
- `ops:verify` produces a truthful release-health verdict
- generated `.ops-evidence/` bundles remain uncommitted/unshared unless explicitly requested

---

## 4. Validation matrix

Minimum validation for any code patch:

```bash
pnpm boundary:check
pnpm secret:check
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Full local preflight after all individual gates are green:

```bash
pnpm ops:local-preflight
```

Ops-specific validation if touched:

```bash
pnpm smoke:public
pnpm ops:verify
```

Server-route validation if needed:

```bash
pnpm start:3109
pnpm smoke:public:3109
```

---

## 5. Final report template

At the end of execution, report in Korean with these sections:

```markdown
## 변경 파일
- `path/to/file`: 무엇을 왜 바꿨는지

## 실행한 명령어
- `command`: PASS/FAIL, 핵심 로그 요약

## 검증 결과
- boundary: PASS/FAIL
- secret: PASS/FAIL
- typecheck: PASS/FAIL
- lint: PASS/FAIL
- test: PASS/FAIL
- build: PASS/FAIL
- smoke/ops if applicable: PASS/FAIL or not run + reason

## 남은 리스크
- [blocked] 외부 의존성/권한/환경 문제
- [risk] 현재 패치 범위 밖의 실패 또는 문서-런타임 불일치
- [next] 다음에 고칠 가장 작은 항목
```

Do not say “fixed” unless the matching verification command passed.

---

## 6. Risks and open questions

### Risks

- The worktree is already highly modified; accidental broad edits could destroy unrelated progress.
- The branch is both ahead and behind its remote tracking branch; do not merge/rebase/push as part of this small fix loop.
- WSL/Windows dependency drift can make Next.js builds fail if Windows-installed `node_modules` are reused. If native binding errors appear, prefer WSL-local reinstall rather than code changes.
- Some smoke/evidence commands may generate artifacts under `.ops-evidence/`; these are local/generated and should not be force-staged.
- Supabase hosted hardening may require external project state and credentials; mark it `[blocked]` if unavailable rather than simulating success.

### Open questions for execution phase

- Which command fails first in the current dirty worktree?
- Is the immediate desired slice hardening/preflight recovery, operator-first MVP contract alignment, or hosted/Supabase handoff?
- Are the current untracked files intentional deliverables from prior agents? Treat them as intentional until proven otherwise.

---

## 7. Short execution prompt

Use this in the next implementation run:

> Work in `/mnt/c/Users/sunwo/workspace/inMyPoket`. First read `README.md`, `docs/wiki/index.md`, `docs/operator-first-mvp-contract.md`, `docs/product-harness-status.md`, and `package.json`. Preserve the dirty worktree. Run the quality ladder from `package.json` starting with `pnpm boundary:check`, `pnpm secret:check`, `pnpm typecheck`, `pnpm lint`, and `pnpm test`. Fix only the first meaningful failing cluster with the smallest patch. Re-run the focused failing command, then the full quality ladder. Final report must list changed files, commands run, verification results, and remaining risks. Do not commit, push, reset, or broaden scope without explicit instruction.
