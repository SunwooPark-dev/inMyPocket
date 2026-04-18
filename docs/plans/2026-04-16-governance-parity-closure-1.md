# Governance Parity Closure 1 Implementation Plan

> For Hermes: use subagent-driven-development skill to execute this plan task-by-task with independent schema/view/audit/test lanes, then reconcile with a controller pass.

Goal: close the approval-safe governance gap so `inMyPoket` can move from governed runtime proof toward human-approved, machine-executed ZIP snapshot publication.

Architecture: keep Supabase/Postgres as the single system of record, move more of the publication contract from app-only logic into schema/view/audit primitives, and keep the web app as a fail-closed consumer of governed outputs. This slice does not attempt zero-human publication. It makes publication semantics canonical and testable.

Tech stack: Supabase SQL migrations, Next.js/TypeScript runtime, Node test runner, existing governance/readiness docs.

---

## Phase 0 — Baseline verification

### Task 0.1: Reconfirm repo baseline before edits
Objective: make sure implementation starts from the currently verified repo state rather than stale assumptions.

Files:
- Verify: `README.md`
- Verify: `docs/harness-automated-publication-controller-2026-04-16.md`
- Verify: `supabase/migrations/202604160201_governance_kernel_1.sql`
- Verify: `tests/publication-governance-lane-a.test.ts`

Steps:
1. Run `git -C /mnt/c/Users/sunwo/workspace/inMyPoket status --short --branch`.
2. Run `pnpm test`.
3. Run `pnpm build`.
4. Record the exact pre-change baseline in the implementation thread before any code edits.

Expected result:
- tests and build pass from the current line
- baseline divergence is acknowledged before new work begins

---

## Phase 1 — Schema parity with Spec 1

### Task 1.1: Add missing observation governance fields
Objective: encode the missing logical governance fields required by Spec 1 into `price_observations`.

Files:
- Create: `supabase/migrations/20260416xxxx_governance_parity_closure_1.sql`
- Reference: `docs/publication-governance-spec-1.md`
- Reference: `supabase/migrations/202604160201_governance_kernel_1.sql`

Fields to add:
- `collected_by`
- `review_requested_at`
- `review_requested_by`
- `retired_by`
- `retired_reason`
- `invalidated_by`
- `invalidated_reason`
- `supersedes_observation_id`
- `replaced_by_observation_id`
- `governance_notes`

Verification:
- migration defines nullable/non-nullable semantics consistent with state-based requirements
- references for supersession fields are self-referential and safe on delete

### Task 1.2: Add missing snapshot governance fields
Objective: make `price_publication_snapshots` capable of carrying review/publish/retire/invalidation provenance.

Files:
- Modify via new migration: `supabase/migrations/20260416xxxx_governance_parity_closure_1.sql`
- Reference: `docs/publication-governance-spec-1.md`

Fields to add:
- `review_requested_at`
- `review_requested_by`
- `published_by`
- `retired_by`
- `retired_reason`
- `invalidated_by`
- `invalidated_reason`
- optional run metadata: `controller_run_id` or `rule_version`

Verification:
- a published snapshot has enough provenance to support audit and rollback
- invalidated/retired snapshots preserve actor + reason context

### Task 1.3: Add state transition constraints
Objective: prevent illegal lifecycle jumps at the storage layer.

Files:
- Modify via new migration: `supabase/migrations/20260416xxxx_governance_parity_closure_1.sql`
- Reference: `docs/publication-governance-spec-1.md`

Required enforcement:
- `review_required` requires `review_requested_at`, `review_requested_by`, `collected_by`
- `approved` requires all `review_required` fields plus `approved_at`, `approved_by`
- `published` requires all `approved` fields plus `published_at`, `published_snapshot_id`
- `retired` requires timestamp + actor + reason
- `invalidated` requires timestamp + actor + reason
- collector and approver must be distinct in normal operation

Verification:
- invalid rows fail in SQL-level tests or migration guard queries

---

## Phase 2 — Immutable audit contract

### Task 2.1: Create publication audit table
Objective: create the immutable audit structure required by Spec 1.

Files:
- Modify via new migration: `supabase/migrations/20260416xxxx_governance_parity_closure_1.sql`
- Reference: `docs/publication-governance-spec-1.md`

Minimum table shape:
- `audit_event_id`
- `event_type`
- `occurred_at`
- `actor_id`
- `observation_id`
- `snapshot_id`
- `zip_code`
- `from_state`
- `to_state`
- `reason_code`
- `reason_detail`
- `evidence_reference`
- `request_reference`

Verification:
- table is append-only by design
- retirement/invalidation/rollback do not destroy audit history

### Task 2.2: Define minimal audit event write points
Objective: ensure the next implementation slice knows exactly which actions must write audit events.

Files:
- Modify: `docs/harness-automated-publication-controller-2026-04-16.md`
- Modify or create: `docs/governance-parity-closure-1-plan.md` if a supporting design note is helpful

Required event list:
- observation created
- review requested
- approved
- published
- retired
- invalidated
- rollback executed
- snapshot activated
- snapshot deactivated

Verification:
- docs and schema use the same event vocabulary

---

## Phase 3 — Governed public view redesign

### Task 3.1: Harden `published_price_observations`
Objective: make the public view canonical rather than merely convenient.

Files:
- Modify via new migration: `supabase/migrations/20260416xxxx_governance_parity_closure_1.sql`
- Reference: `src/lib/observation-feed.ts`
- Reference: `src/lib/observation-repository.ts`

Required behavior:
- only rows in the active ZIP snapshot are public
- only `review_status = 'published'` rows are public
- stale rows are excluded at read time
- retired rows are excluded
- invalidated rows are excluded immediately
- `store_call` rows stay excluded
- newer unapproved rows cannot shadow approved public rows

Verification:
- public semantics in SQL match the assumptions already present in app logic

### Task 3.2: Decide DB-versus-app source of truth explicitly
Objective: eliminate ambiguous split-brain governance between app filters and DB filters.

Files:
- Modify: `src/lib/observation-feed.ts`
- Modify if needed: `tests/publication-governance-lane-a.test.ts`
- Modify: `docs/release-readiness-checklist.md`

Decision rule:
- DB/view becomes the primary publication contract
- app logic remains fail-closed defense-in-depth, not the only guardrail

Verification:
- code comments and tests make this layering explicit

---

## Phase 4 — Test matrix closure

### Task 4.1: Extend governance tests for missing lifecycle cases
Objective: match the verification matrix in Spec 1 more closely.

Files:
- Modify: `tests/publication-governance-lane-a.test.ts`
- Reference: `docs/publication-governance-spec-1.md`

Must cover:
- `draft` not public
- `review_required` not public
- `approved` not public pre-publish
- `published` row visible only through active snapshot
- stale exclusion
n- invalidated exclusion
- retired exclusion
- `store_call` non-public rule
- newer unapproved row does not shadow published row

Verification:
- `pnpm test` passes with stronger publication regression coverage

### Task 4.2: Add identity-separation and rollback/audit tests
Objective: make the new governance constraints executable.

Files:
- Modify existing or create new focused tests:
  - `tests/publication-governance-lane-a.test.ts`
  - optional new file `tests/publication-governance-lane-b.test.ts`

Must cover:
- collector and approver cannot be the same identity for normal published rows
- rollback removes public visibility
- rollback preserves audit records
- invalidated rows remain non-public after refresh/re-read

Verification:
- tests fail before implementation and pass after the migration + code alignment

### Task 4.3: Keep seed contract aligned
Objective: prevent the seeded governed `30328` fixture from drifting away from the stronger schema.

Files:
- Modify if needed: `supabase/seed.sql`
- Modify if needed: `tests/governance-seed-30328-contract.test.ts`

Verification:
- seeded snapshot remains valid under stronger constraints
- hosted proof fixture is not broken by the governance parity upgrade

---

## Phase 5 — Release-health and docs alignment

### Task 5.1: Upgrade release blockers from narrative to governance checks
Objective: make release readiness reflect automated-publication reality.

Files:
- Modify: `docs/release-readiness-checklist.md`
- Modify: `docs/accepted-risks.md`
- Modify: `docs/product-harness-status.md`

Add hard blockers for:
- schema/view parity with Spec 1
- immutable audit log availability
- identity separation enforcement
- rollback/takedown readiness
- hosted observed proof status

Verification:
- docs no longer overstate readiness for full automation
- docs clearly distinguish current milestone proof from automated-publication proof

### Task 5.2: Reframe roadmap slices
Objective: reorder the roadmap around the new product direction.

Files:
- Modify: `docs/roadmap-slices.md`

New top order:
1. Governance Parity Closure
2. Publication Controller MVP
3. Legal/Ops Hard Gate Upgrade
4. Public Surface Reframe

Verification:
- roadmap and controller doc agree on execution order

---

## Final validation sequence

Run in this order:
1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`
4. `pnpm build`
5. targeted governed runtime proof if implementation touches hosted-proof assumptions

Expected outcome:
- local quality gates stay green
- strengthened governance tests prove publication semantics more canonically
- docs and code stop disagreeing about what is safe to automate

---

## Out of scope for this slice

- Stripe reactivation
- waitlist / weekly-updates conversion work
- broad homepage marketing polish
- geography expansion
- zero-human full autonomous publication
- final admin UX polish beyond what is needed to support the governance contract

---

## Recommended harness execution split

Parallel lanes:
1. schema + constraints lane
2. public view + repository alignment lane
3. audit log + rollback semantics lane
4. tests + seed contract lane

Controller reconciliation after all lanes:
- re-read migration
- re-read tests
- rerun `pnpm test` and `pnpm build`
- update readiness docs only after proof is green
