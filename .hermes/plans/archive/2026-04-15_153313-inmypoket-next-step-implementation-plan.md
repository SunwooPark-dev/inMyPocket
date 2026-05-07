# inMyPoket Next-Step Implementation Plan

> **For Hermes:** Use `subagent-driven-development` skill to execute this plan task-by-task. Keep one fresh subagent per task. Run spec review first, code-quality review second, then integrate.

**Goal:** Restore non-payment lead capture, harden publication governance, and simplify the homepage into an answer-first trust surface without breaking the existing founding-member checkout path.

**Architecture:** Split execution into three lanes after a short Phase 0. Lane A restores weekly-update lead capture independently of Stripe. Lane B simplifies the homepage and makes trust signals evidence-first. Lane C separates raw observation storage from public publication by introducing a real publication state model. Lane A and Lane B can run in parallel after shared prerequisites. Lane C is partly parallelizable but must own schema/runtime publication semantics.

**Tech Stack:** Next.js App Router, TypeScript, node:test (`--experimental-strip-types`), Supabase, Stripe.

---

## Current verified context

Confirmed from direct reads:
- Active backend cwd is `/mnt/c/Users/sunwo`, but canonical project files are readable under `/mnt/c/Users/sunwo/workspace/inMyPoket`.
- `git rev-parse --show-toplevel` fails inside `/mnt/c/Users/sunwo/workspace/inMyPoket` with `fatal: not a git repository...`. Treat git commands below as conditional until repo-root discovery is resolved.
- `package.json` currently pins `npm test` to a single file:
  - `node --test --experimental-strip-types tests/normalization.test.ts`
- `src/app/api/waitlist/route.ts` currently returns `410` deprecated.
- `src/app/api/founding-member/checkout/route.ts` is the active payment path.
- `src/lib/env.ts` gates payment via `isPaymentFlowEnabled()` requiring both Supabase and Stripe.
- `src/components/waitlist-form.tsx` posts to `/api/founding-member/checkout` and disables interaction when checkout is off.
- `src/app/page.tsx` conditionally renders the weekly-update section only when payment is enabled.
- `supabase/migrations/202604130001_inmypoket_foundations.sql` defines `public.published_price_observations` as a straight view over `public.price_observations`, meaning raw observations are not truly separated from public publication state.

## High-confidence product priorities

Keep this order unless a newly discovered blocker forces re-sequencing:
1. Restore non-payment lead capture.
2. Freeze publication governance spec in code and schema.
3. Simplify homepage IA into answer-first trust UX.
4. Resume Stripe proof only after 1-3 are stable.

## Non-negotiable execution rules

- Planning assumptions must be revalidated by the implementing subagent before code changes.
- Lane A, Lane B, Lane C should each have separate implementer/reviewer chains.
- Do not let multiple implementers modify the same file at the same time.
- Any task touching shared files (`src/app/page.tsx`, `src/lib/compare.ts`, `package.json`) must run sequentially within its lane.
- Schema changes must be reviewed against existing migrations before runtime code merges.

---

## Phase 0: Workspace and execution baseline

### Task 0.1: Reconfirm repo root and top-level markers

**Objective:** Remove path ambiguity before any implementation starts.

**Files:**
- Inspect: `/mnt/c/Users/sunwo/workspace/inMyPoket/README.md`
- Inspect: `/mnt/c/Users/sunwo/workspace/inMyPoket/package.json`
- Inspect: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/`
- Inspect: `/mnt/c/Users/sunwo/workspace/inMyPoket/docs/`
- Inspect: `/mnt/c/Users/sunwo/workspace/inMyPoket/supabase/`

**Step 1: Verify filesystem location**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && pwd && test -f package.json && echo PACKAGE_OK && test -d src && echo SRC_OK && test -d supabase && echo SUPABASE_OK`
Expected: path prints; marker lines print.

**Step 2: Verify git root or explicitly log mismatch**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && git rev-parse --show-toplevel`
Expected now: likely FAIL based on current evidence.
If FAIL persists, do not guess. Record in execution notes and skip commit steps until real repo root is rediscovered.

**Step 3: Verify baseline test command**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && npm test`
Expected: current single-file test suite passes.

### Task 0.2: Snapshot current single-file test coverage limits

**Objective:** Make the test harness gap explicit before adding new files.

**Files:**
- Inspect: `/mnt/c/Users/sunwo/workspace/inMyPoket/package.json:6-24`
- Inspect: `/mnt/c/Users/sunwo/workspace/inMyPoket/tests/normalization.test.ts`

**Step 1: Confirm current test scope**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && node --test --experimental-strip-types tests/normalization.test.ts`
Expected: PASS.

**Step 2: Decide harness expansion path**
Preferred path:
- Update `package.json` test script later to run `tests/**/*.test.ts` once new files are added.
Fallback path:
- Run individual file-specific `node --test --experimental-strip-types tests/<name>.test.ts` commands until broader script update lands.

---

## Lane A: Demand harness — restore non-payment lead capture

### Lane A architecture decision

Choose one implementation path and do not fork mid-lane:
- Use existing `founding_member_signups` storage for both paid and free leads.
- Differentiate free leads by `plan_code = "weekly-updates"` and a distinct non-payment status such as `subscribed`.
- Do not reuse `pending_checkout` for free leads.

Reason:
- Fastest path to restore lead capture.
- Reuses existing Supabase persistence.
- Avoids inventing a new table until product economics justify it.

### Task A1: Add failing tests for lead-capture gating rules

**Objective:** Lock down the distinction between payment enablement and lead-capture enablement.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/tests/normalization.test.ts`
- Modify later: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/env.ts`

**Step 1: Write failing tests**
Add tests covering:
- Supabase-only env => lead capture enabled.
- Supabase+Stripe env => lead capture enabled.
- Missing Supabase => lead capture disabled.
- Payment enabled remains stricter than lead capture enabled.

**Step 2: Run focused test**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && node --test --experimental-strip-types tests/normalization.test.ts`
Expected: FAIL because `isLeadCaptureEnabled` does not exist yet.

**Step 3: Minimal implementation**
Implement `isLeadCaptureEnabled()` in `src/lib/env.ts` using Supabase readiness only.

**Step 4: Re-run**
Same command as Step 2.
Expected: PASS.

### Task A2: Add failing tests for waitlist payload validation and idempotent behavior

**Objective:** Define the non-payment API contract before reviving `/api/waitlist`.

**Files:**
- Create: `/mnt/c/Users/sunwo/workspace/inMyPoket/tests/waitlist-route.test.ts`
- Modify later: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/api/waitlist/route.ts`
- Modify later: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/founding-member-storage.ts`
- Optional create: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/waitlist.ts`

**Step 1: Write failing tests**
Cover at minimum:
- valid email + 5-digit ZIP => 200 and `{ ok: true, status: "subscribed" }`
- invalid email => 400
- invalid ZIP => 400
- Supabase not configured => 503
- duplicate email+zip weekly-updates submission => 200 and `{ ok: true, status: "already_subscribed" }`

**Step 2: Run focused test**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && node --test --experimental-strip-types tests/waitlist-route.test.ts`
Expected: FAIL because route still returns 410 or helper functions do not exist.

**Step 3: Minimal implementation**
- Replace the deprecated 410 behavior in `src/app/api/waitlist/route.ts`.
- Keep validation logic pure if possible by extracting helpers into `src/lib/waitlist.ts`.
- Make duplicate submissions idempotent rather than erroring.

**Step 4: Re-run**
Same command as Step 2.
Expected: PASS.

### Task A3: Extend storage semantics for free leads

**Objective:** Ensure weekly updates are persisted without colliding semantically with paid checkout state.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/domain.ts`
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/founding-member-storage.ts`
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/server-storage.ts`
- Possibly modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/supabase/migrations/202604130001_inmypoket_foundations.sql` only if a new follow-up migration is required, not by editing the historical migration in place
- Create if needed: `/mnt/c/Users/sunwo/workspace/inMyPoket/supabase/migrations/<new_timestamp>_weekly_updates_status.sql`

**Step 1: Write failing tests**
Add storage-level tests asserting:
- free lead uses `plan_code = "weekly-updates"`
- free lead uses non-payment status like `subscribed`
- duplicate identity does not create uncontrolled duplicate semantics

**Step 2: Run focused tests**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && node --test --experimental-strip-types tests/waitlist-route.test.ts`
Expected: FAIL on status/plan semantics until storage is updated.

**Step 3: Minimal implementation**
- Update domain types.
- Update storage helpers to read/write weekly-updates records explicitly.
- If database constraints block new status values, add a new migration instead of mutating historical SQL.

**Step 4: Re-run**
Same command as Step 2.
Expected: PASS.

### Task A4: Turn `WaitlistForm` into an explicit two-mode component

**Objective:** Keep checkout intact while allowing non-payment signups when Stripe is off.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/components/waitlist-form.tsx`
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/page.tsx`
- Optional create: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/waitlist-form-state.ts`

**Step 1: Write failing tests around mode selection**
Prefer pure-helper extraction over DOM-heavy tests. Cover:
- payment mode => POST `/api/founding-member/checkout`, redirect on success
- weekly-updates mode => POST `/api/waitlist`, inline success state, no checkout redirect

**Step 2: Run focused test**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && node --test --experimental-strip-types tests/waitlist-route.test.ts`
Expected: FAIL until helper/component behavior is updated.

**Step 3: Minimal implementation**
- Give the component an explicit mode or separate `leadCaptureEnabled` and `paymentEnabled` props.
- Keep success copy grounded: “You’re on the list for weekly updates.”
- Do not imply payment or membership in free mode.

**Step 4: Re-run**
Same command.
Expected: PASS.

### Task A5: Re-enable homepage lead-capture section independently of Stripe

**Objective:** Surface the weekly updates capture path when Supabase is ready, even if Stripe is not.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/page.tsx`
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/env.ts`

**Step 1: Write failing tests**
Cover:
- Supabase on / Stripe off => weekly update section still shows
- Supabase off => section hidden or clearly unavailable

**Step 2: Run focused test**
Use the lane’s chosen test file.
Expected: FAIL until page gating is changed.

**Step 3: Minimal implementation**
- Switch section gating from `paymentEnabled` to `leadCaptureEnabled`.
- Keep payment CTA logic separate.

**Step 4: Re-run**
Expected: PASS.

**Lane A acceptance criteria**
- Stripe-off environments can still collect email + ZIP for weekly updates.
- `/api/waitlist` no longer returns 410.
- Duplicate free-lead submissions are idempotent successes.
- Paid checkout path still works unchanged.
- Free lead copy does not overpromise paid membership or email delivery guarantees.

---

## Lane B: Trust/UI harness — answer-first homepage simplification

### Lane B architecture decision

Do not invent new data sources. Reframe the homepage around existing computed data.
Primary UX move:
- Remove synthetic social proof.
- Promote the “best place to shop today” answer block.
- Expose trust through evidence labels: same basket, last checked, coverage, estimate disclosure, limited-state warning.

### Task B1: Remove synthetic social proof with regression coverage

**Objective:** Eliminate fabricated or assumption-based credibility signals.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/page.tsx`
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/tests/normalization.test.ts` or create a dedicated homepage-trust test

**Step 1: Write failing regression test**
Add a test that proves synthetic “community savings this month” content is no longer part of the homepage decision helpers or rendered copy selection.

**Step 2: Run focused test**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && node --test --experimental-strip-types tests/normalization.test.ts`
Expected: FAIL before removal.

**Step 3: Minimal implementation**
- Remove the `communityMonthlySavings` synthetic metric and its UI usage.
- Do not replace it with another inferred KPI.

**Step 4: Re-run**
Expected: PASS.

### Task B2: Extract a homepage trust-summary helper

**Objective:** Convert existing comparison data into directly renderable trust labels.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/compare.ts`
- Create: `/mnt/c/Users/sunwo/workspace/inMyPoket/tests/home-trust.test.ts`

**Step 1: Write failing tests**
Cover a helper that returns at least:
- `coverageRate`
- `publishReady`
- `blockers`
- counts for exact vs estimated/near-match items if derivable
- checked timestamp label or raw timestamp passthrough

**Step 2: Run focused test**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && node --test --experimental-strip-types tests/home-trust.test.ts`
Expected: FAIL because helper does not exist.

**Step 3: Minimal implementation**
Add a pure helper to `src/lib/compare.ts` rather than embedding logic in JSX.

**Step 4: Re-run**
Expected: PASS.

### Task B3: Rebuild homepage first viewport into answer-first order

**Objective:** Make the user understand “where should I shop today?” within the first screen.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/page.tsx`
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/globals.css`
- Possibly modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/components/section-card.tsx`

**Step 1: Write failing tests or helper assertions**
If DOM harness is absent, test extracted copy/order helpers instead of full DOM snapshots.
Cover intended sections in order:
1. concise context line
2. best-store answer
3. why-this-answer trust details
4. compare nearby stores
5. full item details
6. advanced controls

**Step 2: Run focused test**
Use the helper test file.
Expected: FAIL before helper/page changes.

**Step 3: Minimal implementation**
- Shrink hero.
- Promote the decision card.
- Move advanced scenario/area controls lower.
- Keep printable output secondary.

**Step 4: Re-run**
Expected: PASS.

### Task B4: Add limited-state UX for incomplete publish readiness

**Objective:** Stop overstating certainty when data quality is below the publish threshold.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/page.tsx`
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/compare.ts`
- Possibly modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/components/retailer-card.tsx`
- Possibly modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/components/product-comparison-table.tsx`

**Step 1: Write failing tests**
Cover three states:
- strong answer: cheapest exists and `publishReady=true`
- limited answer: cheapest exists and `publishReady=false`
- unavailable answer: no eligible comparison

**Step 2: Run focused test**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && node --test --experimental-strip-types tests/home-trust.test.ts`
Expected: FAIL.

**Step 3: Minimal implementation**
- Render a limitation badge or warning when answer confidence is limited.
- Do not phrase a limited answer as a definitive winner.

**Step 4: Re-run**
Expected: PASS.

**Lane B acceptance criteria**
- Synthetic social proof is gone.
- The first viewport answers the main question before showing detail.
- Trust labels are evidence-based, not marketing-based.
- Limited-data states are visibly distinct from strong-answer states.
- Existing comparison table remains accessible.

---

## Lane C: Publication governance harness — separate raw storage from public publication

### Lane C architecture decision

Adopt a real publication layer rather than treating the public view name as publication state.
Recommended implementation path:
- Keep `price_observations` as raw intake.
- Add publication metadata and event tracking via new tables or an equivalent normalized structure.
- Redefine `published_price_observations` to expose only state-valid, fresh, not-taken-down rows.

Preferred schema shape:
- `observation_publications`
- `observation_publication_events`

If implementation pressure is too high, a single-table extension is acceptable for MVP, but event logging must still exist somewhere.

### Task C1: Lock down the governance gaps with failing tests

**Objective:** Prove the current system lacks a real publication state model.

**Files:**
- Create: `/mnt/c/Users/sunwo/workspace/inMyPoket/tests/publication-governance.test.ts`
- Inspect: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/compare.ts`
- Inspect: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/observation-repository.ts`
- Inspect: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/source-policy.ts`

**Step 1: Write failing tests**
Cover at minimum:
- stale observations cannot be published
- raw saves do not automatically become public
- base regular scenario rejects coupon/member/weekly-ad contamination
- missing source URL or collected timestamp blocks publication

**Step 2: Run focused test**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && node --test --experimental-strip-types tests/publication-governance.test.ts`
Expected: FAIL.

**Step 3: Minimal implementation target definition**
Create a pure governance evaluator module, likely `src/lib/publication-governance.ts`.

**Step 4: Re-run**
Expected after implementation later: PASS.

### Task C2: Add a publication state-machine module with explicit transitions

**Objective:** Prevent raw observations from skipping directly into public state.

**Files:**
- Create: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/publication-state-machine.ts`
- Create: `/mnt/c/Users/sunwo/workspace/inMyPoket/tests/publication-state-machine.test.ts`
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/domain.ts`

**Step 1: Write failing tests**
Required transitions:
- `draft -> review_ready` allowed
- `review_ready -> approved` allowed when governance passes
- `approved -> published` allowed
- `published -> taken_down` allowed
- `draft -> published` forbidden
- rollback/takedown events require actor + reason payload

**Step 2: Run focused test**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && node --test --experimental-strip-types tests/publication-state-machine.test.ts`
Expected: FAIL.

**Step 3: Minimal implementation**
Define explicit types and a transition function returning either success with event payload or a structured rejection.

**Step 4: Re-run**
Expected: PASS.

### Task C3: Add a new Supabase migration for publication tables or columns

**Objective:** Make the database enforce the raw/public separation.

**Files:**
- Create: `/mnt/c/Users/sunwo/workspace/inMyPoket/supabase/migrations/<new_timestamp>_publication_governance.sql`
- Inspect only: `/mnt/c/Users/sunwo/workspace/inMyPoket/supabase/migrations/202604130001_inmypoket_foundations.sql`
- Inspect only: `/mnt/c/Users/sunwo/workspace/inMyPoket/supabase/migrations/202604130002_fix_published_view_grants.sql`

**Step 1: Write a contract test first**
Create or extend:
- `/mnt/c/Users/sunwo/workspace/inMyPoket/tests/publication-view-contract.test.ts`

Contract must assert:
- public projection contains only `published + fresh + not taken_down`
- duplicate public candidates resolve deterministically
- stale and taken-down records are excluded

**Step 2: Run focused test**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && node --test --experimental-strip-types tests/publication-view-contract.test.ts`
Expected: FAIL.

**Step 3: Add migration**
Do not edit historical migration files in place. Add a new migration that:
- creates publication state storage
- creates publication events storage
- redefines `public.published_price_observations`
- preserves select grants only on the filtered public projection

**Step 4: Verify migration syntax**
Run a project-appropriate migration validation command if available. If none exists, at minimum review SQL for references, grants, and incompatible assumptions.

### Task C4: Make repository and feed reads publication-aware

**Objective:** Ensure runtime code consumes only sanctioned public data.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/observation-repository.ts`
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/observation-feed.ts`
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/compare.ts`
- Create: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/publication-governance.ts`

**Step 1: Write failing tests**
Cover:
- public feed excludes stale/taken_down/draft records
- latest valid published record wins for a comparable key
- governance evaluator returns exact blocker reasons

**Step 2: Run focused test**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && node --test --experimental-strip-types tests/publication-governance.test.ts tests/publication-view-contract.test.ts`
Expected: FAIL.

**Step 3: Minimal implementation**
- Keep `compare.ts` focused on normalization and selection.
- Put freshness/source/scenario rules in `publication-governance.ts`.
- Make repository projection reads explicit.

**Step 4: Re-run**
Expected: PASS.

### Task C5: Split raw-save admin actions from publication actions

**Objective:** Give operators explicit approve/publish/takedown/rollback controls.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/api/observations/route.ts`
- Create: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/api/publications/route.ts`
- Create: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/api/publications/[id]/publish/route.ts`
- Create: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/api/publications/[id]/takedown/route.ts`
- Create: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/api/publications/[id]/rollback/route.ts`
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/app/admin/page.tsx`
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/src/components/admin-preview-form.tsx`
- Create if needed:
  - `/mnt/c/Users/sunwo/workspace/inMyPoket/src/components/publication-review-table.tsx`
  - `/mnt/c/Users/sunwo/workspace/inMyPoket/src/components/publication-action-panel.tsx`
  - `/mnt/c/Users/sunwo/workspace/inMyPoket/src/components/publication-audit-log.tsx`

**Step 1: Write failing tests**
Cover API behavior for:
- approve/publish success
- takedown requires reason
- rollback creates audit event
- raw save does not publish anything by itself

**Step 2: Run focused tests**
Run individual node:test files for the new routes/helpers.
Expected: FAIL.

**Step 3: Minimal implementation**
Keep admin actor identity simple for MVP if needed, but event payloads must still record actor and action time.

**Step 4: Re-run**
Expected: PASS.

### Task C6: Update operational docs so runtime, schema, and ops agree

**Objective:** Freeze the governance contract in documentation.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/docs/mvp-operations.md`
- Create if needed:
  - `/mnt/c/Users/sunwo/workspace/inMyPoket/docs/publication-governance.md`
  - `/mnt/c/Users/sunwo/workspace/inMyPoket/docs/takedown-runbook.md`
  - `/mnt/c/Users/sunwo/workspace/inMyPoket/docs/data-retention.md`

**Step 1: Write doc checklist tests if feasible, otherwise a reviewer checklist**
Checklist must cover:
- state machine definition
- freshness TTL by channel
- takedown triggers
- rollback triggers
- retention/audit expectations

**Step 2: Implement docs**
Ensure docs match actual schema names, route names, and state labels.

**Step 3: Verify manually**
Read docs and code side-by-side.
Expected: no mismatch in state names or operational steps.

**Lane C acceptance criteria**
- Raw observation save no longer implies public publication.
- Public view is filtered by publication state and freshness.
- State transitions are explicit and test-covered.
- Takedown and rollback are available and auditable.
- Docs match runtime and schema behavior.

---

## Shared test-harness tasks

### Task T1: Expand test script after new files land

**Objective:** Stop relying on a single monolithic test file.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/package.json`

**Step 1: Write failing expectation in execution notes**
Current script only runs `tests/normalization.test.ts`.

**Step 2: Minimal implementation**
Update test script to something like:
`node --test --experimental-strip-types tests/**/*.test.ts`
or another shell-safe equivalent supported in this environment.

**Step 3: Verify**
Run:
`cd /mnt/c/Users/sunwo/workspace/inMyPoket && npm test`
Expected: all test files discovered and executed.

### Task T2: Keep a preserved passing-case set

**Objective:** Prevent governance and UI changes from regressing core comparison behavior.

**Files:**
- Modify: `/mnt/c/Users/sunwo/workspace/inMyPoket/tests/normalization.test.ts`

**Must-preserve cases:**
- default basket coverage above 80% for pilot ZIP
- free-member scenario still changes totals without breaking publish rules
- non-comparable preview remains blocked
- founding-member checkout params still produce subscription metadata
- server-storage facade exports remain stable unless intentionally revised

---

## Suggested execution order

1. Phase 0.1
2. Phase 0.2
3. Run Lane A Task A1-A5
4. In parallel with late Lane A or immediately after A2, run Lane B Task B1-B4
5. Run Lane C Task C1-C6 with schema-first discipline
6. Run Task T1 and Task T2
7. Final integration review across all touched files

## Final integration verification

Run after all lanes pass their own tests:
- `cd /mnt/c/Users/sunwo/workspace/inMyPoket && npm run lint`
- `cd /mnt/c/Users/sunwo/workspace/inMyPoket && npm run typecheck`
- `cd /mnt/c/Users/sunwo/workspace/inMyPoket && npm test`

Expected:
- lint passes
- typecheck passes
- all node:test files pass
- homepage still builds
- waitlist route works without Stripe
- public observation feed no longer leaks raw/unpublished rows

## Main risks and open questions

1. Repo root mismatch
- Git root is still unresolved. This blocks reliable commit steps and may indicate a detached or copied workspace.

2. Database constraint uncertainty for free-lead status
- `founding_member_signups.status` is plain text in the initial migration, which is favorable, but later migrations may still impose assumptions. Reconfirm before shipping free-lead statuses.

3. Test harness expansion friction
- `node --test` glob behavior may differ in this shell. Verify the exact pattern before finalizing `package.json`.

4. Governance scope creep
- Lane C can balloon if it tries to solve every future policy. Keep MVP focused on state separation, TTL, takedown, rollback, and audit.

5. Copy risk on the homepage
- Do not reintroduce unverified social proof or aggregate savings claims until governance and evidence pipelines can support them.

## Controller verdict

Current status: on-track for a trust-first pilot, not yet on-track for scalable economics.

The next implementation round should not start with Stripe. It should start with:
1. restoring free lead capture,
2. preventing raw observation leakage into the public layer,
3. making the homepage evidence-first instead of persuasion-first.

If execution follows this plan with per-task subagents and independent reviews, the result should be implementation-ready and materially safer than the current checkout-centric path.

---

Plan authored in plan-only mode.
Git commit steps intentionally omitted from execution because repo-root discovery is currently unresolved.