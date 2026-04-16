# Local Ops Evidence Path Stabilization Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** WSL/Windows mixed environments에서도 `.ops-evidence` 산출물을 안정적으로 읽고 검증할 수 있게 경로 저장/검증 방식을 표준화한다.

**Architecture:** 기존 evidence contract는 유지하되, canonical storage를 repo-relative path 중심으로 바꾸고 verifier는 legacy Windows absolute path도 읽을 수 있게 backward-compatible normalization 계층을 둔다. 결제 연동은 현재 범위에서 제외한다.

**Tech Stack:** Next.js, Node.js TypeScript scripts, PowerShell evidence generator, node:test

---

### Task 1: 회귀 테스트 추가 (path normalization)

**Objective:** legacy Windows absolute path와 새 repo-relative path를 모두 현재 프로젝트 경로로 해석하는 규칙을 테스트로 고정한다.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/tests/normalization.test.ts`
- Reference: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/ops-evidence.ts`

**Step 1: Write failing tests**
- `resolveOpsEvidencePath` 또는 동등 helper를 기준으로 다음 케이스를 추가:
  - `C:\Users\sunwo\workspace\inMyPoket\.ops-evidence\ops-evidence-20260415-004104\report.md` -> `/mnt/c/Users/sunwo/workspace/inMyPoket/.ops-evidence/ops-evidence-20260415-004104/report.md`
  - `.ops-evidence/ops-evidence-20260415-004104/report.md` -> `<projectRoot>/.ops-evidence/.../report.md`
  - unknown absolute path는 그대로 유지

**Step 2: Run test to verify failure**
- Run: `pnpm test`
- Expected: FAIL because helper does not exist yet.

### Task 2: shared path normalization helper 구현

**Objective:** evidence path를 프로젝트 루트 기준으로 해석하는 공용 helper를 추가한다.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/ops-evidence.ts`
- Reference: `/mnt/c/Users/sunwo/workspace/inMyPoket/.ops-evidence/latest-run.json`

**Step 1: Add helper**
- export helper for:
  - repo-relative path resolution
  - Windows absolute -> WSL `/mnt/<drive>/...` 변환
  - fallback passthrough
- Keep current summary APIs compatible.

**Step 2: Run tests**
- Run: `pnpm test`
- Expected: PASS for added normalization tests.

### Task 3: verifier를 normalized path 기반으로 전환

**Objective:** `ops:verify`가 legacy artifact와 new artifact를 모두 읽도록 만든다.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/scripts/verify-ops-evidence.ts`
- Reference: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/ops-evidence.ts`

**Step 1: Update verifier**
- latest-run의 `bundleDir`, `reportPath`, `uiAssetsDir`, `manifestPath` 존재 확인 전에 normalization 적용
- release-health output에는 raw contract value는 유지하되, file existence는 normalized path 기준으로 검사
- visual regression latest도 필요 시 same helper 적용 가능성 고려

**Step 2: Verify regression**
- Run: `pnpm ops:verify`
- Expected: existing Windows-written evidence on WSL should no longer false-fail on missing path.

### Task 4: PowerShell generator를 repo-relative path 기록으로 전환

**Objective:** 앞으로 생성되는 evidence artifact가 OS-dependent absolute path 대신 repo-relative path를 저장하게 한다.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/scripts/collect-ops-evidence.ps1`

**Step 1: Add relative-path conversion**
- bundleDir/reportPath/uiAssetsDir/manifestPath를 repo root 대비 상대경로로 기록
- 기존 human-readable LATEST marker는 필요 시 raw path를 유지해도 되지만 JSON contract는 relative path 우선

**Step 2: Verify script syntax and generated shape**
- If PowerShell runtime unavailable in WSL, verify by code inspection + targeted string checks only.
- Do not claim runtime execution unless actually run.

### Task 5: multi-step verification and review

**Objective:** 구현 후 검증과 독립 리뷰를 통과시킨다.

**Files:**
- Review target: modified files only

**Step 1: Baseline + regression commands**
- Run: `pnpm test`
- Run: `pnpm ops:verify`
- Run: `pnpm lint` (if feasible)

**Step 2: Independent review passes**
- Spec compliance review: payment defer/non-goal 유지 여부 확인
- Quality review: backward compatibility, path edge case, overfitting 여부 검토
- Integration review: local operator workflow 관점에서 false red 감소 여부 판정

**Acceptance Criteria:**
- legacy Windows absolute path artifact를 WSL verifier가 읽을 수 있다.
- 새 generator는 repo-relative path를 latest-run/manifest에 기록한다.
- payment flow 관련 동작은 변경하지 않는다.
- 변경은 ops evidence pipeline에 국한된다.
