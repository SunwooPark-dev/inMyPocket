# Codex Support Scope

Last refreshed: 2026-04-16

## Purpose

This document defines the Codex feature boundary that `inMyPoket` currently supports at the repo and operator-runbook level.

It exists to prevent a mismatch between:

- OpenAI's broader Codex app announcements
- what the current local tool surface can do in principle
- what this repo actually assumes, documents, and verifies in day-to-day work

Reference article:

- [Codex for (almost) everything](https://openai.com/index/codex-for-almost-everything/)

## Baseline

- Recommended Codex CLI baseline: `0.121.0` or newer
- Recommended primary model: `gpt-5.4`
- Recommended lighter helper model: `gpt-5.4-mini`
- ChatGPT-sign-in sessions should not be newly pinned to `gpt-5.2-codex`, `gpt-5.1-codex*`, `gpt-5.1`, or `gpt-5`
- If recommended models are missing, check client version first, then confirm account/plan/environment availability before assuming the repo is overriding local setup

## Supported Now

These capabilities are materially present in the current repo workflow and can be treated as supported operating paths.

- Codex-assisted code and documentation editing in the local workspace
- Parallel/subagent execution through the Codex native agent model plus OMX orchestration guidance
- The operator bootstrap flow in `docs/codex-operator-bootstrap.md`

## Partially Supported

These capabilities exist in the broader tool surface, but this repo does not yet fully standardize them as first-class operating lanes.

- Automations: available, but only the documented repo playbooks should be treated as approved recurring workflows
- Memory: available through OMX state/memory tools, but durable usage now depends on repo-specific hygiene rules rather than ad hoc notes
- GitHub review tooling: available through the installed GitHub plugin/tooling, but the repo-specific workflow remains a later-wave artifact until `docs/github-review-workflow.md` exists
- Image generation tooling: available in the current Codex tool surface, but not yet defined as a repo-specific operator lane
- Plugin-assisted workflows beyond GitHub and Stripe: technically possible in Codex broadly, but not standardized or documented here

## Not Yet In Scope

These capabilities should not be assumed to be part of the current repo setup.

- Background computer use with direct seeing/clicking/typing as a required operator workflow
- Codex in-app browser commenting workflow as a required frontend/dev loop
- Remote devbox over SSH as a documented standard operating path
- Broad plugin rollout as an assumed part of day-to-day repo work
- Multiple terminal tabs as a repo requirement rather than an app convenience

## Interpretation Rules

- If a capability is listed under `Supported Now`, operators may rely on it in repo guidance and follow-up docs.
- If a capability is listed under `Partially Supported`, use it carefully and document the exact local assumptions in the task or runbook.
- If a capability is listed under `Not Yet In Scope`, do not write repo instructions that depend on it unless this document and the relevant runbooks are updated first.

## Why Some Article Features Stay Out Of Scope

- Several features from the OpenAI article are app-level or plan-level capabilities rather than repo-configurable settings.
- Some are environment-specific, especially around desktop app behavior and OS availability.
- This repo benefits most from standardizing the features that improve reproducibility: evidence freshness follow-up, durable handoff context, and a single operator entrypoint.

## First-Wave Adoption Targets

The first realistic adoption targets are:

1. recurring automation playbooks for evidence/readiness follow-up
2. repo-specific memory hygiene rules for durable operator context
3. GitHub review workflow only after observed PR-review volume or explicit external-collaboration need

See `docs/codex-adoption-plan.md` and `docs/codex-operator-bootstrap.md`.
