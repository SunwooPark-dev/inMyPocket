import { readFile } from "node:fs/promises";
import { join } from "node:path";

type HostedProofRequestArtifact = {
  generatedAt: string;
  proofLabel: string;
  request: string;
  preferredInputOrder: string[];
  acceptIf: string[];
  rejectIf: string[];
  closeCondition: string;
};

function stripBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

async function main() {
  const requestPath = join(process.cwd(), ".ops-evidence", "hosted-proof-request.json");
  const raw = await readFile(requestPath, "utf8");
  const artifact = JSON.parse(stripBom(raw)) as HostedProofRequestArtifact;

  const lines = [
    "Hosted Proof Request",
    `Generated: ${artifact.generatedAt}`,
    `Proof scope: ${artifact.proofLabel}`,
    "",
    "Request:",
    artifact.request,
    "",
    "Preferred input order:",
    ...artifact.preferredInputOrder.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Accept if:",
    ...artifact.acceptIf.map((item) => `- ${item}`),
    "",
    "Reject if:",
    ...artifact.rejectIf.map((item) => `- ${item}`),
    "",
    "Close condition:",
    artifact.closeCondition
  ];

  console.log(lines.join("\n"));
}

await main();
