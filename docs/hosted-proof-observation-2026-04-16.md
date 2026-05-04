# Hosted Proof Observation

Recorded: 2026-04-16

## Objective

Attempt to observe one real GitHub-hosted proof run for `SunwooPark-dev/inMyPocket` and determine whether the repo can close the hosted-proof blocker.

## Evidence Gathered

- Local `HEAD`: `08906747d29dffde555322b17bf4fe2e3d7d4ba7`
- Local branch: `main`
- Local remote: `https://github.com/SunwooPark-dev/inMyPocket.git`
- Remote default-branch workflow file observed through the GitHub connector:
  - repository: `SunwooPark-dev/inMyPocket`
  - path: `.github/workflows/ci.yml`
  - ref: `main`
  - blob sha: `5735355239c0562c9120f89bc7f04d4e9cea643a`

## Observation Result

Result: `blocked`

Reasoning:

- The GitHub connector did not return any workflow runs, commit statuses, PRs, or commits for local `HEAD`.
- The remote `main` workflow file currently exposed by GitHub does not match the local canonical CI lane.
- Remote `main` shows a simple `InMyPocket CI` workflow with `npm install` and `npm run build`.
- Remote `main` does not expose the locally documented hosted proof lane:
  - `ops:evidence`
  - `visual:check`
  - `ops:attest-hosted`
  - `ops:verify`
  - artifact upload for the hosted `.ops-evidence` bundle

## Hosted-Proof Conclusion

Hosted proof cannot currently be closed from observed GitHub evidence because the remote default-branch workflow visible through GitHub does not yet match the local hosted-proof contract.

This is stronger than the earlier blocker of “no run link yet.” The current blocker is:

- no observed hosted run for local `HEAD`
- and the observable remote workflow definition is not the same workflow that local docs expect to run

## Required Next Input

At least one of the following is needed before hosted proof can move past `local-simulated`:

1. push the current local workflow definition to the observed GitHub repo/branch and trigger Actions
2. provide the exact branch / PR / workflow run where the hosted `ops-evidence-gate` actually exists
3. provide an artifact link proving the hosted `.ops-evidence` bundle from the canonical lane

## Verification Backstop

This observation was checked against:

- local `.github/workflows/ci.yml`
- remote `.github/workflows/ci.yml` fetched from GitHub
- `.ops-evidence/release-health.json`
- `.ops-evidence/operator-proof.json`
- `.ops-evidence/external-proof-handoff.json`
