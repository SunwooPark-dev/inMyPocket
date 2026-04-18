import { basename, join, resolve } from "node:path";
import { readFile } from "node:fs/promises";

import type { AcceptedLimit } from "./accepted-limits.ts";
import { getAcceptedLimits } from "./accepted-limits.ts";
import type { ExternalBlocker } from "./external-blockers.ts";
import { getExternalBlockers } from "./external-blockers.ts";
import type { ExternalProofHandoffItem } from "./external-proof-handoff.ts";
import { getExternalProofHandoff } from "./external-proof-handoff.ts";
import type { OperatorNextAction } from "./operator-next-actions.ts";
import { getOperatorNextActions } from "./operator-next-actions.ts";

function stripBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

export type OpsEvidenceStepStatus = {
  succeeded: boolean;
  label: string;
};

export type LatestOpsEvidenceRun = {
  generatedAt: string;
  bundleDir: string;
  reportPath: string;
  uiAssetsDir: string;
  manifestPath?: string;
  operationsProofStatus: string;
  paymentStatus: string;
  liveSupabaseProofStatus?: string;
  stepStatus: Record<string, OpsEvidenceStepStatus>;
};

export type OpsEvidenceSummary = {
  generatedAt: string;
  formattedGeneratedAt: string;
  bundleName: string;
  operationsProofStatus: string;
  paymentStatus: string;
  liveSupabaseProofStatus: string;
  stepStatus: Array<{
    key: string;
    title: string;
    succeeded: boolean;
    label: string;
  }>;
};

export type OpsEvidenceManifest = {
  generatedAt: string;
  publicUxStatus: string;
  operationsProofStatus: string;
  paymentStatus: string;
  paymentReady: boolean;
  bundleDir: string;
  reportPath: string;
  uiAssetsDir: string;
  stepStatus: Record<string, OpsEvidenceStepStatus>;
  envReadiness: {
    requiredNow: Record<string, boolean>;
    payment: Record<string, boolean>;
  };
};

export type OpsEvidenceContractValidation = {
  ok: boolean;
  errors: string[];
};

export type ReleaseProofLevel = "full" | "automation-only" | "failed";
export type HostedObservationStatus = "observed-hosted" | "local-simulation" | "missing";
export type VerificationScope = "hosted-observed" | "local-simulated" | "local-only";

export type ReleaseHealthVerdict = {
  verifiedAt: string;
  verdict: "green" | "red";
  proofLevel: ReleaseProofLevel;
  verificationScope: VerificationScope;
  freshnessStatus: "current" | "stale";
  staleReasons: string[];
  hostedObservationStatus: HostedObservationStatus;
  latestRunGeneratedAt: string | null;
  hostedAttestationGeneratedAt: string | null;
  visualRegressionGeneratedAt: string | null;
  visualRegressionStatus: "green" | "red" | "missing";
  bundleDir: string | null;
  reportPath: string | null;
  manifestPath: string | null;
  operationsProofStatus: string | null;
  paymentStatus: string | null;
  liveSupabaseProofStatus: string | null;
  errors: string[];
};

export type ReleaseHealthSummary = {
  verifiedAt: string;
  formattedVerifiedAt: string;
  verdict: "green" | "red";
  proofLevel: ReleaseProofLevel;
  verificationScope: VerificationScope;
  proofLabel: string;
  freshnessStatus: "current" | "stale";
  staleReasons: string[];
  hostedObservationStatus: HostedObservationStatus;
  visualRegressionStatus: "green" | "red" | "missing";
  bundleName: string;
  operationsProofStatus: string;
  paymentStatus: string;
  liveSupabaseProofStatus: string;
  errors: string[];
};

export type HostedOpsAttestation = {
  commitSha: string;
  workflowRunId: string;
  workflowRunNumber?: string;
  generatedAt: string;
  verdict: "green" | "red";
  proofLevel: ReleaseProofLevel;
  verificationScope: VerificationScope;
  operationsProofStatus: string;
  liveSupabaseProofStatus: string;
  paymentStatus: string;
  environment: "hosted-ci" | "local-simulation";
};

export type HostedProofObservation = {
  recordedAt: string;
  repo: string;
  branch: string;
  localHead: string;
  result: "blocked" | "observed-hosted";
  blockerType?: "remote_workflow_mismatch" | "missing_run" | "missing_artifact";
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
  localChangedFiles?: string[];
  proofCriticalChangedFiles?: string[];
  observedRunUrl?: string;
  artifactUrl?: string;
  artifactName?: string;
  preferredInputOrder?: string[];
  recommendedCommandSet?: string[];
  requiredNextInputs?: string[];
};

export type HostedProofRequestArtifact = {
  generatedAt: string;
  proofLabel: string;
  request: string;
  preferredInputOrder: string[];
  acceptIf: string[];
  rejectIf: string[];
  closeCondition: string;
};

export type HostedOpsAttestationSummary = {
  commitShaShort: string;
  workflowRunId: string;
  workflowRunNumber: string;
  formattedGeneratedAt: string;
  verdict: "green" | "red";
  proofLevel: ReleaseProofLevel;
  verificationScope: VerificationScope;
  proofLabel: string;
  operationsProofStatus: string;
  liveSupabaseProofStatus: string;
  paymentStatus: string;
  isObservedHostedRun: boolean;
  provenanceLabel: string;
};

export type VisualRegressionLatest = {
  generatedAt: string;
  verdict: "green" | "red";
  threshold: number;
  candidateDir: string;
  reportDir: string;
};

export type VisualRegressionSummary = {
  formattedGeneratedAt: string;
  verdict: "green" | "red";
  threshold: number;
  candidateName: string;
  reportName: string;
};

export type OperatorProofItemStatus = "proved" | "attention" | "deferred";

export type OperatorProofItem = {
  key: string;
  title: string;
  status: OperatorProofItemStatus;
  detail: string;
};

export type OperatorProofArtifact = {
  generatedAt: string;
  bundleName: string;
  releaseHealthVerdict: "green" | "red";
  proofLabel: string;
  hostedObservationStatus: HostedObservationStatus;
  visualRegressionStatus: "green" | "red" | "missing";
  liveSupabaseProofStatus: string;
  refreshCommands: string[];
  artifactPointers: {
    latestPointerPath: string;
    releaseHealthJsonPath: string;
    releaseHealthMarkdownPath: string;
    externalProofHandoffJsonPath: string;
    externalProofHandoffMarkdownPath: string;
    bundleDir: string | null;
    reportPath: string | null;
    manifestPath: string | null;
    visualReportDir: string | null;
  };
  items: OperatorProofItem[];
  acceptedLimits: AcceptedLimit[];
  externalBlockers: ExternalBlocker[];
  externalProofHandoff: ExternalProofHandoffItem[];
  nextActions: OperatorNextAction[];
};

export type OperatorProofSummary = {
  formattedGeneratedAt: string;
  bundleName: string;
  releaseHealthVerdict: "green" | "red";
  proofLabel: string;
  hostedObservationStatus: HostedObservationStatus;
  visualRegressionStatus: "green" | "red" | "missing";
  liveSupabaseProofStatus: string;
  refreshCommands: string[];
  artifactPointers: {
    latestPointerPath: string;
    releaseHealthJsonPath: string;
    releaseHealthMarkdownPath: string;
    externalProofHandoffJsonPath: string;
    externalProofHandoffMarkdownPath: string;
    bundleDir: string | null;
    reportPath: string | null;
    manifestPath: string | null;
    visualReportDir: string | null;
  };
  items: OperatorProofItem[];
  acceptedLimits: AcceptedLimit[];
  externalBlockers: ExternalBlocker[];
  externalProofHandoff: ExternalProofHandoffItem[];
  nextActions: OperatorNextAction[];
};

const STEP_TITLES: Record<string, string> = {
  bootstrap: "Bootstrap capture",
  uiEvidence: "UI evidence capture",
  localSmoke: "Local smoke",
  liveSupabaseProof: "Live Supabase proof"
};

function formatGeneratedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function isNewerTimestamp(candidate: string | null | undefined, reference: string | null | undefined) {
  if (!candidate || !reference) {
    return false;
  }

  const candidateTime = new Date(candidate).getTime();
  const referenceTime = new Date(reference).getTime();

  if (Number.isNaN(candidateTime) || Number.isNaN(referenceTime)) {
    return false;
  }

  return candidateTime > referenceTime;
}

function isFreshnessDelta(candidate: string | null | undefined, reference: string | null | undefined) {
  if (!candidate) {
    return false;
  }

  if (!reference) {
    return true;
  }

  return isNewerTimestamp(candidate, reference);
}

export function getProofLevelForOperationsStatus(
  operationsProofStatus: string | null | undefined
): ReleaseProofLevel {
  if (operationsProofStatus === "materially complete") {
    return "full";
  }

  if (operationsProofStatus?.includes("automation-only")) {
    return "automation-only";
  }

  return "failed";
}

export function deriveHostedObservationStatus(
  attestation: HostedOpsAttestation | null
): HostedObservationStatus {
  if (!attestation) {
    return "missing";
  }

  return attestation.environment === "hosted-ci" ? "observed-hosted" : "local-simulation";
}

export function deriveVerificationScope(
  hostedObservationStatus: HostedObservationStatus
): VerificationScope {
  if (hostedObservationStatus === "observed-hosted") {
    return "hosted-observed";
  }

  if (hostedObservationStatus === "local-simulation") {
    return "local-simulated";
  }

  return "local-only";
}

export function createProofLabel(
  proofLevel: ReleaseProofLevel,
  verificationScope: VerificationScope
) {
  return `${proofLevel} (${verificationScope})`;
}

function normalizePathSlashes(value: string) {
  return value.replace(/\\/g, "/");
}

export function getOpsEvidencePathLeaf(value: string | null | undefined) {
  if (!value) {
    return "unknown bundle";
  }

  const normalized = normalizePathSlashes(value);
  return basename(normalized);
}

export function resolveOpsEvidencePath(value: string | null | undefined, projectRoot = process.cwd()) {
  if (!value) {
    return null;
  }

  const normalized = normalizePathSlashes(value);
  const normalizedProjectRoot = normalizePathSlashes(projectRoot);

  if (/^[A-Za-z]:\//.test(normalized)) {
    const driveLetter = normalized.slice(0, 1).toLowerCase();
    return `/mnt/${driveLetter}${normalized.slice(2)}`;
  }

  if (normalized.startsWith("/")) {
    return normalized;
  }

  if (normalizedProjectRoot.startsWith("/")) {
    return `${normalizedProjectRoot.replace(/\/$/, "")}/${normalized.replace(/^\.\//, "")}`;
  }

  return resolve(projectRoot, normalized);
}

export function createOpsEvidenceSummary(
  latestRun: LatestOpsEvidenceRun | null
): OpsEvidenceSummary | null {
  if (!latestRun) {
    return null;
  }

  return {
    generatedAt: latestRun.generatedAt,
    formattedGeneratedAt: formatGeneratedAt(latestRun.generatedAt),
    bundleName: getOpsEvidencePathLeaf(latestRun.bundleDir),
    operationsProofStatus: latestRun.operationsProofStatus,
    paymentStatus: latestRun.paymentStatus,
    liveSupabaseProofStatus: latestRun.liveSupabaseProofStatus ?? "unknown",
    stepStatus: Object.entries(latestRun.stepStatus).map(([key, status]) => ({
      key,
      title: STEP_TITLES[key] ?? key,
      succeeded: status.succeeded,
      label: status.label
    }))
  };
}

export async function readLatestOpsEvidenceRun() {
  const latestRunPath = join(process.cwd(), ".ops-evidence", "latest-run.json");

  try {
    const raw = await readFile(latestRunPath, "utf8");
    return JSON.parse(stripBom(raw)) as LatestOpsEvidenceRun;
  } catch {
    return null;
  }
}

export async function readLatestOpsEvidenceSummary() {
  try {
    const parsed = await readLatestOpsEvidenceRun();
    return createOpsEvidenceSummary(parsed);
  } catch {
    return null;
  }
}

export function createReleaseHealthSummary(
  verdict: ReleaseHealthVerdict | null
): ReleaseHealthSummary | null {
  if (!verdict) {
    return null;
  }

  return {
    verifiedAt: verdict.verifiedAt,
    formattedVerifiedAt: formatGeneratedAt(verdict.verifiedAt),
    verdict: verdict.verdict,
    proofLevel: verdict.proofLevel,
    verificationScope: verdict.verificationScope,
    proofLabel: createProofLabel(verdict.proofLevel, verdict.verificationScope),
    freshnessStatus: verdict.freshnessStatus,
    staleReasons: verdict.staleReasons,
    hostedObservationStatus: verdict.hostedObservationStatus,
    visualRegressionStatus: verdict.visualRegressionStatus,
    bundleName: verdict.bundleDir ? getOpsEvidencePathLeaf(verdict.bundleDir) : "unknown bundle",
    operationsProofStatus: verdict.operationsProofStatus ?? "unknown",
    paymentStatus: verdict.paymentStatus ?? "unknown",
    liveSupabaseProofStatus: verdict.liveSupabaseProofStatus ?? "unknown",
    errors: verdict.errors
  };
}

export function applyReleaseHealthFreshness(
  verdict: ReleaseHealthVerdict,
  latestRun: LatestOpsEvidenceRun | null,
  hostedAttestation: HostedOpsAttestation | null,
  visualRegression: VisualRegressionLatest | null
): ReleaseHealthVerdict {
  const staleReasons: string[] = [];
  const hostedObservationStatus = deriveHostedObservationStatus(hostedAttestation);
  const verificationScope = deriveVerificationScope(hostedObservationStatus);
  const visualRegressionStatus = visualRegression?.verdict ?? verdict.visualRegressionStatus;

  if (latestRun && isFreshnessDelta(latestRun.generatedAt, verdict.latestRunGeneratedAt)) {
    staleReasons.push("A newer ops evidence bundle exists than the one reflected in release health.");
  }

  if (
    hostedAttestation &&
    isFreshnessDelta(hostedAttestation.generatedAt, verdict.hostedAttestationGeneratedAt)
  ) {
    staleReasons.push("A newer hosted provenance attestation exists than the one reflected in release health.");
  }

  if (
    visualRegression &&
    isFreshnessDelta(visualRegression.generatedAt, verdict.visualRegressionGeneratedAt)
  ) {
    staleReasons.push("A newer advisory visual regression result exists than the one reflected in release health.");
  }

  return {
    ...verdict,
    freshnessStatus: staleReasons.length > 0 ? "stale" : "current",
    staleReasons,
    hostedObservationStatus,
    verificationScope,
    visualRegressionStatus
  };
}

export async function readLatestReleaseHealthSummary() {
  const releaseHealthPath = join(process.cwd(), ".ops-evidence", "release-health.json");

  try {
    const raw = await readFile(releaseHealthPath, "utf8");
    const parsed = JSON.parse(stripBom(raw)) as ReleaseHealthVerdict;
    return createReleaseHealthSummary(parsed);
  } catch {
    return null;
  }
}

export function createHostedOpsAttestationSummary(
  attestation: HostedOpsAttestation | null
): HostedOpsAttestationSummary | null {
  if (!attestation) {
    return null;
  }

  return {
    commitShaShort: attestation.commitSha.slice(0, 7),
    workflowRunId: attestation.workflowRunId,
    workflowRunNumber: attestation.workflowRunNumber ?? "unknown",
    formattedGeneratedAt: formatGeneratedAt(attestation.generatedAt),
    verdict: attestation.verdict,
    proofLevel: attestation.proofLevel,
    verificationScope: attestation.verificationScope,
    proofLabel: createProofLabel(attestation.proofLevel, attestation.verificationScope),
    operationsProofStatus: attestation.operationsProofStatus,
    liveSupabaseProofStatus: attestation.liveSupabaseProofStatus,
    paymentStatus: attestation.paymentStatus,
    isObservedHostedRun: attestation.environment === "hosted-ci",
    provenanceLabel:
      attestation.environment === "hosted-ci"
        ? "Observed hosted CI run"
        : "Local simulation of hosted CI provenance"
  };
}

export async function readLatestHostedOpsAttestation() {
  const attestationPath = join(process.cwd(), ".ops-evidence", "hosted-attestation.json");

  try {
    const raw = await readFile(attestationPath, "utf8");
    return JSON.parse(stripBom(raw)) as HostedOpsAttestation;
  } catch {
    return null;
  }
}

export async function readLatestHostedProofObservation() {
  const observationPath = join(process.cwd(), ".ops-evidence", "hosted-proof-observation.json");

  try {
    const raw = await readFile(observationPath, "utf8");
    return JSON.parse(stripBom(raw)) as HostedProofObservation;
  } catch {
    return null;
  }
}

export async function readLatestHostedOpsAttestationSummary() {
  try {
    const parsed = await readLatestHostedOpsAttestation();
    return createHostedOpsAttestationSummary(parsed);
  } catch {
    return null;
  }
}

export function createVisualRegressionSummary(
  latest: VisualRegressionLatest | null
): VisualRegressionSummary | null {
  if (!latest) {
    return null;
  }

  return {
    formattedGeneratedAt: formatGeneratedAt(latest.generatedAt),
    verdict: latest.verdict,
    threshold: latest.threshold,
    candidateName: getOpsEvidencePathLeaf(latest.candidateDir),
    reportName: getOpsEvidencePathLeaf(latest.reportDir)
  };
}

export async function readLatestVisualRegression() {
  const visualLatestPath = join(process.cwd(), ".ops-evidence", "visual-regression.latest.json");

  try {
    const raw = await readFile(visualLatestPath, "utf8");
    return JSON.parse(stripBom(raw)) as VisualRegressionLatest;
  } catch {
    return null;
  }
}

export function createOperatorProofSummary(
  releaseHealth: ReleaseHealthVerdict | null,
  latestRun: LatestOpsEvidenceRun | null,
  visualRegression: VisualRegressionLatest | null = null,
  hostedProofObservation: HostedProofObservation | null = null
): OperatorProofSummary | null {
  if (!releaseHealth) {
    return null;
  }

  const items: OperatorProofItem[] = [
    {
      key: "public-routes",
      title: "Public route proof",
      status: latestRun?.stepStatus.localSmoke?.succeeded ? "proved" : "attention",
      detail: latestRun?.stepStatus.localSmoke?.succeeded
        ? "Public compare and printable routes passed local smoke, including non-default scenario coverage."
        : "Local smoke has not recently proven the public compare/print routes."
    },
    {
      key: "admin-access",
      title: "Admin and access-control proof",
      status: latestRun?.stepStatus.localSmoke?.succeeded ? "proved" : "attention",
      detail: latestRun?.stepStatus.localSmoke?.succeeded
        ? "Locked admin, unlock throttling, authenticated observation access, and evidence route controls were exercised in local smoke."
        : "Admin access-control proof needs a fresh local smoke pass."
    },
    {
      key: "observation-evidence",
      title: "Observation and evidence proof",
      status: latestRun?.stepStatus.localSmoke?.succeeded ? "proved" : "attention",
      detail: latestRun?.stepStatus.localSmoke?.succeeded
        ? "Manual observation save, recent-observation visibility, and evidence redirect behavior were proven in local smoke."
        : "Observation/evidence behavior has not been freshly proven."
    },
    {
      key: "supabase-boundary",
      title: "Supabase trust-boundary proof",
      status: releaseHealth.liveSupabaseProofStatus === "passed" ? "proved" : "attention",
      detail:
        releaseHealth.liveSupabaseProofStatus === "passed"
          ? "Published view access and private base-table denial were proven in the current non-payment lane."
          : "Live Supabase trust-boundary proof is not currently in a passed state."
    },
    {
      key: "payment",
      title: "Payment proof",
      status: releaseHealth.paymentStatus === "deferred" ? "deferred" : "attention",
      detail:
        releaseHealth.paymentStatus === "deferred"
          ? "Payment remains intentionally outside the current merge gate until Stripe test-mode secrets are supplied."
          : releaseHealth.paymentStatus === "not_planned"
            ? "Direct payment is not part of the current product model; donation and advertising support are being considered instead."
          : `Payment status is ${releaseHealth.paymentStatus}.`
    }
  ];

  return {
    formattedGeneratedAt: formatGeneratedAt(releaseHealth.verifiedAt),
    bundleName: releaseHealth.bundleDir ? getOpsEvidencePathLeaf(releaseHealth.bundleDir) : "unknown bundle",
    releaseHealthVerdict: releaseHealth.verdict,
    proofLabel: createProofLabel(releaseHealth.proofLevel, releaseHealth.verificationScope),
    hostedObservationStatus: releaseHealth.hostedObservationStatus,
    visualRegressionStatus: releaseHealth.visualRegressionStatus,
    liveSupabaseProofStatus: releaseHealth.liveSupabaseProofStatus ?? "unknown",
    refreshCommands: ["pnpm ops:evidence", "pnpm ops:verify"],
    artifactPointers: {
      latestPointerPath: ".ops-evidence/LATEST.md",
      releaseHealthJsonPath: ".ops-evidence/release-health.json",
      releaseHealthMarkdownPath: ".ops-evidence/release-health.md",
      externalProofHandoffJsonPath: ".ops-evidence/external-proof-handoff.json",
      externalProofHandoffMarkdownPath: ".ops-evidence/external-proof-handoff.md",
      bundleDir: releaseHealth.bundleDir,
      reportPath: releaseHealth.reportPath,
      manifestPath: releaseHealth.manifestPath,
      visualReportDir: visualRegression?.reportDir ?? null
    },
    items,
    acceptedLimits: getAcceptedLimits(),
    externalBlockers: getExternalBlockers(createReleaseHealthSummary(releaseHealth), hostedProofObservation),
    externalProofHandoff: getExternalProofHandoff(
      createReleaseHealthSummary(releaseHealth),
      hostedProofObservation
    ),
    nextActions: getOperatorNextActions(createReleaseHealthSummary(releaseHealth), hostedProofObservation)
  };
}

export async function readLatestVisualRegressionSummary() {
  try {
    const parsed = await readLatestVisualRegression();
    return createVisualRegressionSummary(parsed);
  } catch {
    return null;
  }
}

export async function readLatestOperatorProofSummary() {
  const operatorProofPath = join(process.cwd(), ".ops-evidence", "operator-proof.json");

  try {
    const raw = await readFile(operatorProofPath, "utf8");
    const parsed = JSON.parse(stripBom(raw)) as OperatorProofArtifact;

    return {
      formattedGeneratedAt: formatGeneratedAt(parsed.generatedAt),
      bundleName: parsed.bundleName,
      releaseHealthVerdict: parsed.releaseHealthVerdict,
      proofLabel: parsed.proofLabel,
      hostedObservationStatus: parsed.hostedObservationStatus,
      visualRegressionStatus: parsed.visualRegressionStatus,
      liveSupabaseProofStatus: parsed.liveSupabaseProofStatus,
      refreshCommands: parsed.refreshCommands,
      artifactPointers: parsed.artifactPointers,
      items: parsed.items,
      acceptedLimits: parsed.acceptedLimits,
      externalBlockers: parsed.externalBlockers,
      externalProofHandoff: parsed.externalProofHandoff,
      nextActions: parsed.nextActions
    } satisfies OperatorProofSummary;
  } catch {
    return null;
  }
}

export function validateOpsEvidenceContract(
  latestRun: LatestOpsEvidenceRun,
  manifest: OpsEvidenceManifest
): OpsEvidenceContractValidation {
  const errors: string[] = [];

  if (latestRun.bundleDir !== manifest.bundleDir) {
    errors.push("latest-run bundleDir does not match manifest bundleDir");
  }

  if (latestRun.reportPath !== manifest.reportPath) {
    errors.push("latest-run reportPath does not match manifest reportPath");
  }

  if (latestRun.uiAssetsDir !== manifest.uiAssetsDir) {
    errors.push("latest-run uiAssetsDir does not match manifest uiAssetsDir");
  }

  if (latestRun.operationsProofStatus !== manifest.operationsProofStatus) {
    errors.push("latest-run operationsProofStatus does not match manifest operationsProofStatus");
  }

  if (latestRun.paymentStatus !== manifest.paymentStatus) {
    errors.push("latest-run paymentStatus does not match manifest paymentStatus");
  }

  const latestStepKeys = Object.keys(latestRun.stepStatus).sort();
  const manifestStepKeys = Object.keys(manifest.stepStatus).sort();
  if (latestStepKeys.join(",") !== manifestStepKeys.join(",")) {
    errors.push("latest-run stepStatus keys do not match manifest stepStatus keys");
  }

  for (const key of latestStepKeys) {
    const latestStep = latestRun.stepStatus[key];
    const manifestStep = manifest.stepStatus[key];

    if (!latestStep || !manifestStep) {
      continue;
    }

    if (latestStep.succeeded !== manifestStep.succeeded) {
      errors.push(`stepStatus.${key}.succeeded is inconsistent between latest-run and manifest`);
    }

    if (latestStep.label !== manifestStep.label) {
      errors.push(`stepStatus.${key}.label is inconsistent between latest-run and manifest`);
    }
  }

  const liveSupabaseStep = manifest.stepStatus.liveSupabaseProof;
  if (latestRun.liveSupabaseProofStatus && liveSupabaseStep) {
    if (latestRun.liveSupabaseProofStatus !== liveSupabaseStep.label) {
      errors.push("latest-run liveSupabaseProofStatus does not match manifest liveSupabaseProof label");
    }
  }

  if (manifest.operationsProofStatus === "materially complete") {
    const requiredPassingSteps = ["bootstrap", "localSmoke", "liveSupabaseProof"];

    for (const key of requiredPassingSteps) {
      if (!manifest.stepStatus[key]?.succeeded) {
        errors.push(`materially complete evidence requires ${key} to be successful`);
      }
    }
  }

  if (manifest.operationsProofStatus.includes("automation-only") && manifest.stepStatus.liveSupabaseProof?.succeeded) {
    errors.push("automation-only evidence cannot claim a successful live Supabase proof");
  }

  return {
    ok: errors.length === 0,
    errors
  };
}
