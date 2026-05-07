# WSL Script Runner Compatibility Stabilization Plan

## Objective
Restore operator command usability in the current WSL environment without changing the product scope. The immediate goal is to make the documented local workflow invocable from WSL/Linux shells by introducing a cross-environment runner layer for PowerShell-backed scripts and a Python interpreter fallback for `visual:check`.

This plan does NOT reopen payment work. It focuses on local stability, operator usability, and truthful execution ergonomics.

## Why this is the top priority
Independent investigation + controller verification established:

- `package.json` hardcodes `powershell` for `dev:3001`, `start:3001`, `port:check`, `smoke:local`, `ops:evidence`, `ops:ui-evidence`, `visual:update-baseline`
- `package.json` hardcodes `python` for `visual:check`
- In current WSL:
  - `powershell` missing
  - `pwsh` missing
  - `powershell.exe` exists
  - `python` missing
  - `python3` exists
- Controller reproduced failures:
  - `pnpm run port:check` -> `sh: 1: powershell: not found`
  - `pnpm run visual:check` -> `sh: 1: python: not found`
  - `powershell.exe -ExecutionPolicy Bypass -File .\scripts\check-port.ps1 -Port 3000` succeeds
- Therefore the blocker is runner selection, not the underlying PowerShell script logic.

## Non-goals
- Do not change payment behavior or payment docs in this stream
- Do not redesign smoke/evidence semantics
- Do not fix the separate `.next/dev/types` typecheck issue in this stream unless a tiny incidental safeguard is unavoidable
- Do not convert the PowerShell scripts themselves to bash unless strictly necessary

## Desired outcome
After the change:

- `pnpm run port:check` works in WSL/Linux shells when `powershell.exe` is available
- `pnpm run dev:3001` and `pnpm run start:3001` invoke the existing `.ps1` wrappers through the compatibility layer
- `pnpm run smoke:local`, `pnpm run ops:evidence`, `pnpm run ops:ui-evidence`, `pnpm run visual:update-baseline` invoke through the same compatibility layer
- `pnpm run visual:check` works with `python3` when `python` is absent
- README command guidance matches the actual supported invocation path
- Existing Windows/CI behavior remains intact

## High-level design
Add a small Node-based compatibility runner that selects the best available executor at runtime.

### Runner rules
For PowerShell-backed scripts:
1. Prefer `powershell` if available
2. Else prefer `pwsh` if available
3. Else prefer `powershell.exe` if available
4. Else fail with a precise error telling the operator which executables were checked

For Python-backed scripts:
1. Prefer `python`
2. Else prefer `python3`
3. Else fail with a precise error

Why Node runner instead of shell script:
- already guaranteed by pnpm/node workflow
- avoids bash/WSL quoting issues around Windows paths and `.ps1`
- lets package scripts stay cross-environment with one invocation form
- preserves existing `.ps1` script logic with minimal blast radius

## Files expected to change
Primary:
- `package.json`
- `README.md`
- `scripts/verify-visual-baseline.py` (only if needed; likely unchanged)
- new file: `scripts/run-powershell-script.mjs`
- new file: `scripts/run-python-script.mjs`

Potential optional doc touch if README is not enough:
- `docs/mvp-operations.md`

## Task breakdown

### Task 1 — Add PowerShell compatibility runner
Create `scripts/run-powershell-script.mjs`.

Responsibilities:
- accept script path plus trailing args
- resolve project-root-relative script path safely
- detect available executables in this order: `powershell`, `pwsh`, `powershell.exe`
- spawn the detected executable with:
  - `-ExecutionPolicy Bypass`
  - `-File <script>`
  - pass-through args unchanged
- inherit stdio
- exit with child exit code
- print a concise, actionable error if no runner exists

Implementation notes:
- use Node `child_process.spawnSync`
- use `process.cwd()` / `import.meta.url` safely so package-script cwd works
- do not swallow stderr
- do not do path guessing beyond stable repo-relative resolution

Acceptance:
- direct invocation such as
  `node scripts/run-powershell-script.mjs ./scripts/check-port.ps1 -Port 3000`
  works in current WSL via `powershell.exe`

### Task 2 — Add Python compatibility runner
Create `scripts/run-python-script.mjs`.

Responsibilities:
- accept target script path plus trailing args
- detect `python`, else `python3`
- spawn chosen interpreter with inherited stdio
- exit with child exit code
- print precise error if neither exists

Acceptance:
- direct invocation such as
  `node scripts/run-python-script.mjs scripts/verify-visual-baseline.py`
  gets past interpreter lookup in current WSL
  (script may still fail later for app/runtime reasons; runner success is interpreter dispatch)

### Task 3 — Rewire package.json scripts
Replace hardcoded runners in `package.json`.

Target mappings:
- `dev:3001` -> `node scripts/run-powershell-script.mjs ./scripts/run-next-with-port.ps1 -Mode dev -Port 3001`
- `start:3001` -> same wrapper with `-Mode start`
- `port:check` -> wrapper for `./scripts/check-port.ps1 -Port 3000`
- `smoke:local` -> wrapper for `./scripts/live-smoke.ps1`
- `ops:evidence` -> wrapper for `./scripts/collect-ops-evidence.ps1`
- `ops:ui-evidence` -> wrapper for `./scripts/capture-ui-evidence.ps1`
- `visual:update-baseline` -> wrapper for `./scripts/update-visual-baseline.ps1`
- `visual:check` -> `node scripts/run-python-script.mjs scripts/verify-visual-baseline.py`

Preserve all other scripts unchanged.

Acceptance:
- `pnpm run port:check` no longer fails at shell lookup stage in current WSL
- `pnpm run visual:check` no longer fails at interpreter lookup stage in current WSL

### Task 4 — Update operator-facing command docs
Update `README.md` command/notes section so it no longer implies direct `./scripts/*.ps1` execution is the primary portable path.

Required doc changes:
- present `pnpm ...` commands as canonical cross-environment entrypoints
- mention that PowerShell-backed tasks auto-select `powershell`, `pwsh`, or `powershell.exe`
- mention that visual check auto-selects `python` or `python3`
- do not claim bash can execute `.ps1` directly
- keep payment deferred note intact

Optional if needed for consistency:
- patch `docs/mvp-operations.md` only if it currently instructs direct shell invocation in a way that conflicts with README

### Task 5 — Verification
Run these in the project root:
- `pnpm run port:check`
- `pnpm run visual:check`

Expected:
- neither should fail with `powershell: not found` / `python: not found`
- `port:check` should succeed fully in current WSL
- `visual:check` may fail later because capture prerequisites/app availability are missing; that is acceptable if interpreter dispatch succeeds and the failure moves deeper into the actual workflow

Optional additional checks if low-cost:
- `node scripts/run-powershell-script.mjs ./scripts/check-port.ps1 -Port 3000`
- `node scripts/run-python-script.mjs scripts/verify-visual-baseline.py --help` only if script supports it; otherwise skip

## Review plan (must follow harness order)

### Spec compliance review
Reviewer checks:
- package scripts now use compatibility runners instead of raw `powershell` / `python`
- runner selection order matches plan
- Windows/CI compatibility preserved
- no payment-scope changes
- docs now reflect canonical invocation path truthfully

### Quality review
Reviewer checks:
- quoting/path handling for `.ps1` and `.py` paths is safe
- child exit codes propagate correctly
- runner error messages are specific and actionable
- no hidden cwd assumptions
- package.json changes do not break Node module resolution

### Integration review
Reviewer checks with command evidence:
- `pnpm run port:check` no longer fails at runner lookup stage
- `pnpm run visual:check` no longer fails at interpreter lookup stage
- README guidance matches actual successful invocation path

## Risks / failure modes
- `powershell.exe` path quoting from WSL can be brittle if script path normalization is wrong
- a naive wrapper may accidentally alter PowerShell argument boundaries
- `visual:check` might still fail due to runtime/image dependencies; that does not invalidate runner compatibility if interpreter dispatch is fixed
- this stream does not solve the separate `.next/dev/types` typecheck issue; avoid scope creep

## If implementation succeeds
Recommended next stream:
1. waitlist truthfulness drift (docs claim deprecated/410 while route + smoke evidence show live 400/200)
2. `.next/dev/types` contamination causing `pnpm typecheck` false failure or unstable failure

## Controller note
This plan is implementation-ready for a zero-context implementer. No repo/wiki edits beyond this plan file are authorized during planning stage.