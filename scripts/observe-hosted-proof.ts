import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { HostedProofObservation } from "../src/lib/ops-evidence.ts";

function stripBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function getArgValues(flag: string) {
  const values: string[] = [];

  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === flag) {
      const value = process.argv[i + 1];
      if (value) {
        values.push(value);
      }
    }
  }

  return values;
}

function shaFor(content: string) {
  return createHash("sha1").update(content).digest("hex");
}

function getWorkflowName(content: string) {
  const match = content.match(/^name:\s*(.+)$/m);
  return match?.[1]?.trim() ?? "unknown";
}

const PROOF_CRITICAL_PREFIXES = [
  ".github/workflows/",
  ".ops-evidence/",
  "scripts/observe-hosted-proof.ts",
  "scripts/verify-ops-evidence.ts",
  "scripts/write-hosted-attestation.ts",
  "scripts/show-external-proof-handoff.ts",
  "src/lib/ops-evidence.ts",
  "src/lib/external-blockers.ts",
  "src/lib/external-proof-handoff.ts",
  "src/lib/operator-next-actions.ts",
  "package.json",
  "docs/operator-evidence-bundle.md",
  "docs/release-readiness-checklist.md",
  "docs/product-harness-status.md",
  "docs/hosted-proof-observation-2026-04-16.md"
];

function runGit(args: string[]) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function tryRunGit(args: string[]) {
  try {
    return runGit(args);
  } catch {
    return null;
  }
}

async function main() {
  const remoteWorkflowFile = getArgValue("--remote-workflow-file");

  if (!remoteWorkflowFile) {
    throw new Error("--remote-workflow-file is required");
  }

  const repo = getArgValue("--repo") ?? "unknown";
  const branch = getArgValue("--branch") ?? "main";
  const localHead = getArgValue("--local-head") ?? "unknown";
  const observedRunUrl = getArgValue("--observed-run-url") ?? undefined;
  const artifactUrl = getArgValue("--artifact-url") ?? undefined;
  const remoteHead = getArgValue("--remote-head") ?? undefined;
  const ahead = getArgValue("--ahead");
  const behind = getArgValue("--behind");

  const localWorkflowPath = join(process.cwd(), ".github", "workflows", "ci.yml");
  const evidenceDir = join(process.cwd(), ".ops-evidence");
  const observationJsonPath = join(evidenceDir, "hosted-proof-observation.json");
  const observationMarkdownPath = join(process.cwd(), "docs", "hosted-proof-observation-generated.md");

  const localWorkflow = stripBom(await readFile(localWorkflowPath, "utf8"));
  const remoteWorkflow = stripBom(await readFile(remoteWorkflowFile, "utf8"));
  const localSha = shaFor(localWorkflow);
  const remoteSha = shaFor(remoteWorkflow);
  const localWorkflowName = getWorkflowName(localWorkflow);
  const remoteWorkflowName = getWorkflowName(remoteWorkflow);
  const workflowsMatch = localWorkflow === remoteWorkflow;
  const fallbackAheadCommits = getArgValues("--ahead-commit");
  const fallbackChangedFiles = getArgValues("--changed-file");
  const remoteRef = `origin/${branch}`;
  const branchCount = tryRunGit(["rev-list", "--left-right", "--count", `${remoteRef}...${branch}`]);
  const branchTracking = branchCount
    ? (() => {
        const [behindRaw, aheadRaw] = branchCount.split(/\s+/);
        return {
          remoteRef,
          remoteHead: remoteHead ?? undefined,
          aheadBy: ahead ? Number(ahead) : aheadRaw ? Number(aheadRaw) : undefined,
          behindBy: behind ? Number(behind) : behindRaw ? Number(behindRaw) : undefined
        };
      })()
    : {
        remoteRef,
        remoteHead: remoteHead ?? undefined,
        aheadBy: ahead ? Number(ahead) : undefined,
        behindBy: behind ? Number(behind) : undefined
      };
  const localAheadCommitsRaw = tryRunGit(["log", "--oneline", `${remoteRef}..${branch}`]) ?? "";
  const localAheadCommits = (
    localAheadCommitsRaw
      ? localAheadCommitsRaw
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      : fallbackAheadCommits
  ).map((line) => {
    const [sha, ...rest] = line.split(" ");
    return {
      sha,
      subject: rest.join(" ")
    };
  });
  const localChangedFilesRaw = tryRunGit([
    "diff",
    "--name-only",
    `${remoteRef}..${branch}`,
    "--",
    ".github/workflows/ci.yml",
    "scripts",
    "src",
    "tests",
    "package.json",
    "docs",
    ".ops-evidence"
  ]) ?? "";
  const localChangedFiles = (
    localChangedFilesRaw
      ? localChangedFilesRaw.split("\n").map((line) => line.trim()).filter(Boolean)
      : fallbackChangedFiles
  );
  const proofCriticalChangedFiles = localChangedFiles.filter((file) =>
    PROOF_CRITICAL_PREFIXES.some((prefix) => file.startsWith(prefix))
  );
  const preferredInputOrder = ["Workflow run URL", "Artifact URL", "Branch or PR URL"];
  const recommendedCommandSet = [
    `git diff --stat ${remoteRef}..${branch} -- .github/workflows/ci.yml scripts src tests package.json docs .ops-evidence`,
    `git log --oneline ${remoteRef}..${branch}`,
    `git push origin HEAD:${branch}`
  ];

  const observation: HostedProofObservation = workflowsMatch
    ? {
        recordedAt: new Date().toISOString(),
        repo,
        branch,
        localHead,
        result: "observed-hosted",
        summary: "The observed remote workflow definition matches the local hosted proof lane.",
        localWorkflow: {
          path: ".github/workflows/ci.yml",
          sha: localSha,
          name: localWorkflowName
        },
        remoteWorkflow: {
          path: ".github/workflows/ci.yml",
          ref: branch,
          sha: remoteSha,
          name: remoteWorkflowName
        },
        branchTracking,
        localAheadCommits,
        localChangedFiles,
        proofCriticalChangedFiles,
        observedRunUrl,
        artifactUrl,
        artifactName: "ops-evidence-bundle",
        preferredInputOrder,
        recommendedCommandSet
      }
    : {
        recordedAt: new Date().toISOString(),
        repo,
        branch,
        localHead,
        result: "blocked",
        blockerType: "remote_workflow_mismatch",
        primaryBlocker: "remote workflow mismatch",
        secondaryBlocker: "no observed hosted run for local HEAD",
        summary:
          "No observed hosted run was found for local HEAD, and the remote default-branch workflow currently visible through GitHub does not match the local hosted proof lane.",
        localWorkflow: {
          path: ".github/workflows/ci.yml",
          sha: localSha,
          name: localWorkflowName
        },
        remoteWorkflow: {
          path: ".github/workflows/ci.yml",
          ref: branch,
          sha: remoteSha,
          name: remoteWorkflowName
        },
        branchTracking,
        localAheadCommits,
        localChangedFiles,
        proofCriticalChangedFiles,
        observedRunUrl,
        artifactUrl,
        artifactName: "ops-evidence-bundle",
        preferredInputOrder,
        recommendedCommandSet,
        requiredNextInputs: [
          "Push the current local workflow definition and trigger GitHub Actions",
          "Or provide the exact branch/PR/workflow run where ops-evidence-gate exists",
          "Or provide the uploaded hosted ops-evidence artifact link"
        ]
      };

  const markdown = [
    "# Hosted Proof Observation",
    "",
    `Recorded: ${observation.recordedAt}`,
    `Repo: ${repo}`,
    `Branch: ${branch}`,
    `Local HEAD: ${localHead}`,
    `Remote HEAD: ${remoteHead ?? "unknown"}`,
    `Ahead by: ${branchTracking.aheadBy ?? "unknown"}`,
    `Behind by: ${branchTracking.behindBy ?? "unknown"}`,
    `Result: ${observation.result}`,
    `Primary blocker: ${observation.primaryBlocker ?? "none"}`,
    `Secondary blocker: ${observation.secondaryBlocker ?? "none"}`,
    `Local workflow: ${localWorkflowName}`,
    `Local workflow sha1: ${localSha}`,
    `Remote workflow: ${remoteWorkflowName}`,
    `Remote workflow sha1: ${remoteSha}`,
    `Summary: ${observation.summary}`,
    "",
    "Ahead commits:",
    ...(localAheadCommits.length === 0
      ? ["- None"]
      : localAheadCommits.map((commit) => `- ${commit.sha} ${commit.subject}`)),
    "",
    "Changed files:",
    ...(localChangedFiles.length === 0 ? ["- None"] : localChangedFiles.map((file) => `- ${file}`)),
    "",
    "Proof-critical changed files:",
    ...(proofCriticalChangedFiles.length === 0
      ? ["- None"]
      : proofCriticalChangedFiles.map((file) => `- ${file}`)),
    "",
    "Preferred input order:",
    ...preferredInputOrder.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Recommended command set:",
    ...recommendedCommandSet.map((command) => `- ${command}`)
  ].join("\n") + "\n";

  await writeFile(observationJsonPath, `${JSON.stringify(observation, null, 2)}\n`, "utf8");
  await writeFile(observationMarkdownPath, markdown, "utf8");

  console.log(`Wrote hosted proof observation to ${observationJsonPath}`);
}

await main();
