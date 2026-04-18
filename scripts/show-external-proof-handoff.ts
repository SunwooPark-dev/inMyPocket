import { readFile } from "node:fs/promises";
import { join } from "node:path";

type ExternalProofHandoffArtifact = {
  generatedAt: string;
  releaseHealthVerdict: "green" | "red";
  proofLabel: string;
  externalBlockers: Array<{
    key: string;
    title: string;
    detail: string;
    unblockRequirement: string;
    severity: "high" | "medium";
  }>;
  externalProofHandoff: Array<{
    key: string;
    title: string;
    blocker: string;
    requiredInputs: string[];
    expectedOutputs: string[];
    repo?: string;
    branch?: string;
    localHead?: string;
    remoteHead?: string;
    workflowPath?: string;
    workflowName?: string;
    artifactName?: string;
    preferredInputOrder?: string[];
    recommendedCommandSet?: string[];
  }>;
  nextActions: Array<{
    key: string;
    title: string;
    reason: string;
    commands: string[];
    priority: "now" | "next" | "later";
  }>;
};

function stripBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

async function main() {
  const handoffPath = join(process.cwd(), ".ops-evidence", "external-proof-handoff.json");
  const raw = await readFile(handoffPath, "utf8");
  const artifact = JSON.parse(stripBom(raw)) as ExternalProofHandoffArtifact;

  const lines = [
    "External Proof Handoff",
    `Generated: ${artifact.generatedAt}`,
    `Release-health verdict: ${artifact.releaseHealthVerdict.toUpperCase()}`,
    `Proof scope: ${artifact.proofLabel}`,
    "",
    "External blockers:"
  ];

  for (const blocker of artifact.externalBlockers) {
    lines.push(`- [${blocker.severity.toUpperCase()}] ${blocker.title}`);
    lines.push(`  ${blocker.detail}`);
    lines.push(`  Unblock by: ${blocker.unblockRequirement}`);
  }

  lines.push("", "Handoff packet:");
  for (const item of artifact.externalProofHandoff) {
    lines.push(`- ${item.title}`);
    lines.push(`  Blocker: ${item.blocker}`);
    if (item.repo) {
      lines.push(`  Repo: ${item.repo}`);
    }
    if (item.branch) {
      lines.push(`  Branch: ${item.branch}`);
    }
    if (item.localHead) {
      lines.push(`  Local HEAD: ${item.localHead}`);
    }
    if (item.remoteHead) {
      lines.push(`  Remote HEAD: ${item.remoteHead}`);
    }
    if (item.workflowName) {
      lines.push(`  Workflow: ${item.workflowName}`);
    }
    if (item.workflowPath) {
      lines.push(`  Workflow path: ${item.workflowPath}`);
    }
    if (item.artifactName) {
      lines.push(`  Artifact: ${item.artifactName}`);
    }
    if (item.preferredInputOrder?.length) {
      lines.push(`  Preferred input order: ${item.preferredInputOrder.join(" ; ")}`);
    }
    lines.push(`  Required inputs: ${item.requiredInputs.join(" ; ")}`);
    lines.push(`  Expected outputs: ${item.expectedOutputs.join(" ; ")}`);
    if (item.recommendedCommandSet?.length) {
      lines.push(`  Recommended command set: ${item.recommendedCommandSet.join(" ; ")}`);
    }
  }

  lines.push("", "Next actions:");
  for (const action of artifact.nextActions) {
    lines.push(`- [${action.priority.toUpperCase()}] ${action.title}`);
    lines.push(`  ${action.reason}`);
    lines.push(`  Commands: ${action.commands.join(" ; ")}`);
  }

  console.log(lines.join("\n"));
}

await main();
