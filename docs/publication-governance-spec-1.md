# Publication Governance Spec 1

Status: Canonical spec for the next implementation slice
Last refreshed: 2026-04-16
Scope: publication lifecycle, approval-safe eligibility, freshness, rollback, takedown, and audit minimums for public grocery-price publication

## 1. Purpose

This document freezes the publication-governance contract that future schema, views, admin workflows, and verification must implement.

It exists because the current project already has:
- a public/private boundary via `published_price_observations` vs `price_observations`
- operator save flow and private evidence storage
- a documented publish gate

But it does not yet have a canonical approval-safe lifecycle encoded in schema/view form.

Source inputs for this spec:
- `/mnt/c/Users/sunwo/workspace/inMyPoket/docs/implementation-controller-next-slice-2026-04-15.md`
- `/mnt/c/Users/sunwo/workspace/inMyPoket/docs/harness-integrated-upgrade-2026-04-15.md`
- `/mnt/c/Users/sunwo/workspace/inMyPoket/docs/implementation-ready-gap-assessment.md`
- `/mnt/c/Users/sunwo/workspace/inMyPoket/docs/mvp-operations.md`
- `/mnt/c/Users/sunwo/workspace/inMyPoket/supabase/migrations/202604130001_inmypoket_foundations.sql`
- `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/domain.ts`
- `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/observation-repository.ts`
- `/mnt/c/Users/sunwo/workspace/inMyPoket/src/lib/observation-feed.ts`

## 2. Slice note

This slice is spec-first.

It does not require that the full database migration, admin UI migration, or public-view migration already exist.
It does require that all future schema/view work anchor to this document and not redefine the lifecycle semantics ad hoc.

Until schema/view work catches up, the current implementation remains privacy-safe but not approval-safe.
That gap is the reason this spec exists.

## 3. Normative language

The words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY are normative.

## 4. Governing principles

1. Public safety beats freshness.
   A slightly older approved row is safer than a newer unapproved row.

2. Approval is explicit, not inferred.
   No row becomes public merely because it exists in `price_observations`.

3. Publication is snapshot-based, not row-by-row best effort.
   Public output is published per ZIP snapshot, not by leaking whichever rows happen to be newest.

4. Freshness is numeric, not operator-memory-based.

5. Retraction must be fast and auditable.

6. Collector and approver roles must be separable.
   The project already calls for a 4-eyes rule; this spec makes that rule part of the canonical contract.

## 5. Core entities

For this spec, the following logical entities are canonical even if the current schema does not yet represent all of them directly.

1. Observation
   One collected price record for one canonical product, one store, one ZIP, one channel, and one price type.

2. Snapshot
   The atomic publication unit for one ZIP code and one publish run.
   A snapshot contains the set of observations intended to back the public basket and item comparison for that ZIP.

3. Audit event
   An immutable record of a governance action such as review request, approval, publish, retire, invalidate, rollback, or takedown.

## 6. Canonical lifecycle states

The observation lifecycle is frozen as exactly these six states:
- `draft`
- `review_required`
- `approved`
- `published`
- `retired`
- `invalidated`

These names are canonical. Future schema may add helper fields, but it MUST NOT replace these state meanings with alternative semantics.

### 6.1 State meanings

`draft`
- Newly created or edited
- Not yet eligible for public output
- May be incomplete or unreviewed

`review_required`
- Collected and materially complete enough for human review
- Waiting for explicit approval decision
- Not public

`approved`
- Passed review and is eligible to be included in a future publish snapshot
- Still not public until an explicit publish action binds it to a snapshot

`published`
- Included in the currently active published snapshot for its ZIP
- Publicly visible if no exclusion rule applies

`retired`
- Previously approved or published, but no longer the active public choice because it was superseded, expired, or intentionally removed without being false
- Not public

`invalidated`
- Must not be used for public output because it is wrong, unsupported, non-compliant, or under challenge
- Terminal exclusion state
- Not public

### 6.2 Allowed transitions

Allowed forward transitions are:
- `draft -> review_required`
- `draft -> invalidated`
- `review_required -> draft`
- `review_required -> approved`
- `review_required -> invalidated`
- `approved -> published`
- `approved -> retired`
- `approved -> invalidated`
- `published -> retired`
- `published -> invalidated`

Disallowed transitions:
- Any direct `draft -> published`
- Any direct `review_required -> published`
- Any `retired -> published`
- Any `invalidated -> published`
- Any transition out of `invalidated` except explicit data repair by creating a new observation or replacement row

### 6.3 State invariants

1. A row in `published` MUST have a prior approval record.
2. A row in `published` MUST belong to a published ZIP snapshot.
3. A row in `retired` MUST carry a retirement reason.
4. A row in `invalidated` MUST carry an invalidation reason.
5. A row MUST NOT be both current-public and invalidated.
6. A newer row in `draft` or `review_required` MUST NOT suppress an older row already in `published`.

## 7. Approval-safe publication rule

A row is public-eligible only if all of the following are true:

1. Lifecycle state is `published`.
2. The row belongs to the active published snapshot for its ZIP.
3. The row has valid approval metadata.
4. The row is within freshness TTL at publish time and at read time.
5. The row still satisfies source and comparability rules.
6. The row is not retired.
7. The row is not invalidated.
8. The row is not excluded by snapshot-level coverage or incident rules.

Therefore the future `published_price_observations` implementation MUST expose only rows that satisfy the full eligibility rule above.
It MUST NOT expose all rows from `price_observations` by default.

## 8. ZIP snapshot publication contract

### 8.1 Publication unit

Publication MUST occur at ZIP-snapshot granularity.
A publish operation activates one named snapshot for one ZIP code.

### 8.2 Atomicity

Within a ZIP:
- the active snapshot changes atomically
- public reads MUST resolve to one active snapshot, not a mixed set of rows from multiple publish runs

### 8.3 Coverage gate

A ZIP snapshot is publishable only if coverage is at least 80% for the intended anchor basket, matching the existing MVP operations gate.
If coverage is below 80%, the snapshot MUST NOT become the active public snapshot.

### 8.4 Supersession rule

When a newer ZIP snapshot is published:
- rows carried forward into the new snapshot become `published`
- rows previously public but not carried forward become `retired`, unless they are invalidated instead
- supersession MUST be auditable at row level and snapshot level

## 9. Freshness and stale exclusion rules

The current docs say “timestamp is not stale” but do not define stale numerically. This spec freezes the numeric default.

### 9.1 Row TTL

A row is stale when `now - collected_at` exceeds the TTL for its observation class.

Canonical TTLs for this slice:
- `weekly_ad` channel or `weekly_ad` price type: 12 hours
- `product_page`, `pickup`, or `delivery` channels with non-`weekly_ad` price types: 24 hours
- `store_call` channel: not publish-eligible in this slice

### 9.2 Store-call rule

`store_call` observations MAY exist privately for operator context, but MUST NOT be publicly published in this slice because the current public-source policy requires a valid public `https://` retailer URL and reproducible public provenance.

### 9.3 Read-time stale exclusion

Even after a snapshot is published, a row that ages past TTL MUST be excluded from public output.
A stale row MUST NOT remain publicly visible merely because it was once approved.

### 9.4 Snapshot stale behavior

If stale exclusion causes the active ZIP snapshot to fall below 80% coverage, the ZIP snapshot is no longer public-safe.
In that case the system MUST do one of the following:
- unpublish the ZIP snapshot the same day, or
- replace it with a newer approved snapshot the same day

This rule is intentionally conservative because trust and legal defensibility are higher priority than continuity of display.

## 10. Source and comparability eligibility rules

A row is approval-safe only if all of the following are true:

1. `source_url` exists.
2. `source_url` is `https://`.
3. `source_url` is on the official public retailer domain allowlist.
4. The row is not sourced from a login-gated page, coupon-clipping flow, hidden endpoint, or personal-account page.
5. `store_id`, `zip_code`, `channel`, `price_type`, and `comparability_grade` are present.
6. `comparability_grade` is one of the canonical domain values.
7. Weekly ad values are separated from the base total and are not mixed into the base total.
8. Normalization to the canonical basket unit succeeds.

Additional publication restriction for this slice:
- `comparability_grade = non-comparable` MUST NOT be included in public totals
- `comparability_grade = partial` MAY appear in item-level detail only if the product UI explicitly treats it as non-totaling support evidence
- only rows classified as total-safe by the future matching-rule table may contribute to the default public basket total

This spec intentionally leaves the item-by-item rule table to the separate canonical matching spec, but the publication layer MUST already respect the distinction between total-safe and detail-only rows.

## 11. Minimum field contract

This section defines the required logical contract for approval-safe publication.
Field names may map to future schema with equivalent names, but the semantics below are canonical.

### 11.1 Existing base observation fields that remain required

The current observation contract already requires these fields and future governance work MUST preserve them:
- `id`
- `canonical_product_id`
- `retailer_id`
- `store_id`
- `zip_code`
- `channel`
- `price_type`
- `price_amount`
- `measurement_value`
- `measurement_unit`
- `pack_label`
- `comparability_grade`
- `source_url`
- `source_label`
- `collected_at`
- `confidence`
- `evidence_id` may remain nullable at storage level, but approval-safe publication SHOULD require linked evidence or an equivalent retained provenance artifact

### 11.2 Required governance fields

Future schema/view work MUST introduce or map the following logical fields:
- `review_status`
- `collected_by`
- `review_requested_at`
- `review_requested_by`
- `approved_at`
- `approved_by`
- `published_at`
- `published_snapshot_id`
- `retired_at`
- `retired_by`
- `retired_reason`
- `invalidated_at`
- `invalidated_by`
- `invalidated_reason`
- `supersedes_observation_id`
- `replaced_by_observation_id`
- `governance_notes`

### 11.3 Required field population by state

`draft`
- base observation fields required
- `review_status = draft`

`review_required`
- base observation fields required
- `review_status = review_required`
- `review_requested_at` required
- `review_requested_by` required
- `collected_by` required

`approved`
- all `review_required` requirements
- `approved_at` required
- `approved_by` required
- collector and approver MUST be distinct identities

`published`
- all `approved` requirements
- `published_at` required
- `published_snapshot_id` required

`retired`
- retirement timestamp, actor, and reason required

`invalidated`
- invalidation timestamp, actor, and reason required

### 11.4 Identity separation rule

The same identity MUST NOT be both `collected_by` and `approved_by` for the same row in normal operation.
If a true emergency exception is ever allowed later, it MUST be explicitly tagged as an emergency override audit event and MUST NOT become the default path.

## 12. Rollback, takedown, and incident minimums

### 12.1 Rollback trigger minimums

Rollback or unpublish MUST be available when any of the following occurs:
- incorrect public price
- wrong store or ZIP binding
- unsupported source provenance
- stale snapshot crossing TTL/coverage threshold
- challenge or takedown request under review
- evidence loss that breaks provenance support
- publication of a row that never had valid approval

### 12.2 Same-day takedown rule

A challenged public row or ZIP snapshot MUST be removable from public output the same calendar day the challenge is accepted as credible by an operator.
Pending factual resolution, removal is preferred over leaving contested data public.

### 12.3 Minimum rollback behavior

Rollback MUST:
- remove the affected row or snapshot from public output
- preserve private audit history
- preserve prior approved evidence links unless legal deletion is separately required
- record who triggered the rollback, when, and why
- identify whether the rollback scope was row-level or ZIP-snapshot-level

### 12.4 Republish rule

A rolled-back or invalidated row MUST NOT be silently restored.
Republish requires a new explicit approval and publish event.

## 13. Audit log minimum contract

The system MUST have an immutable audit record for at least these actions:
- observation created
- review requested
- review returned to draft
- approved
- published
- retired
- invalidated
- rollback executed
- takedown received
- takedown resolved
- snapshot activated
- snapshot deactivated

Minimum audit fields:
- `audit_event_id`
- `event_type`
- `occurred_at`
- `actor_id`
- `observation_id` nullable only for snapshot-wide events
- `snapshot_id` nullable only for row-only events
- `zip_code`
- `from_state` nullable for creation
- `to_state` nullable for non-state events
- `reason_code`
- `reason_detail`
- `evidence_reference` if relevant
- `request_reference` for external challenge/takedown if relevant

Audit records MUST survive retirement, invalidation, rollback, and public-view refresh.

## 14. Public view contract

Future schema/view work MUST treat `published_price_observations` as a governed publication surface, not as a sanitized mirror of the base table.

The canonical public-view contract is:
- rows exposed are only those in the active ZIP snapshot
- rows exposed are only those with `review_status = published`
- stale rows are excluded at read time
- invalidated rows are excluded immediately
- retired rows are excluded
- unapproved newer rows never shadow approved public rows
- snapshot coverage and separation rules remain enforced

If implementation chooses a materialized view, ordinary view, or table-backed publish manifest, that is an implementation detail.
The semantic contract above is not optional.

## 15. Verification matrix

At minimum, future tests or smoke proof MUST verify:

1. `draft` row is not public
2. `review_required` row is not public
3. `approved` row is not public before publish
4. `published` row is public only when bound to the active snapshot
5. newer unapproved row does not replace older published row
6. stale row is excluded
7. invalidated row is excluded immediately
8. retired row is excluded
9. ZIP snapshot below 80% coverage is not published
10. weekly ad rows do not contaminate base totals
11. `store_call` row is not public in this slice
12. rollback removes public visibility but preserves auditability
13. takedown path can unpublish same day
14. collector and approver identity separation is enforced

## 16. Non-goals for this slice

This spec does not yet freeze:
- the full per-item exact/near-match/partial/reject rule table for all 20 anchor items
- the full store-roster governance model
- final admin UX details
- final table, view, or trigger names beyond the logical contract above

Those follow-on artifacts MUST align to this spec rather than revising it silently.

## 17. Implementation anchoring guidance

Future schema/view work should anchor to this document as follows:

1. Schema migration work
   Add lifecycle and audit-support fields that map one-to-one to Section 11 and Section 13.

2. Public-view redesign
   Rebuild `published_price_observations` so it resolves only active approved published snapshot rows and enforces stale exclusion.

3. Admin workflow work
   Model actions and permissions around the allowed transitions in Section 6 rather than around free-form save/edit behavior.

4. Release-health and smoke work
   Add explicit governance checks for lifecycle state, snapshot activeness, stale exclusion, rollback proof, and same-day takedown capability.

5. Matching-spec work
   Treat this document as the publication gate contract and plug item-level comparability rules into it, not around it.

## 18. Frozen decisions in Spec 1

This spec intentionally freezes these decisions now:
- lifecycle states are `draft`, `review_required`, `approved`, `published`, `retired`, `invalidated`
- publication is ZIP-snapshot-based and atomic
- public output requires explicit approval and explicit publish
- newer unapproved data must not shadow older approved public data
- stale behavior is numeric: 12h for weekly ad, 24h for other public web observations, and `store_call` is non-public in this slice
- same-day takedown and auditable rollback are minimum operational requirements
- this slice is spec-first and not yet the full schema migration
