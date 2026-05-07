# Dirty tree optimization packet — 2026-05-01

## Decision

`hold_dirty_tree_triage_required` remains the safe repo-level decision.

The only currently commit-shaped keep-set is the North Atlanta catalog boundary slice:

- `src/lib/demo-data.ts`
- `src/lib/domain.ts`
- `tests/location-context-lane-a.test.ts`
- `tests/normalization.test.ts`
- `docs/plans/2026-05-01-north-atlanta-catalog-boundary.md`

Do not commit the whole dirty tree. The tree mixes active MVP work, staged operator-queue work, payment deletions, generated/tooling churn, docs rewrites, database seed/migration edits, and local agent state.

## Fresh scoped evidence

Path-scoped checks for the North Atlanta keep-set:

- `git status --short -- <keep-set>` shows 4 modified code/test files plus 1 untracked plan doc.
- `git diff --stat -- <code/test keep-set>` shows `4 files changed, 75 insertions(+), 55 deletions(-)`.
- `git diff --check -- <keep-set>` exits `0`.
- Production drift grep over `src` for `97401|Eugene|fredmeyer|albertsons` returns no matches.
- Focused runtime check `npm test -- --test-name-pattern="ZIP validation helpers preserve the pilot-only contract|isAllowedSourceUrl accepts active official domains"` exits `0` with `105/105` passing under the current package script behavior.

## Bucket map

Read-only status classification:

| Bucket | Count | Action |
|---|---:|---|
| A_keep_north_atlanta | 5 | Keep as the next smallest safe slice. |
| B_operator_observation_candidate | 5 | Review next; likely useful for operator-first MVP, but already staged and should not be mixed with catalog boundary. |
| C_payment_checkout_freeze | 9 | Freeze. Decide whether to preserve inactive payment code or formally remove it later. |
| D_agent_local_state_freeze | 2 | Freeze; do not commit `.hermes/` or broad `docs/wiki/` without separate policy. |
| E_generated_tooling_review | 8 | Review separately; includes lockfiles, `tsconfig`, generated evidence/baseline artifacts. |
| F_db_seed_freeze | 3 | Freeze; DB seed/migration/Eugene seed should not ride with current app boundary slice. |
| G_docs_spec_review | 42 | Separate docs rewrite bucket. Needs theme-by-theme review. |
| H_test_harness_review | 11 | Separate harness bucket. Some may support operator-first hardening but not this slice. |
| I_app_code_review | 49 | Separate app-code bucket. Too broad for blind keep. |
| J_scripts_review | 30 | Separate scripts bucket. Needs safety/secret/output review before keep. |
| K_other_review | 8 | Config/README/workflow bucket. Review with CI intent. |

## Recommended next execution order

1. Preserve current worktree as-is; no reset, pull, rebase, stash, or broad formatting.
2. If committing is allowed later, stage only the A bucket paths and run:
   - `git diff --cached --check`
   - `npm run typecheck`
   - `npm test`
3. Then inspect B bucket as the next operator-first optimization slice.
4. Keep C/F frozen until product decision: payment inactive-retained vs deleted, and Eugene seed removed vs archived.
5. Treat D/E as repo-hygiene cleanup, not product work.

## Notes

- `src/lib/catalog.ts` may still appear modified in `git status`, but prior checks showed no HEAD content diff; treat it as metadata/index/line-ending anomaly unless a fresh content diff appears.
- This packet intentionally records paths and decisions only; it does not preserve secrets or runtime credentials.
