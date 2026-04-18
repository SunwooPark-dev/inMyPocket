import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  deriveVerificationScope,
  getProofLevelForOperationsStatus,
  type HostedOpsAttestation,
  type LatestOpsEvidenceRun
} from "../src/lib/ops-evidence.ts";

function stripBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

async function main() {
  const projectRoot = process.cwd();
  const evidenceDir = join(projectRoot, ".ops-evidence");
  const latestRunPath = join(evidenceDir, "latest-run.json");
  const attestationPath = join(evidenceDir, "hosted-attestation.json");

  const commitSha = process.env.GITHUB_SHA;
  const workflowRunId = process.env.GITHUB_RUN_ID;

  if (!commitSha || !workflowRunId) {
    throw new Error("GITHUB_SHA and GITHUB_RUN_ID are required to write hosted attestation.");
  }

  const latestRunRaw = await readFile(latestRunPath, "utf8");
  const latestRun = JSON.parse(stripBom(latestRunRaw)) as LatestOpsEvidenceRun;
  const environment = process.env.GITHUB_ACTIONS === "true" ? "hosted-ci" : "local-simulation";
  const proofLevel = getProofLevelForOperationsStatus(latestRun.operationsProofStatus);
  const verificationScope = deriveVerificationScope(
    environment === "hosted-ci" ? "observed-hosted" : "local-simulation"
  );

  const attestation: HostedOpsAttestation = {
    commitSha,
    workflowRunId,
    workflowRunNumber: process.env.GITHUB_RUN_NUMBER,
    generatedAt: new Date().toISOString(),
    verdict: proofLevel === "failed" ? "red" : "green",
    proofLevel,
    verificationScope,
    operationsProofStatus: latestRun.operationsProofStatus,
    liveSupabaseProofStatus: latestRun.liveSupabaseProofStatus ?? "unknown",
    paymentStatus: latestRun.paymentStatus,
    environment
  };

  await mkdir(evidenceDir, { recursive: true });
  await writeFile(attestationPath, `${JSON.stringify(attestation, null, 2)}\n`, "utf8");

  console.log(`Wrote hosted attestation to ${attestationPath}`);
}

await main();
