# Codex App Handoff — inMyPoket typecheck recovery + docs truth alignment

## Status note

This document is a **historical checkpoint handoff** for the typecheck-recovery slice that closed on `2026-04-16`.

Use it for:

- why the package-level `typecheck` hardening exists
- what was learned and rejected during that slice
- what that checkpoint verified successfully

Do **not** treat it as the canonical source for the repo's current next slice.

For current continuation, prefer:

- `docs/product-harness-status.md`
- `docs/release-readiness-checklist.md`
- `docs/roadmap-slices.md`
- `.ops-evidence/operator-proof.json`
- `.ops-evidence/external-proof-handoff.json`

## 1) Executive summary

inMyPoket is conditionally on track for the current non-payment milestone.

We did not trust status docs at face value. We verified the real local repo and found that the product looked broadly healthy, but `pnpm typecheck` had a fragile failure mode caused by malformed generated output under `.next/dev/types/validator.ts`.

We investigated this in harness-engineering style: baseline verification first, then parallel independent reviews, then controller reconciliation, then the smallest justified implementation slice. The first hypothesis was to remove `.next/dev/types/**/*.ts` from `tsconfig.json`, but live verification showed Next 16.2.3 auto-readds that include when `next typegen` runs in this repo. That means the durable minimal fix is package-level, not tsconfig-level.

Final implemented fix:
- change `package.json` `typecheck` from `tsc --noEmit` to `next typegen && tsc --noEmit`

Then we re-ran the full local quality gate and confirmed:
- `CI=true pnpm typecheck` ✅
- `CI=true pnpm lint` ✅
- `CI=true pnpm test` ✅ (`63/63` pass)
- `CI=true pnpm build` ✅

After that, we updated readiness/operator docs so they match verified truth instead of stale assumptions.

## 2) Current repo + environment facts

- Repo root: `/mnt/c/Users/sunwo/workspace/inMyPoket`
- Shell context during audit was WSL under `/mnt/c/...`
- Branch status at last verification: `main...origin/main [ahead 2, behind 5]`
- Remote: `origin https://github.com/SunwooPark-dev/inMyPocket.git`
- Node: `v22.22.2`
- pnpm: `10.32.1`
- Next: `16.2.3`

Important repo-specific learning:
- In this repo, `next typegen` can auto-readd `.next/dev/types/**/*.ts` to `tsconfig.json`.
- Do not assume a tsconfig include deletion will stick.
- The durable minimal typecheck hardening is the package script change.

## 3) Files materially changed in this slice

Implementation:
- `package.json`

Docs truth alignment:
- `docs/release-readiness-checklist.md`
- `docs/product-harness-status.md`
- `docs/accepted-risks.md`
- `docs/operator-evidence-bundle.md`

Plan artifact updated to reflect the final learning:
- `.hermes/plans/2026-04-16_161023-conversation-plan.md`

## 4) What exactly changed

### package.json

Changed:

```json
"typecheck": "tsc --noEmit"
```

to:

```json
"typecheck": "next typegen && tsc --noEmit"
```

Reason:
- the repo had a proven fragile failure mode in generated Next validator output
- generating route/layout types before `tsc` made the local gate deterministic again
- this fix worked without speculative app-code changes

### docs

The docs were updated so they now reflect verified live truth:
- include `pnpm test` in the quality gate where relevant
- say the engineering gate is green based on the current verified run
- stop implying stale timeless green status without a re-verification date/context
- fix the stale claim that the workspace is not attached to a recoverable git remote
- keep hosted proof honestly scoped: local success does not equal hosted-proof completion

## 5) Commands already verified successfully

Run from repo root:

```bash
cd /mnt/c/Users/sunwo/workspace/inMyPoket
CI=true pnpm typecheck
CI=true pnpm lint
CI=true pnpm test
CI=true pnpm build
```

Observed successful results:
- `pnpm typecheck`: passed with `next typegen && tsc --noEmit`
- `pnpm lint`: passed
- `pnpm test`: passed, `63/63`
- `pnpm build`: passed on Next.js `16.2.3`

## 6) What was considered and rejected

Rejected hypothesis:
- remove `.next/dev/types/**/*.ts` from `tsconfig.json`

Why rejected:
- Next 16.2.3 auto-readded it during `next typegen` in this repo
- therefore it is not the durable minimal fix here

Also intentionally out of scope for this slice:
- Stripe/payment reactivation
- homepage/product redesign
- Supabase schema work
- patching `.next/` generated files directly
- broad cleanup of unrelated dirty worktree files

## 7) Current judgment

Current judgment: conditionally on track.

Meaning:
- the non-payment milestone is still viable
- the red engineering gate risk we found has been neutralized locally
- docs now more honestly match current verified state
- but this is not the same thing as full hosted-proof closure or a clean release branch

## 8) Known remaining ambiguities / risks

1. The worktree already contains many unrelated modified/untracked files.
   - Be careful with commit boundaries.
   - Do not assume every current diff belongs to this slice.

2. Hosted proof is still not closed.
   - Local gate success is real.
   - Hosted artifact / GitHub Actions provenance is still a separate lane.

3. Remote history drift exists.
   - Local branch and `origin/main` are not currently in a simple aligned state.
   - Re-fetch before making hosted-proof or merge-readiness claims.

## 9) If Codex continues from this checkpoint, what it should do next

Preferred next priority order:
1. preserve the current green engineering gate
2. keep docs truth-aligned
3. isolate a clean commit boundary for just this slice
4. only then hand off to the current repo continuation docs instead of re-deriving the next slice from this checkpoint alone

Current repo continuation, as of the latest verified docs, is no longer “implement Demand Harness 1.”

The weekly-updates bridge slice is already reflected in the current repo status docs, and the next local maintenance lane is now:

- `Publication-governed smoke and operator-doc maintenance`

External follow-up lanes remain separate:

- real hosted proof observation
- Stripe payment proof reopening once secrets are available

Codex should NOT reopen these topics unless explicitly asked:
- Stripe/payment implementation
- smoke-test storytelling unrelated to the current task
- generic env verification loops
- speculative refactors outside this minimal slice

## 10) Ready-to-paste Codex App prompt

```text
Stop any previous smoke-test, payment, or generic environment-verification track.
Do not reopen Stripe, hosted-proof, or broad repo cleanup unless explicitly required.

Work only on the current inMyPoket repo at:
/mnt/c/Users/sunwo/workspace/inMyPoket

Read these files first:
- package.json
- docs/release-readiness-checklist.md
- docs/product-harness-status.md
- docs/accepted-risks.md
- docs/operator-evidence-bundle.md
- .hermes/plans/2026-04-16_161023-conversation-plan.md
- docs/codex-handoff-2026-04-16-typecheck-docs.md

Context you must preserve:
- We found a real fragile typecheck failure involving `.next/dev/types/validator.ts`.
- The initial tsconfig-removal hypothesis was rejected because Next 16.2.3 auto-readds `.next/dev/types/**/*.ts` during `next typegen` in this repo.
- The durable minimal fix is already identified and implemented at package level: `next typegen && tsc --noEmit`.
- Local verification already passed for `typecheck`, `lint`, `test`, and `build`.
- Docs were updated to match verified truth.
- Payment remains deferred.
- Hosted proof is still a separate lane and must not be overclaimed.

Your task now is NOT to rediscover the same fix.
Your task is to take over cleanly from this checkpoint.

Do the following:
1. Verify the current changed state matches the handoff.
2. Propose the smallest safe commit boundary for this slice only.
3. Identify any doc wording that is still overstated or internally inconsistent.
4. If everything is consistent, pivot to the current continuation docs and prepare the next implementation-ready slice from there instead of assuming Demand Harness 1 is still open.

Rules:
- no speculative app refactors
- no Stripe work
- no editing generated `.next/` files
- no claims about hosted proof without an actual hosted artifact/run link
- if you mention payment activation as the next priority, you are off track

Output format:
- current_state_verdict
- commit_boundary_files
- remaining_doc_risks
- next_slice_recommendation
- exact next prompt for implementation
```

## 11) One-paragraph elevator handoff

We audited inMyPoket from the live repo rather than trusting the docs, found that the non-payment milestone was broadly on track but the engineering gate had a real fragile `typecheck` failure caused by generated Next dev-type artifacts, tested multiple hypotheses in harness-engineering style, learned that removing `.next/dev/types` from `tsconfig` is not durable because Next 16.2.3 auto-readds it in this repo, fixed the issue at the package level by changing `typecheck` to `next typegen && tsc --noEmit`, re-ran `typecheck/lint/test/build` successfully, and then updated readiness/operator docs so they reflect the verified local truth without overclaiming hosted proof or reopening deferred payment work.
