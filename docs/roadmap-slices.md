# Roadmap Slices

## Summary

This roadmap breaks the next product work into independent slices that another engineer or agent can execute without rediscovering intent.

Ordering rule:

1. finish evidence-backed product lanes first
2. reopen deferred work only when its prerequisites are present
3. avoid mixing UI polish with payment or ops proof in the same implementation lane

## Slice 1: Non-Payment Waitlist Harness Maintenance

- **Goal:** keep the live weekly-updates path, smoke expectations, and operator docs aligned while Stripe remains deferred
- **Prerequisites:** none beyond the current non-payment runtime
- **Primary outputs:**
  - verification that `/api/waitlist` remains live when checkout is disabled
  - test harness coverage for weekly-updates lane behavior
  - smoke/readiness/risk/status docs that match the runtime truth
- **Do not combine with:** broad product redesign or Stripe-only implementation work

## Slice 2: Operator Evidence Bundle

- **Goal:** keep the existing policy/smoke proof operator-facing, reproducible, and in sync with the live non-payment lane
- **Prerequisites:** Slice 1 alignment complete enough that the documented smoke path matches runtime behavior
- **Primary outputs:**
  - reproducible Supabase proof steps
  - route-level access-control proof summary
  - one concise evidence document or checklist for operators
- **Do not combine with:** payment proof unless the operator artifact needs updated payment evidence

## Slice 3: Release Readiness Closure

- **Goal:** make handoff and continuation friction-free for the current non-payment milestone
- **Prerequisites:** accepted-risk ledger and roadmap slices must exist
- **Primary outputs:**
  - final release checklist clean-up
  - README/doc alignment
  - explicit deferred-items section
- **Do not combine with:** deep product redesign

## Slice 4: Stripe Proof

- **Goal:** prove checkout, webhook, and durable paid-state reconciliation
- **Prerequisites:**
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_ID_FOUNDING_MEMBER`
- **Primary outputs:**
  - checkout start evidence
  - webhook receipt evidence
  - signup state transition proof
  - duplicate/replay behavior notes
- **Do not combine with:** major public UI work

## Slice 5: Post-Payment Public UX Polish

- **Goal:** revisit the public purchase/update surface after real payment proof exists
- **Prerequisites:** Slice 1 complete
- **Primary outputs:**
  - decide whether weekly updates remain hidden, visible, or split from payment language
  - final public CTA wording aligned with real behavior
- **Do not combine with:** ops proof unless a new payment state changes trust messaging

## Slice 6: Production Hardening

- **Goal:** address accepted MVP risks once product exposure expands
- **Prerequisites:** launch-candidate confidence in core UX, ops, and payment
- **Primary outputs:**
  - stronger admin-abuse controls
  - more durable audit/evidence handling
  - clearer operator incident response flow
- **Do not combine with:** early pilot polish work

## Slice 7: Codex Support Boundary Documentation

- **Goal:** make the repo-scoped Codex feature boundary explicit so operators do not confuse app-level marketing capabilities with required repo setup
- **Prerequisites:** current README and MVP operations docs must reflect the active Codex baseline
- **Primary outputs:**
  - supported / partial / out-of-scope Codex capability matrix
  - operator-facing link targets from README and runbooks
  - explicit notes about which capabilities are environment- or app-plan-dependent
- **Do not combine with:** broad product feature work

## Slice 8: Automation and Memory Workflow Adoption

- **Goal:** standardize the subset of Codex automations and memory that materially helps this repo's recurring ops/readiness work
- **Prerequisites:** support boundary docs complete and at least one recurring operator task chosen
- **Primary outputs:**
  - one or two approved recurring automation playbooks for evidence/readiness follow-up
  - working agreement for what belongs in automation prompts vs repo docs vs OMX memory
  - memory hygiene rules for durable operator preferences and handoff context
- **Do not combine with:** speculative plugin sprawl or full personal-productivity workflows

## Slice 9: GitHub Review Workflow Adoption

- **Goal:** formalize the already-available GitHub review-comment workflow only after observed PR-review volume or explicit external collaboration makes it worth standardizing
- **Prerequisites:** support boundary docs complete and first-wave automation/memory docs are stable enough that the repo's recurring ops path is already covered
- **Primary outputs:**
  - documented PR review triage workflow using the existing GitHub plugin/tooling
  - review-resolution checklist for local verification before reply/resolve
  - operator notes for when to stay in-app vs when to fall back to local git/test commands
- **Do not combine with:** SSH/devbox or browser automation rollout
