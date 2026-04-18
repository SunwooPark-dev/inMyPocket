# Codex Adoption Plan

Last refreshed: 2026-04-16

## Objective

Adopt only the Codex capabilities that are already available in our current tool surface and that materially improve repo execution quality, operator handoff, or recurring readiness work.

## Scope

In scope for the first wave:

- recurring automation playbooks for repo operations
- repo-specific memory hygiene guidance
- one operator bootstrap runbook that routes people into the correct lane

In scope for a later wave:

- GitHub review workflow adoption

Out of scope for this plan:

- background computer use rollout
- in-app browser standardization
- SSH/devbox rollout
- broad plugin expansion

## Constraints

- No repo instructions should depend on app-only features that are not consistently available in the current operator environment.
- Adoption work should improve reproducibility, not just personal convenience.
- Keep the first wave documentation-first unless a small implementation change is clearly required.
- Prefer the repo's real operating bottlenecks over merely available Codex product features.

## Definition Of Done

- repo docs state the supported Codex boundary clearly
- at least one recurring automation use case is standardized with a concrete operator contract
- memory usage rules are explicit enough that future operators do not invent incompatible patterns
- a bootstrap runbook routes operators from real triggers to the correct Codex lane
- GitHub review workflow remains clearly scoped as a later-wave lane rather than an implied default requirement today

## Work Packets

## Packet 1: Automation Playbooks

- **Goal:** standardize a minimal approved set of recurring Codex automations
- **Candidate automations:**
  - release-readiness reminder that reopens the evidence/release checklist thread
  - ops-proof freshness follow-up that prompts a new `ops:evidence` / `ops:verify` pass when artifacts age
- **Outputs:**
  - one approved automation per use case
  - naming convention
  - prompt-writing rules for repeatable operator outputs
  - exact closeout rule and expected artifact
  - `docs/codex-automation-playbooks.md`

## Packet 2: Memory Hygiene

- **Goal:** define what durable context belongs in OMX memory versus repo docs versus ephemeral task notes
- **Outputs:**
  - rules for project-memory vs working-memory usage
  - examples of acceptable durable notes
  - anti-patterns for stale or user-specific clutter
  - prune/promote triggers tied to handoff and `pnpm ops:verify`
  - `docs/codex-memory-guidelines.md`

## Packet 3: Operator Bootstrap

- **Goal:** create one operator entrypoint that maps real triggers to the correct approved Codex lane
- **Outputs:**
  - trigger -> lane -> first doc -> verification/backstop table
  - blocked/fallback path
  - direct linkage from `README.md`, `docs/mvp-operations.md`, and active operator loop docs
  - `docs/codex-operator-bootstrap.md`

## Packet 4: GitHub Review Workflow

- **Goal:** make review-comment handling a documented lane once review volume or collaboration pressure justifies it
- **Inputs:** existing GitHub plugin/tooling, current review instructions in AGENTS guidance, observed PR-review demand
- **Outputs:**
  - short operator runbook for triaging and resolving GitHub review comments
  - verification checklist before replying or resolving a thread
  - clear fallback point for local test/build work
  - `docs/github-review-workflow.md`

## Merge Gate

Before calling the first wave complete:

- supported / partial / out-of-scope boundary remains consistent across README and ops docs
- new automation and memory docs do not assume unavailable desktop-app-only features
- each first-wave runbook names its verification step, closeout artifact, and fallback path
- active operator loop docs point to the bootstrap runbook when Codex usage is the recommended next action
- GitHub review remains documented as available tooling, not yet the primary repo bottleneck or default lane

## Recommended Order

1. Codex support boundary documentation
2. Automation playbooks
3. Memory hygiene guidance
4. Operator bootstrap runbook
5. GitHub review workflow if explicit demand appears

## Deferred Items

These should stay deferred until there is a concrete environment rollout and a repo need:

- computer-use-driven frontend/test workflows
- browser-comment-driven design iteration
- SSH-based remote devbox runbooks
- broad plugin onboarding beyond explicitly adopted tools
