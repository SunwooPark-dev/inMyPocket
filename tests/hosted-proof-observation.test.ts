import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { getExternalBlockers } from "../src/lib/external-blockers.ts";
import { getExternalProofHandoff } from "../src/lib/external-proof-handoff.ts";
import { getOperatorNextActions } from "../src/lib/operator-next-actions.ts";
import type { HostedProofObservation, ReleaseHealthSummary } from "../src/lib/ops-evidence.ts";

const REMOTE_WORKFLOW_FIXTURE = resolve(process.cwd(), "tests/fixtures/remote-main-ci.yml");

const LOCAL_SIMULATED_RELEASE_HEALTH: ReleaseHealthSummary = {
  verifiedAt: "2026-04-16T17:10:51.176Z",
  formattedVerifiedAt: "Apr 16, 2026, 5:10 PM",
  verdict: "green",
  proofLevel: "full",
  verificationScope: "local-simulated",
  proofLabel: "full (local-simulated)",
  freshnessStatus: "current",
  staleReasons: [],
  hostedObservationStatus: "local-simulation",
  visualRegressionStatus: "green",
  bundleName: "ops-evidence-20260416-085253",
  operationsProofStatus: "materially complete",
  paymentStatus: "not_planned",
  liveSupabaseProofStatus: "passed",
  errors: []
};

test("external hosted-proof helpers incorporate observation details", () => {
  const observation: HostedProofObservation = {
    recordedAt: "2026-04-16T17:10:51.176Z",
    repo: "SunwooPark-dev/inMyPocket",
    branch: "main",
    localHead: "08906747d29dffde555322b17bf4fe2e3d7d4ba7",
    result: "blocked",
    blockerType: "remote_workflow_mismatch",
    primaryBlocker: "remote workflow mismatch",
    secondaryBlocker: "no observed hosted run for local HEAD",
    summary:
      "No observed hosted run was found for local HEAD, and the remote default-branch workflow currently visible through GitHub does not match the local hosted proof lane.",
    localWorkflow: {
      path: ".github/workflows/ci.yml",
      sha: "77c1a6efbc86da0e43fe47a21cdcc09fddb03f2d",
      name: "CI"
    },
    remoteWorkflow: {
      path: ".github/workflows/ci.yml",
      ref: "main",
      sha: "6fab44cbd6636bfbe8cfcf940a75e8a70326b31f",
      name: "InMyPocket CI"
    },
    branchTracking: {
      remoteRef: "origin/main",
      remoteHead: "b8e00ad5d563ec0555001490dbf8e6ef3f1fa6b9",
      aheadBy: 2,
      behindBy: 5
    },
    localAheadCommits: [
      { sha: "0890674", subject: "fix: satisfy governed 30328 seed contract for hosted CI" },
      { sha: "de656c0", subject: "ops: bootstrap high-agency governance (clean push)" }
    ],
    localChangedFiles: [".github/workflows/ci.yml", "scripts/verify-ops-evidence.ts"],
    proofCriticalChangedFiles: [".github/workflows/ci.yml", "scripts/verify-ops-evidence.ts"],
    preferredInputOrder: ["Workflow run URL", "Artifact URL", "Branch or PR URL"],
    recommendedCommandSet: [
      "git diff --stat origin/main..main -- .github/workflows/ci.yml scripts src tests package.json docs .ops-evidence",
      "git log --oneline origin/main..main",
      "git push origin HEAD:main"
    ],
    requiredNextInputs: [
      "Push the current local workflow definition and trigger GitHub Actions",
      "Or provide the exact branch/PR/workflow run where ops-evidence-gate exists",
      "Or provide the uploaded hosted ops-evidence artifact link"
    ]
  };

  const blockers = getExternalBlockers(LOCAL_SIMULATED_RELEASE_HEALTH, observation);
  assert.match(blockers[0].detail, /remote default-branch workflow/i);
  assert.match(blockers[0].unblockRequirement, /ops-evidence-gate/i);

  const handoff = getExternalProofHandoff(LOCAL_SIMULATED_RELEASE_HEALTH, observation);
  assert.match(handoff[0].blocker, /local HEAD/i);
  assert.equal(handoff[0].requiredInputs[0], "Push the current local workflow definition and trigger GitHub Actions");

  const nextActions = getOperatorNextActions(LOCAL_SIMULATED_RELEASE_HEALTH, observation);
  assert.match(nextActions[0].reason, /remote default-branch workflow/i);
  assert.equal(
    nextActions[0].commands[0],
    "git diff --stat origin/main..main -- .github/workflows/ci.yml scripts src tests package.json docs .ops-evidence"
  );
});

test("observe-hosted-proof script records workflow mismatch when remote workflow differs", () => {
  const tmp = mkdtempSync(join(tmpdir(), "inmypoket-hosted-proof-"));

  try {
    const workflowDir = join(tmp, ".github", "workflows");
    const evidenceDir = join(tmp, ".ops-evidence");
    const docsDir = join(tmp, "docs");

    mkdirSync(workflowDir, { recursive: true });
    mkdirSync(evidenceDir, { recursive: true });
    mkdirSync(docsDir, { recursive: true });

    writeFileSync(
      join(workflowDir, "ci.yml"),
      readFileSync(resolve(process.cwd(), ".github/workflows/ci.yml"), "utf8")
    );

    execFileSync(
      process.execPath,
      [
        "--experimental-strip-types",
        resolve(process.cwd(), "scripts/observe-hosted-proof.ts"),
        "--remote-workflow-file",
        REMOTE_WORKFLOW_FIXTURE,
        "--repo",
        "SunwooPark-dev/inMyPocket",
        "--branch",
        "main",
        "--local-head",
        "08906747d29dffde555322b17bf4fe2e3d7d4ba7",
        "--remote-head",
        "b8e00ad5d563ec0555001490dbf8e6ef3f1fa6b9",
        "--ahead",
        "2",
        "--behind",
        "5",
        "--ahead-commit",
        "0890674 fix: satisfy governed 30328 seed contract for hosted CI",
        "--changed-file",
        ".github/workflows/ci.yml"
      ],
      { cwd: tmp, stdio: "pipe" }
    );

    const observation = JSON.parse(
      readFileSync(join(evidenceDir, "hosted-proof-observation.json"), "utf8")
    ) as HostedProofObservation;

    assert.equal(observation.result, "blocked");
    assert.equal(observation.blockerType, "remote_workflow_mismatch");
    assert.match(observation.summary, /does not match the local hosted proof lane/i);
    assert.ok(observation.remoteWorkflow?.sha);
    assert.equal(observation.localWorkflow?.name, "CI");
    assert.equal(observation.remoteWorkflow?.name, "InMyPocket CI");
    assert.equal(observation.primaryBlocker, "remote workflow mismatch");
    assert.equal(observation.branchTracking?.remoteRef, "origin/main");
    assert.ok((observation.branchTracking?.aheadBy ?? 0) >= 2);
    assert.ok((observation.branchTracking?.behindBy ?? 0) >= 0);
    assert.ok((observation.localAheadCommits?.length ?? 0) >= 1);
    assert.ok(observation.localChangedFiles?.includes(".github/workflows/ci.yml"));
    assert.ok(observation.proofCriticalChangedFiles?.includes(".github/workflows/ci.yml"));
    assert.equal(observation.preferredInputOrder?.[0], "Workflow run URL");
    assert.equal(observation.recommendedCommandSet?.[2], "git push origin HEAD:main");
    assert.equal(observation.observedRunUrl, undefined);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
