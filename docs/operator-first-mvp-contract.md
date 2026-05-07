# Operator-First MVP Contract

Status: Canonical project-facing contract for the next local operator lane
Last refreshed: 2026-04-23
Scope: freeze the operator-first MVP boundary before additional product or polish work

## 1. Why this doc exists

This repo already has meaningful product, ops, and publication-governance material.
What it still needs is one short contract that tells the next implementation lane what to optimize for.

This document freezes that answer:
- optimize for operator repeatability and trust first
- do not optimize for payment, growth, or consumer polish first
- treat public publication as a governed outcome of a private operator workflow

Important reality check:
- the current repo still contains older or broader pilot artifacts, including Eugene-oriented data and retailer records in `src/lib/catalog.ts`
- this document is therefore a forward-looking implementation contract, not a claim that every current code path already matches it
- if code, seeds, or UI disagree with this document, treat that as implementation delta to close in the next slices

## 2. Goal

The immediate goal is not a prettier consumer product.
The immediate goal is a tool the operator can trust and repeat locally:
- capture a price observation
- attach enough provenance to defend it
- normalize it into the anchor basket
- decide whether it is publishable
- publish, withhold, stale, or retract it without ambiguity

Success means the operator does not need direct database edits or private memory to keep the system safe.

## 3. Source of truth order

Read in this order when implementing against this contract:
1. `docs/operator-first-mvp-contract.md` — this document
2. `docs/publication-governance-spec-1.md` — publication lifecycle and stale/rollback contract
3. `docs/mvp-operations.md` — existing daily runbook and current source policy
4. `src/lib/catalog.ts` — current pilot/store/basket constants and drift to reconcile
5. `tests/publication-governance-lane-a.test.ts` and `tests/governance-seed-30328-contract.test.ts` — current governed-lane behavior already under test

## 4. Frozen pilot boundary

For the operator-first lane, freeze the target public pilot as:
- Geography: North Atlanta only
- ZIPs: `30328`, `30022`, `30076`
- Retailers: `kroger`, `aldi`, `walmart`
- Comparison basis: the current 20-item anchor basket

Out of scope for this lane:
- Eugene restoration or mixed-pilot UX
- retailer expansion beyond the three North Atlanta operators
- geography expansion beyond the three pilot ZIPs

## 5. Frozen operator loop

The operator loop is:
1. capture observation
2. attach source URL and collected timestamp
3. resolve store and ZIP
4. normalize to anchor-basket item
5. evaluate publish eligibility
6. publish or withhold
7. retract or mark stale when trust drops

This loop is the product.
Public UI is a downstream consequence of this loop, not the other way around.

## 6. Canonical publication states for this lane

The operator-facing lane should expose these practical states:
- `draft`
- `normalized`
- `review-ready`
- `published`
- `stale`
- `retracted`
- `needs-operator-decision`

Interpretation rules:
- `needs-operator-decision` is mandatory for ambiguous normalization, missing context, duplicate conflicts, or publish-gate failures that should not be silently coerced
- `published` means public-facing and currently trusted
- `stale` means previously publishable data that now fails freshness expectations
- `retracted` means intentionally removed from public output because trust, accuracy, or compliance broke

Implementation note:
- repo governance code already uses a lower-level lifecycle centered on `draft`, `review_required`, `approved`, `published`, `retired`, and `invalidated`
- when implementation bridges these two views, the operator-facing states above must map cleanly onto the stricter governed backend states rather than replacing them ad hoc

## 7. Minimum publish requirements

A record is not a public candidate unless all of the following are present:
- source URL
- collected timestamp
- store context
- ZIP context
- anchor-basket item mapping
- normalization result
- comparability grade
- evidence reference or equivalent retained provenance
- explicit operator review outcome

Additional rules:
- weekly-ad, member-only, coupon-required, and club-only values must remain explicit scenario values
- those scenario values must not be silently blended into the default base total
- incomplete coverage must present as incomplete, not as a fake full basket

## 8. Trust-boundary rules

1. Raw observations and evidence stay private.
2. Public comparison output reads from a governed published surface, not directly from the raw observation table.
3. Ambiguous normalization never auto-publishes.
4. Unsupported source provenance never auto-publishes.
5. Freshness failure removes eligibility even if a row was previously approved.
6. Duplicate conflicts remain review work until one row becomes the explicit winner.

In plain English: the system should prefer withholding data over bluffing certainty.

## 9. Operator-visible queues

The admin/operator surface must make these queues visible without requiring log tailing or DB inspection:
- unnormalized
- missing evidence
- duplicates
- stale soon
- stale now
- publication errors

If a problem matters enough to block or weaken publication, it must be visible as an operator queue.

## 10. Explicit non-goals

Do not treat these as primary work for this lane:
- payment proof or checkout expansion
- growth loops or acquisition experiments
- broader consumer polish beyond basic clarity
- pilot expansion beyond North Atlanta
- advanced analytics or personalization
- hosted-proof closure work that does not improve immediate local operator reliability

## 11. Acceptance bar

Call this lane successful only when all of the following are true:
- the operator can process an observation end-to-end without direct DB edits
- every published record can explain why it is public, when it was collected, and what evidence supports it
- ambiguous rows stay in review instead of getting silently forced into public output
- stale, duplicate, and missing-evidence cases are caught by local verification before they become public surprises

## 12. Immediate implementation consequences

This contract implies the next implementation work should focus on:
1. freezing operator-facing state names and their mapping to the governed backend lifecycle
2. freezing required observation fields and queue semantics
3. making stale and duplicate handling operator-visible
4. tightening the North Atlanta-only public lane even if legacy repo artifacts remain broader
5. adding local regression fixtures for normalization, publication, stale exclusion, and duplicate conflict handling

## 13. What this doc does not claim

This document does not claim that:
- the current live repo is already North-Atlanta-only everywhere
- the current seed/runtime fully matches the contract yet
- the existing admin UI already exposes all required queues

It only freezes what the next implementation slices must converge toward.
