import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  readLatestOperatorProofSummary,
  readLatestReleaseHealthSummary,
  type HostedOpsAttestation,
  type LatestOpsEvidenceRun,
  type ReleaseHealthVerdict
} from "../src/lib/ops-evidence.ts";

function withTempEvidenceFiles(
  setup: (evidenceDir: string) => void | Promise<void>,
  run: () => Promise<void>
) {
  const originalCwd = process.cwd();
  const tmp = mkdtempSync(join(tmpdir(), "inmypoket-release-health-"));
  const evidenceDir = join(tmp, ".ops-evidence");

  mkdirSync(evidenceDir, { recursive: true });
  setup(evidenceDir);
  process.chdir(tmp);

  return run().finally(() => {
    process.chdir(originalCwd);
    rmSync(tmp, { recursive: true, force: true });
  });
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, JSON.stringify(value, null, 2));
}

const RELEASE_HEALTH_FIXTURE: ReleaseHealthVerdict = {
  verifiedAt: "2026-04-18T00:53:56.120Z",
  verdict: "green",
  proofLevel: "full",
  verificationScope: "local-simulated",
  freshnessStatus: "current",
  staleReasons: [],
  hostedObservationStatus: "local-simulation",
  latestRunGeneratedAt: "2026-04-17T15:26:50.8302893-07:00",
  hostedAttestationGeneratedAt: "2026-04-18T00:53:56.120Z",
  visualRegressionGeneratedAt: "2026-04-18T00:40:00.000Z",
  visualRegressionStatus: "green",
  bundleDir: ".ops-evidence/ops-evidence-20260417-152631",
  reportPath: ".ops-evidence/ops-evidence-20260417-152631/report.md",
  manifestPath: ".ops-evidence/ops-evidence-20260417-152631/manifest.json",
  operationsProofStatus: "materially complete",
  paymentStatus: "not_planned",
  liveSupabaseProofStatus: "passed",
  errors: []
};

const LATEST_RUN_FIXTURE: LatestOpsEvidenceRun = {
  generatedAt: "2026-04-17T20:28:35.9233381-07:00",
  bundleDir: ".ops-evidence/ops-evidence-20260417-202818",
  reportPath: ".ops-evidence/ops-evidence-20260417-202818/report.md",
  uiAssetsDir: ".ops-evidence/ops-evidence-20260417-202818/ui-assets",
  manifestPath: ".ops-evidence/ops-evidence-20260417-202818/manifest.json",
  operationsProofStatus: "automation-only proof complete; live Supabase proof unavailable in this environment",
  paymentStatus: "not_planned",
  liveSupabaseProofStatus: "unavailable in this environment",
  stepStatus: {
    bootstrap: { succeeded: true, label: "PASS" },
    uiEvidence: { succeeded: false, label: "failed" },
    localSmoke: { succeeded: true, label: "PASS" },
    liveSupabaseProof: { succeeded: false, label: "unavailable in this environment" }
  }
};

const HOSTED_ATTESTATION_FIXTURE: HostedOpsAttestation = {
  commitSha: "0123456789abcdef0123456789abcdef01234567",
  workflowRunId: "123456789",
  workflowRunNumber: "42",
  generatedAt: "2026-04-18T00:53:56.120Z",
  verdict: "green",
  proofLevel: "full",
  verificationScope: "local-simulated",
  operationsProofStatus: "materially complete",
  liveSupabaseProofStatus: "passed",
  paymentStatus: "not_planned",
  environment: "local-simulation"
};

test("readLatestReleaseHealthSummary marks persisted verdict stale when latest-run is newer", async () => {
  await withTempEvidenceFiles(async (evidenceDir) => {
    writeJson(join(evidenceDir, "release-health.json"), RELEASE_HEALTH_FIXTURE);
    writeJson(join(evidenceDir, "latest-run.json"), LATEST_RUN_FIXTURE);
    writeJson(join(evidenceDir, "hosted-attestation.json"), HOSTED_ATTESTATION_FIXTURE);
  }, async () => {
    const summary = await readLatestReleaseHealthSummary();

    assert.ok(summary);
    assert.equal(summary.freshnessStatus, "stale");
    assert.match(summary.staleReasons[0] ?? "", /newer ops evidence bundle exists/i);
    assert.equal(summary.hostedObservationStatus, "local-simulation");
  });
});

test("readLatestOperatorProofSummary prioritizes refresh-proof when live freshness is stale", async () => {
  await withTempEvidenceFiles(async (evidenceDir) => {
    writeJson(join(evidenceDir, "release-health.json"), RELEASE_HEALTH_FIXTURE);
    writeJson(join(evidenceDir, "latest-run.json"), LATEST_RUN_FIXTURE);
    writeJson(join(evidenceDir, "hosted-attestation.json"), HOSTED_ATTESTATION_FIXTURE);
  }, async () => {
    const summary = await readLatestOperatorProofSummary();

    assert.ok(summary);
    assert.equal(summary.nextActions[0]?.key, "refresh-proof");
    assert.equal(summary.nextActions[0]?.title, "Refresh stale operator proof");
    assert.deepEqual(summary.nextActions[0]?.commands, ["pnpm ops:evidence", "pnpm ops:verify"]);
  });
});
