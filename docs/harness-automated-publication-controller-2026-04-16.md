# Harness Automated Publication Controller — 2026-04-16

## Executive verdict

Status: 조건부 On-track, but no-go for true end-to-end fully automated publication today.

Three-pass conclusion:

1. First pass: the repo looked closer to a senior-friendly grocery comparison MVP with strong ops proof than to a publication engine.
2. Second pass: parallel audit lanes agreed the real differentiated asset is not the public UX or payment lane, but the governed publication contract now forming around snapshots, freshness, provenance, and trust-boundary proof.
3. Third pass: direct repo verification confirmed the current system is privacy-safe and materially improved by Governance Kernel 1, but still not approval-safe enough to claim autonomous publication without a human approval lane, immutable audit log, and stricter schema parity.

Net result:
- project direction can pivot successfully
- current repo baseline is usable as the seed of a governed publication engine
- the next safe execution slice is governance/schema/controller hardening, not more public UX polish and not payment
- the safest near-term target is not "zero-human publication"
- the safest near-term target is "human-approved, machine-executed ZIP snapshot publication"

## Evidence base used for this controller

Primary repo artifacts rechecked directly:
- `README.md`
- `docs/product-harness-status.md`
- `docs/publication-governance-spec-1.md`
- `docs/implementation-ready-gap-assessment.md`
- `docs/governance-runtime-apply-controller-2026-04-16.md`
- `docs/roadmap-slices.md`
- `docs/release-readiness-checklist.md`
- `docs/accepted-risks.md`
- `supabase/migrations/202604130001_inmypoket_foundations.sql`
- `src/lib/observation-feed.ts`
- `src/lib/observation-repository.ts`
- `package.json`

Parallel harness lanes executed:
- business/product-definition lane
- data architecture / automation lane
- ops/legal/reliability lane

## Repo-grounded findings

### 1. The current repo still describes a consumer MVP, not an automated publication system
Evidence:
- `README.md` still frames `inMyPoket` as a mobile-first senior-friendly grocery basket comparison MVP.
- `docs/product-harness-status.md` still treats the active milestone as public UX + operations proof, with payment deferred.
- `docs/roadmap-slices.md` is still centered on waitlist maintenance, operator evidence, release readiness, payment proof, and post-payment UX polish.

Controller interpretation:
- the current product shell is useful as a downstream presentation layer
- it should no longer be treated as the primary strategic surface if the direction is fully automated publication

### 2. The strongest reusable asset is the governed publication contract
Evidence:
- `docs/publication-governance-spec-1.md` freezes the lifecycle, ZIP snapshot publication rule, freshness TTL, rollback/takedown minimums, audit requirements, and public-view contract.
- `docs/governance-runtime-apply-controller-2026-04-16.md` proves the hosted `30328` governed slice, runtime empty-state closure, and governed populated branch.
- `src/lib/observation-feed.ts` already fail-closes public eligibility on review status, approval metadata, published snapshot link, active snapshot, freshness, retirement/invalidation, and `store_call` exclusion.

Controller interpretation:
- the moat is becoming governed publication integrity, not merely basket comparison UI

### 3. The repo has progressed beyond the original mirror-view risk, but approval-safe automation is still incomplete
Evidence:
- original foundations migration `supabase/migrations/202604130001_inmypoket_foundations.sql` shows the old public view as a sanitized mirror of `price_observations`.
- app code in `src/lib/observation-feed.ts` now assumes richer governance semantics.
- `docs/publication-governance-spec-1.md` Section 11.2 still requires logical fields not yet fully encoded as a canonical implementation contract:
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
- `docs/publication-governance-spec-1.md` Section 13 requires immutable audit events.
- `docs/publication-governance-spec-1.md` Section 14 says `published_price_observations` must be a governed publication surface, not a sanitized base-table mirror.

Controller interpretation:
- current state is improved enough for governed proof of one slice
- current state is not yet sufficient for a controller-grade claim of full autonomous publication

### 4. Ops/readiness proof is milestone-appropriate, not launch-grade for automated publication
Evidence:
- `docs/release-readiness-checklist.md` still says a real GitHub-hosted run/artifact has not yet been observed for this workspace.
- `docs/accepted-risks.md` still accepts MVP-grade operational shortcuts and non-payment posture.
- `package.json` proves local verification exists (`typecheck`, `lint`, `test`, `build`, smoke/evidence lanes), but not a full automated publication controller path.

Controller interpretation:
- current readiness proof is strong enough for the current MVP milestone
- it is not yet strong enough to serve as the release contract for a fully automated publication product

## Final integrated product definition

Recommended product definition:

`inMyPoket` should become a governed grocery-price publication engine that converts collected public-web observations into approval-safe, ZIP-snapshot-based published outputs with explicit freshness, rollback, takedown, and auditability.

Primary users:
- internal operator / reviewer
- downstream publication surfaces (`/`, `/printable`, future JSON/API/feed)

Primary release unit:
- one ZIP snapshot

Primary promise:
- trustworthy publication integrity
- not broad consumer feature depth

## What to de-emphasize immediately

1. weekly-updates / waitlist as the strategic center
2. founding-member / Stripe lane as a near-term priority
3. further public UX polish unrelated to publication trust or operator usability
4. broader geography/store expansion before governance parity is complete

These can remain in the repo, but they should stop driving execution order.

## Three-round feedback synthesis

### Feedback round 1 — business/product lens
Cold feedback:
- the project is not under-positioned on UX; it is over-positioned on the wrong value proposition for the new direction
- the consumer shell is ahead of the publication engine definition
- the pivot should narrow the product, not broaden it

Reflection applied:
- recommend the product pivot away from "shopping helper with governance behind it"
- toward "governed publication engine with shopping surfaces on top"

### Feedback round 2 — architecture/data lens
Cold feedback:
- too much of the publication contract still lives in docs and app logic
- not enough is frozen in canonical schema, transition rules, audit tables, and controller-run artifacts
- a true autonomous pipeline would currently rely too much on operator memory and scattered rules

Reflection applied:
- recommend a smallest safe architecture:
  - one system of record in Supabase/Postgres
  - one governed publication surface
  - one scheduled publication controller job
  - one immutable audit/event log
  - one manual review/incident lane

### Feedback round 3 — ops/legal/reliability lens
Cold feedback:
- no-go today for fully automated publication
- biggest blockers are approval-safe storage parity, immutable auditability, same-day takedown readiness, and hosted observed proof
- app-level fail-closed logic is good but not enough if release policy cannot prove governance at the storage/controller layer

Reflection applied:
- set the immediate execution target to human-approved, machine-executed publication
- make zero-human publication explicitly out of scope for the next slice

## Controller-grade target architecture

### Target for the next safe phase
Not target:
- zero-human autonomous publication

Safe target:
- human-approved, machine-executed ZIP snapshot publication

### Smallest safe architecture
1. `price_observations` remains private source-of-record storage
2. `price_publication_snapshots` becomes the atomic publication unit
3. `published_price_observations` becomes a governed public projection only
4. add immutable `publication_audit_events`
5. add one scheduled publication controller job
6. keep a manual review / takedown / override lane

## Immediate execution order

### Slice A — Governance Parity Closure
Goal:
- make storage/view/controller semantics match Spec 1

Required outputs:
- schema migration for missing governance fields
- immutable audit log schema
- public-view redesign anchored to active published ZIP snapshot only
- transition constraints for lifecycle states
- collector/approver separation enforcement

Why first:
- this is the highest-risk mismatch
- all later automation depends on it

### Slice B — Publication Controller MVP
Goal:
- automate the publish decision only for already-approved data

Required outputs:
- one controller job that assembles candidate ZIP snapshots
- coverage/freshness/comparability/source checks
- atomic snapshot activation/deactivation
- stale-coverage monitor
- rollback / unpublish trigger path
- controller-run artifact or manifest per publish cycle

Why second:
- this is the actual "automation" layer, but it is unsafe before Slice A

### Slice C — Legal/Ops Hard Gate Upgrade
Goal:
- turn publication governance from advisory docs into release blockers

Required outputs:
- retailer/domain allowlist versioning
- prohibited input taxonomy
- evidence retention policy
- same-day takedown checklist and proof path
- release-health hard blockers for audit/freshness/coverage/hosted proof

Why third:
- once automation exists, legal and release controls must become hard blockers rather than narrative safeguards

### Slice D — Public Surface Reframe
Goal:
- make the web surface reflect the new product identity

Required outputs:
- homepage reframed around latest published snapshot, coverage, freshness, and provenance
- `/printable` remains a downstream output, not the core identity
- optional machine-readable publication output (`JSON/API/feed`)

Why fourth:
- public reframe is valuable, but it is downstream of the publication engine itself

## Implementation-ready next slice

Recommended immediate next slice to execute now:

`Governance Parity Closure 1`

Scope:
1. complete Spec 1 governance field parity in schema
2. add immutable publication audit events
3. redesign governed public view contract around active ZIP snapshots
4. add tests for:
   - `draft` not public
   - `review_required` not public
   - `approved` not public before publish
   - `published` row public only through active snapshot
   - stale exclusion
   - invalidated exclusion
   - retired exclusion
   - identity separation enforcement
   - rollback removes public visibility while preserving auditability

Definition of done:
- public visibility can no longer depend primarily on app-layer filtering
- controller/read-path and DB/view semantics agree
- release-health can reason over canonical governed data instead of inferred app behavior

## Go / no-go statement

### No-go now for
- zero-human full automated publication
- broad public relaunch around an automation claim
- payment reactivation as a primary milestone

### Go now for
- pivoting the roadmap and implementation plan around governed publication
- building a human-approved, machine-executed publication controller
- reducing the consumer MVP shell to a downstream presentation layer

## Remaining ambiguities to resolve before wider rollout

1. Which governance fields already exist in the latest local migration line versus only in docs/app assumptions?
2. What exact table/view/trigger design should carry immutable audit events and lifecycle transitions?
3. Should the publication controller live as a Supabase Edge Function, GitHub Action, or Node cron lane first?
4. Which rule tables must be data-backed now versus kept in code for the pilot (`store roster`, `source allowlist`, `matching/comparability`)?
5. What is the narrowest operator/admin surface needed for review, publish, rollback, and takedown without overbuilding UX?

## Recommended next operator command for execution prep

If moving immediately into implementation planning, the next work should produce a plan doc and then execute Slice A with subagents.

Suggested execution prompt:

`Governance Parity Closure 1을 implementation-ready plan으로 쪼개고, 하네스 엔지니어링으로 schema/view/audit/tests 4개 레인에 병렬 배정한 뒤 통합 실행해.`
