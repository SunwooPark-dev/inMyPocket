# inMyPoket Harness Integrated Upgrade — 2026-04-15

> Purpose: fold three independent feedback passes (business, product/UX, implementation readiness) into one execution baseline for the next project slice.

## 0. Executive verdict

Project verdict: on-track as a trust-first pilot product, not yet on-track as a scalable business.

What is already real:
- senior-first grocery comparison positioning is clear
- North Atlanta pilot scope is tight enough to operate
- public/private data boundary and operator proof lane are stronger than a typical MVP
- summary-first public UX and printable helper flow exist

What is not yet real enough:
- repeatable demand proof
- visible non-payment signup path in the current environment
- scalable economics under manual verification
- implementation-ready policy/state-machine spec for publication quality, freshness, rollback, and legal defensibility

Bottom line:
- stop treating this as a general “more polish” problem
- treat it as a 3-front harness problem:
  1. demand harness
  2. trust/UI harness
  3. publication governance harness

## 1. Three-pass feedback synthesis

### Pass 1 — Business / market / monetization

Independent verdict:
- strong problem framing
- weak revenue proof
- current economics likely do not close if manual validation remains dominant

Hard truths:
- payment is deferred in this environment, so live willingness-to-pay is still unproven
- the weekly-updates/signup surface is hidden when checkout is unavailable, so public demand capture is weaker than it should be
- manual validation of anchor basket items is operationally expensive relative to a low-price consumer subscription

Implication:
- the next milestone should not optimize visual polish first
- it should optimize payer discovery, signup capture, and repeat-use evidence

### Pass 2 — Product / UX / positioning

Independent verdict:
- product direction is right
- information architecture still risks mixing user value with internal operations language

Hard truths:
- “Publish gate”, “Allowed and prohibited inputs”, and “Daily runbook” are trust-supporting artifacts, not first-screen product value
- the first screen must answer: where do I save today, how much, and what do I do next?
- the current environment removes dead-end payment CTA, but also removes an obvious public capture path

Implication:
- keep trust, but demote operations language below the answer
- separate user-facing value surfaces from methodology and ops surfaces
- restore a non-payment lead capture path that does not depend on Stripe

### Pass 3 — Implementation readiness / operations / legal

Independent verdict:
- operations proof is solid for an MVP
- implementation-ready publication governance is incomplete

Hard truths:
- “timestamp is not stale” exists, but stale is not numerically specified
- the published/public boundary exists, but observation lifecycle is not fully encoded as a state machine
- canonical item matching is partially defined but not frozen as a rule table
- rollback, takedown, retention, and approval audit policy need tighter formalization

Implication:
- the next engineering slice should not start with broad feature expansion
- it should freeze the publication rules and review lifecycle so every future scale-up inherits defensible behavior

## 2. Upgraded project thesis

inMyPoket is not just a grocery comparison app.

It is a trust-scoped decision service for older households and caregivers:
- answer one high-value question quickly
- avoid coupon complexity and hidden pricing games
- show only publicly supportable, comparable price evidence
- make the answer readable and printable

That thesis implies three design rules:
- answer first
- proof second
- operations third

## 3. Strategic changes to adopt now

### A. Product positioning

Primary promise:
- “See today’s cheapest grocery basket in text you can actually read.”

Secondary promise:
- “We compare publicly visible store prices and keep tricky pricing separated so the total stays fair.”

Payer expansion:
- do not position only to the senior shopper
- explicitly test caregiver / adult-child value messaging in parallel

### B. Demand capture

Do not wait for Stripe to reopen demand capture.

Add a non-payment capture lane:
- “Get weekly basket updates for your ZIP” email capture
- “Request your ZIP / store” interest capture
- caregiver-oriented capture variant

Reason:
- payment proof is currently blocked by env secrets
- demand proof should not be blocked by payment proof

### C. Information architecture

Enforce this landing-page order:
1. hero answer and promise
2. today’s basket result
3. item-level comparison summary
4. trust and methodology summary
5. lead capture / offer block

Move or demote:
- publish gate details
- prohibited input details
- daily runbook details

These belong in trust/methodology or operator docs, not the core acquisition path.

### D. Governance

Freeze these before feature sprawl:
- canonical item matching rule table
- publication state machine
- freshness TTL and stale behavior
- legal/takedown/retention/audit rules
- rollback triggers and operator ownership

## 4. Harness engineering execution model

All next work should run as independent lanes with explicit verification.

### Lane 1 — Demand harness
Owner question:
- will real users or caregivers repeatedly ask for this answer and leave a retrievable contact?

Deliverables:
- non-payment signup surface
- caregiver messaging variant
- weekly update capture flow
- metrics definition: visit -> signup -> revisit

Success criteria:
- public capture path exists without Stripe
- event schema exists for acquisition funnel
- at least one caregiver-targeted message variant exists in product copy or landing structure

### Lane 2 — Trust/UI harness
Owner question:
- can a first-time user understand the answer before seeing the methodology?

Deliverables:
- answer-first homepage hierarchy
- trust section rewritten in user language
- methodology/detail relegated below the main answer
- CTA stack simplified

Success criteria:
- first viewport communicates answer, location, and savings intent
- no operator-only terminology appears in the primary answer flow
- trust copy supports, but does not compete with, the answer

### Lane 3 — Publication governance harness
Owner question:
- can every public observation be defended, approved, and rolled back under a clear rule system?

Deliverables:
- item matching rule table
- observation lifecycle state machine
- freshness / conflict / coverage gate spec
- incident + rollback + audit policy
- legal retention and takedown policy

Success criteria:
- every observation has an explicit review/publication status path
- stale behavior is numerically defined
- publish eligibility is rule-based, not operator-memory-based
- rollback and takedown procedures exist as named steps

## 5. Prioritized next slice

Priority order for the next real project slice:

1. Restore non-payment lead capture
2. Freeze publication governance spec
3. Simplify homepage IA around the answer
4. Reopen Stripe proof only after the above are stable

Rationale:
- demand proof and governance proof unblock more decision-making than payment reactivation alone
- payment proof matters, but it is currently environment-blocked and should not freeze progress on user learning and operational defensibility

## 6. Concrete next actions

### Week 1
- define and ship a non-payment public signup path
- expose capture CTA even when Stripe is unavailable
- track funnel events for visit, CTA click, signup submit

### Week 2
- write canonical matching rule table for all 20 anchor basket items
- encode exact / near-match / partial / reject semantics
- pin examples and anti-examples per item

### Week 3
- define observation lifecycle:
  - draft
  - review_required
  - approved
  - published
  - retired
- map required fields and ownership transitions

### Week 4
- define freshness TTLs and publish gates by scenario
- define duplicate/conflict/outlier handling
- define atomic ZIP snapshot publish behavior

### Week 5
- rewrite trust copy and homepage hierarchy around answer-first UX
- move internal operations language into methodology pages or admin surfaces

### Week 6
- write legal/compliance pack:
  - allowed/prohibited input taxonomy
  - evidence retention window
  - takedown intake and same-day unpublish rule
  - audit log requirements

## 7. Do-not-do list

Do not spend the next slice on:
- broader geography expansion
- more stores before governance is frozen
- more visual polish without a corresponding demand or trust win
- coupon/membership complexity that weakens the “fair public price” thesis
- scaling manual operations without instrumentation and publication states

## 8. Smart default execution prompt for subagents

Use this as the next implementation controller brief:

“Work in harness engineering mode. Split the next slice into independent lanes for demand capture, trust/UI information architecture, and publication governance. Use fresh subagents per lane. For each lane, require: implementation output, spec-compliance review, and independent quality review. Do not merge results until each lane has explicit acceptance criteria and evidence.”

## 9. Cold final assessment

This project is stronger than a typical MVP in trust and ops discipline.
That is good.

But right now its biggest risk is not code quality.
Its biggest risk is that the team could confuse:
- polished pilot UX
with
- proven demand
and
- scalable operating economics.

The correct next move is not “build more.”
It is:
- capture demand without payment dependency
- freeze publication governance
- simplify answer-first UX
- then reopen revenue proof with fewer unknowns.
