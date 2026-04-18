import { constants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  applyReleaseHealthFreshness,
  createOperatorProofSummary,
  createProofLabel,
  deriveHostedObservationStatus,
  deriveVerificationScope,
  getProofLevelForOperationsStatus,
  readLatestHostedProofObservation,
  type OperatorProofArtifact,
  type HostedOpsAttestation,
  type HostedProofRequestArtifact,
  type LatestOpsEvidenceRun,
  type OpsEvidenceManifest,
  type ReleaseHealthVerdict,
  readLatestHostedOpsAttestation,
  readLatestOpsEvidenceRun,
  readLatestVisualRegression,
  resolveOpsEvidencePath,
  validateOpsEvidenceContract
} from "../src/lib/ops-evidence.ts";

async function pathExists(targetPath: string) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile<T>(targetPath: string) {
  const raw = await readFile(targetPath, "utf8");
  const normalized = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return JSON.parse(normalized) as T;
}

function buildReleaseHealthMarkdown(health: ReleaseHealthVerdict) {
  const lines = [
    "# Release Health",
    "",
    `Verified: ${health.verifiedAt}`,
    `Verdict: ${health.verdict.toUpperCase()}`,
    `Proof level: ${createProofLabel(health.proofLevel, health.verificationScope)}`,
    `Freshness: ${health.freshnessStatus}`,
    `Hosted observation: ${health.hostedObservationStatus}`,
    `Operations proof status: ${health.operationsProofStatus ?? "unknown"}`,
    `Live Supabase proof: ${health.liveSupabaseProofStatus ?? "unknown"}`,
    `Visual regression: ${health.visualRegressionStatus}`,
    `Payment status: ${health.paymentStatus ?? "unknown"}`,
    "",
    "## Source timestamps",
    "",
    `- Latest ops bundle: ${health.latestRunGeneratedAt ?? "missing"}`,
    `- Hosted attestation: ${health.hostedAttestationGeneratedAt ?? "missing"}`,
    `- Visual regression: ${health.visualRegressionGeneratedAt ?? "missing"}`,
    "",
    "## Stale reasons",
    ""
  ];

  if (health.staleReasons.length === 0) {
    lines.push("- None");
  } else {
    lines.push(...health.staleReasons.map((reason) => `- ${reason}`));
  }

  lines.push(
    "",
    "## Evidence paths",
    "",
    `- Bundle: ${health.bundleDir ?? "missing"}`,
    `- Report: ${health.reportPath ?? "missing"}`,
    `- Manifest: ${health.manifestPath ?? "missing"}`,
    "",
    "## Errors",
    ""
  );

  if (health.errors.length === 0) {
    lines.push("- None");
  } else {
    lines.push(...health.errors.map((error) => `- ${error}`));
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const projectRoot = process.cwd();
  const evidenceDir = join(projectRoot, ".ops-evidence");
  const latestRunPath = join(evidenceDir, "latest-run.json");
  const releaseHealthJsonPath = join(evidenceDir, "release-health.json");
  const releaseHealthMarkdownPath = join(evidenceDir, "release-health.md");
  const operatorProofJsonPath = join(evidenceDir, "operator-proof.json");
  const operatorProofMarkdownPath = join(evidenceDir, "operator-proof.md");
  const externalHandoffJsonPath = join(evidenceDir, "external-proof-handoff.json");
  const externalHandoffMarkdownPath = join(evidenceDir, "external-proof-handoff.md");
  const hostedProofRequestJsonPath = join(evidenceDir, "hosted-proof-request.json");
  const hostedProofRequestMarkdownPath = join(evidenceDir, "hosted-proof-request.md");
  const visualRegressionLatestPath = join(evidenceDir, "visual-regression.latest.json");
  const errors: string[] = [];

  let latestRun: LatestOpsEvidenceRun | null = null;
  let manifest: OpsEvidenceManifest | null = null;
  const hostedAttestation = await readLatestHostedOpsAttestation();
  const hostedProofObservation = await readLatestHostedProofObservation();
  const visualRegression = await readLatestVisualRegression();

  if (!(await pathExists(latestRunPath))) {
    errors.push("latest-run.json does not exist");
  } else {
    latestRun = await readLatestOpsEvidenceRun();

    const resolvedBundleDir = latestRun
      ? resolveOpsEvidencePath(latestRun.bundleDir, projectRoot)
      : null;
    const resolvedReportPath = latestRun
      ? resolveOpsEvidencePath(latestRun.reportPath, projectRoot)
      : null;
    const resolvedUiAssetsDir = latestRun
      ? resolveOpsEvidencePath(latestRun.uiAssetsDir, projectRoot)
      : null;
    const resolvedManifestPath = latestRun
      ? resolveOpsEvidencePath(latestRun.manifestPath, projectRoot)
      : null;

    if (!resolvedBundleDir || !(await pathExists(resolvedBundleDir))) {
      errors.push("latest-run bundleDir does not exist");
    }

    if (!resolvedReportPath || !(await pathExists(resolvedReportPath))) {
      errors.push("latest-run reportPath does not exist");
    }

    if (!resolvedUiAssetsDir || !(await pathExists(resolvedUiAssetsDir))) {
      errors.push("latest-run uiAssetsDir does not exist");
    }

    if (!resolvedManifestPath || !(await pathExists(resolvedManifestPath))) {
      errors.push("latest-run manifestPath does not exist");
    } else {
      manifest = await readJsonFile<OpsEvidenceManifest>(resolvedManifestPath);
    }

    if (latestRun && latestRun.stepStatus.uiEvidence?.succeeded && resolvedUiAssetsDir) {
      const requiredAssets = [
        "home-desktop.png",
        "home-mobile.png",
        "printable-mobile.png",
        "printable.pdf"
      ];

      for (const asset of requiredAssets) {
        if (!(await pathExists(join(resolvedUiAssetsDir, asset)))) {
          errors.push(`ui evidence asset is missing: ${asset}`);
        }
      }
    }
  }

  if (latestRun && manifest) {
    const contract = validateOpsEvidenceContract(latestRun, manifest);
    errors.push(...contract.errors);
  }

  let visualRegressionStatus: ReleaseHealthVerdict["visualRegressionStatus"] = "missing";
  if (await pathExists(visualRegressionLatestPath)) {
    if (visualRegression) {
      visualRegressionStatus = visualRegression.verdict;
    } else {
      errors.push("visual-regression.latest.json is invalid");
      visualRegressionStatus = "red";
    }
  }

  const proofLevel = getProofLevelForOperationsStatus(latestRun?.operationsProofStatus ?? null);
  const verdict: ReleaseHealthVerdict["verdict"] =
    errors.length === 0 && proofLevel !== "failed"
      ? "green"
      : "red";
  const hostedObservationStatus = deriveHostedObservationStatus(hostedAttestation);
  const verificationScope = deriveVerificationScope(hostedObservationStatus);

  const health = applyReleaseHealthFreshness({
    verifiedAt: new Date().toISOString(),
    verdict,
    proofLevel,
    verificationScope,
    freshnessStatus: "current",
    staleReasons: [],
    hostedObservationStatus,
    latestRunGeneratedAt: latestRun?.generatedAt ?? null,
    hostedAttestationGeneratedAt: hostedAttestation?.generatedAt ?? null,
    visualRegressionGeneratedAt: visualRegression?.generatedAt ?? null,
    bundleDir: latestRun?.bundleDir ?? null,
    reportPath: latestRun?.reportPath ?? null,
    manifestPath: latestRun?.manifestPath ?? null,
    operationsProofStatus: latestRun?.operationsProofStatus ?? null,
    paymentStatus: latestRun?.paymentStatus ?? null,
    liveSupabaseProofStatus: latestRun?.liveSupabaseProofStatus ?? null,
    visualRegressionStatus,
    errors
  }, latestRun, hostedAttestation, visualRegression);

  await mkdir(evidenceDir, { recursive: true });
  await writeFile(releaseHealthJsonPath, `${JSON.stringify(health, null, 2)}\n`, "utf8");
  await writeFile(releaseHealthMarkdownPath, buildReleaseHealthMarkdown(health), "utf8");

  const operatorProof = createOperatorProofSummary(
    health,
    latestRun,
    visualRegression,
    hostedProofObservation
  );
  if (operatorProof) {
    const operatorProofArtifact: OperatorProofArtifact = {
      generatedAt: health.verifiedAt,
      bundleName: operatorProof.bundleName,
      releaseHealthVerdict: operatorProof.releaseHealthVerdict,
      proofLabel: operatorProof.proofLabel,
      hostedObservationStatus: operatorProof.hostedObservationStatus,
      visualRegressionStatus: operatorProof.visualRegressionStatus,
      liveSupabaseProofStatus: operatorProof.liveSupabaseProofStatus,
      refreshCommands: operatorProof.refreshCommands,
      artifactPointers: operatorProof.artifactPointers,
      items: operatorProof.items,
      acceptedLimits: operatorProof.acceptedLimits,
      externalBlockers: operatorProof.externalBlockers,
      externalProofHandoff: operatorProof.externalProofHandoff,
      nextActions: operatorProof.nextActions
    };

    const operatorProofMarkdown = [
      "# Operator Proof",
      "",
      `Generated: ${health.verifiedAt}`,
      `Release-health verdict: ${operatorProof.releaseHealthVerdict.toUpperCase()}`,
      `Proof scope: ${operatorProof.proofLabel}`,
      `Hosted observation: ${operatorProof.hostedObservationStatus}`,
      `Visual regression: ${operatorProof.visualRegressionStatus}`,
      `Live Supabase proof: ${operatorProof.liveSupabaseProofStatus}`,
      "",
      "## Checklist",
      "",
      ...operatorProof.items.map((item) => `- [${item.status.toUpperCase()}] ${item.title}: ${item.detail}`),
      "",
      "## Refresh commands",
      "",
      ...operatorProof.refreshCommands.map((command) => `- \`${command}\``),
      "",
      "## Artifact pointers",
      "",
      `- Bundle: ${operatorProof.artifactPointers.bundleDir ?? "missing"}`,
      `- Report: ${operatorProof.artifactPointers.reportPath ?? "missing"}`,
      `- Manifest: ${operatorProof.artifactPointers.manifestPath ?? "missing"}`,
      `- Release health JSON: ${operatorProof.artifactPointers.releaseHealthJsonPath}`,
      `- Release health Markdown: ${operatorProof.artifactPointers.releaseHealthMarkdownPath}`,
      `- Latest pointer: ${operatorProof.artifactPointers.latestPointerPath}`,
      `- Visual report dir: ${operatorProof.artifactPointers.visualReportDir ?? "missing"}`
      ,
      "",
      "## Accepted local limits",
      "",
      ...operatorProof.acceptedLimits.map(
        (limit) => `- [${limit.status.toUpperCase()}] ${limit.title}: ${limit.detail} Reopen when: ${limit.reopenWhen}`
      ),
      "",
      "## External blockers",
      "",
      ...operatorProof.externalBlockers.map(
        (blocker) =>
          `- [${blocker.severity.toUpperCase()}] ${blocker.title}: ${blocker.detail} Unblock by: ${blocker.unblockRequirement}`
      ),
      "",
      "## External proof handoff",
      "",
      ...operatorProof.externalProofHandoff.map((item) => [
        `- ${item.title}: ${item.blocker}`,
        `  Required inputs: ${item.requiredInputs.join(" ; ")}`,
        `  Expected outputs: ${item.expectedOutputs.join(" ; ")}`
      ].join("\n")),
      "",
      "## Operator next actions",
      "",
      ...operatorProof.nextActions.map(
        (action) =>
          `- [${action.priority.toUpperCase()}] ${action.title}: ${action.reason} Commands: ${action.commands.join(" ; ")}`
      )
    ].join("\n") + "\n";

    await writeFile(operatorProofJsonPath, `${JSON.stringify(operatorProofArtifact, null, 2)}\n`, "utf8");
    await writeFile(operatorProofMarkdownPath, operatorProofMarkdown, "utf8");

    const externalHandoffArtifact = {
      generatedAt: health.verifiedAt,
      releaseHealthVerdict: operatorProof.releaseHealthVerdict,
      proofLabel: operatorProof.proofLabel,
      externalBlockers: operatorProof.externalBlockers,
      externalProofHandoff: operatorProof.externalProofHandoff,
      nextActions: operatorProof.nextActions
    };

    const externalHandoffMarkdown = [
      "# External Proof Handoff",
      "",
      `Generated: ${health.verifiedAt}`,
      `Release-health verdict: ${operatorProof.releaseHealthVerdict.toUpperCase()}`,
      `Proof scope: ${operatorProof.proofLabel}`,
      "",
      "## External blockers",
      "",
      ...operatorProof.externalBlockers.map(
        (blocker) =>
          `- [${blocker.severity.toUpperCase()}] ${blocker.title}: ${blocker.detail} Unblock by: ${blocker.unblockRequirement}`
      ),
      "",
      "## Handoff packet",
      "",
      ...operatorProof.externalProofHandoff.map((item) => [
        `- ${item.title}: ${item.blocker}`,
        `  Required inputs: ${item.requiredInputs.join(" ; ")}`,
        `  Expected outputs: ${item.expectedOutputs.join(" ; ")}`
      ].join("\n")),
      "",
      "## Next actions",
      "",
      ...operatorProof.nextActions.map(
        (action) =>
          `- [${action.priority.toUpperCase()}] ${action.title}: ${action.reason} Commands: ${action.commands.join(" ; ")}`
      )
    ].join("\n") + "\n";

    await writeFile(externalHandoffJsonPath, `${JSON.stringify(externalHandoffArtifact, null, 2)}\n`, "utf8");
    await writeFile(externalHandoffMarkdownPath, externalHandoffMarkdown, "utf8");

    if (hostedProofObservation && health.hostedObservationStatus !== "observed-hosted") {
      const hostedProofRequest: HostedProofRequestArtifact = {
        generatedAt: health.verifiedAt,
        proofLabel: operatorProof.proofLabel,
        request:
          "Provide one canonical GitHub-hosted proof run or artifact for the hosted ops-evidence lane that matches the current local workflow definition.",
        preferredInputOrder: [
          "Workflow run URL",
          "Artifact URL",
          "Branch or PR URL"
        ],
        acceptIf: [
          "The workflow matches the canonical hosted proof lane rather than a simple build-only CI flow.",
          "The artifact contains LATEST.md, latest-run.json, release-health.json, release-health.md, hosted-attestation.json, and the hosted ops-evidence bundle.",
          "hosted-attestation.json is not local-simulated."
        ],
        rejectIf: [
          "Only the default build-only CI workflow is visible.",
          "The artifact is missing any canonical ops-evidence file.",
          "The hosted attestation remains local-simulated."
        ],
        closeCondition:
          "Hosted proof closes only when a provided workflow run or artifact satisfies every accept-if rule; otherwise the blocker stays open with the failure reason recorded."
      };

      const hostedProofRequestMarkdown = [
        "# Hosted Proof Request",
        "",
        `Generated: ${health.verifiedAt}`,
        `Proof scope: ${operatorProof.proofLabel}`,
        "",
        "## Request",
        "",
        hostedProofRequest.request,
        "",
        "## Preferred input order",
        "",
        ...hostedProofRequest.preferredInputOrder.map((item, index) => `${index + 1}. ${item}`),
        "",
        "## Accept if",
        "",
        ...hostedProofRequest.acceptIf.map((item) => `- ${item}`),
        "",
        "## Reject if",
        "",
        ...hostedProofRequest.rejectIf.map((item) => `- ${item}`),
        "",
        "## Close condition",
        "",
        hostedProofRequest.closeCondition
      ].join("\n") + "\n";

      await writeFile(
        hostedProofRequestJsonPath,
        `${JSON.stringify(hostedProofRequest, null, 2)}\n`,
        "utf8"
      );
      await writeFile(hostedProofRequestMarkdownPath, hostedProofRequestMarkdown, "utf8");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Ops evidence verification failed:\n- ${errors.join("\n- ")}`);
  }

  console.log(`Verified ops evidence contract: ${health.verdict.toUpperCase()} (${health.proofLevel})`);
}

await main();
