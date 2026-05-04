import { readFile } from "node:fs/promises";
import { join } from "node:path";

type HostedProofObservation = {
  recordedAt: string;
  repo: string;
  branch: string;
  localHead: string;
  result: "blocked" | "observed-hosted";
  blockerType?: string;
  primaryBlocker?: string;
  secondaryBlocker?: string;
  summary: string;
  localWorkflow?: {
    path: string;
    sha: string;
    name: string;
  };
  remoteWorkflow?: {
    path: string;
    ref: string;
    sha: string;
    name: string;
  };
  branchTracking?: {
    remoteRef: string;
    remoteHead?: string;
    aheadBy?: number;
    behindBy?: number;
  };
  localAheadCommits?: Array<{
    sha: string;
    subject: string;
  }>;
  proofCriticalChangedFiles?: string[];
  preferredInputOrder?: string[];
  recommendedCommandSet?: string[];
  requiredNextInputs?: string[];
};

function stripBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

async function main() {
  const observationPath = join(process.cwd(), ".ops-evidence", "hosted-proof-observation.json");
  const raw = await readFile(observationPath, "utf8");
  const observation = JSON.parse(stripBom(raw)) as HostedProofObservation;

  const lines = [
    "Hosted Proof Observation",
    `Recorded: ${observation.recordedAt}`,
    `Repo: ${observation.repo}`,
    `Branch: ${observation.branch}`,
    `Local HEAD: ${observation.localHead}`,
    `Result: ${observation.result}`,
    `Primary blocker: ${observation.primaryBlocker ?? "none"}`,
    `Secondary blocker: ${observation.secondaryBlocker ?? "none"}`,
    `Summary: ${observation.summary}`,
    ""
  ];

  if (observation.branchTracking) {
    lines.push("Branch tracking:");
    lines.push(`- Remote ref: ${observation.branchTracking.remoteRef}`);
    lines.push(`- Remote HEAD: ${observation.branchTracking.remoteHead ?? "unknown"}`);
    lines.push(`- Ahead by: ${observation.branchTracking.aheadBy ?? "unknown"}`);
    lines.push(`- Behind by: ${observation.branchTracking.behindBy ?? "unknown"}`);
    lines.push("");
  }

  if (observation.localWorkflow) {
    lines.push("Local workflow:");
    lines.push(`- Name: ${observation.localWorkflow.name}`);
    lines.push(`- Path: ${observation.localWorkflow.path}`);
    lines.push(`- SHA: ${observation.localWorkflow.sha}`);
    lines.push("");
  }

  if (observation.remoteWorkflow) {
    lines.push("Remote workflow:");
    lines.push(`- Name: ${observation.remoteWorkflow.name}`);
    lines.push(`- Path: ${observation.remoteWorkflow.path}`);
    lines.push(`- Ref: ${observation.remoteWorkflow.ref}`);
    lines.push(`- SHA: ${observation.remoteWorkflow.sha}`);
    lines.push("");
  }

  if (observation.localAheadCommits?.length) {
    lines.push("Local ahead commits:");
    for (const commit of observation.localAheadCommits) {
      lines.push(`- ${commit.sha} ${commit.subject}`);
    }
    lines.push("");
  }

  if (observation.proofCriticalChangedFiles?.length) {
    lines.push("Proof-critical changed files:");
    for (const file of observation.proofCriticalChangedFiles) {
      lines.push(`- ${file}`);
    }
    lines.push("");
  }

  if (observation.preferredInputOrder?.length) {
    lines.push("Preferred input order:");
    observation.preferredInputOrder.forEach((item, index) => {
      lines.push(`${index + 1}. ${item}`);
    });
    lines.push("");
  }

  if (observation.recommendedCommandSet?.length) {
    lines.push("Recommended command set:");
    for (const command of observation.recommendedCommandSet) {
      lines.push(`- ${command}`);
    }
    lines.push("");
  }

  if (observation.requiredNextInputs?.length) {
    lines.push("Required next inputs:");
    for (const input of observation.requiredNextInputs) {
      lines.push(`- ${input}`);
    }
  }

  console.log(lines.join("\n"));
}

await main();
