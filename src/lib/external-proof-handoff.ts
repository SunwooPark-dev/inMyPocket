import type { HostedProofObservation, ReleaseHealthSummary } from "./ops-evidence.ts";

export type ExternalProofHandoffItem = {
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
};

export function getExternalProofHandoff(
  releaseHealth: ReleaseHealthSummary | null,
  hostedProofObservation: HostedProofObservation | null = null
) {
  const items: ExternalProofHandoffItem[] = [];

  if (!releaseHealth || releaseHealth.hostedObservationStatus !== "observed-hosted") {
    const blocker = hostedProofObservation?.summary
      ? hostedProofObservation.summary
      : "No matching GitHub-hosted run/artifact has been observed for this workspace.";
    const requiredInputs = hostedProofObservation?.requiredNextInputs?.length
      ? hostedProofObservation.requiredNextInputs
      : [
          "Matching GitHub repository",
          "PR or push that triggers the hosted workflow",
          "Workflow run link or artifact link"
        ];
    items.push({
      key: "hosted-proof",
      title: "Hosted proof handoff",
      blocker,
      requiredInputs,
      expectedOutputs: [
        "Observed hosted CI run",
        "Uploaded .ops-evidence artifact",
        "Hosted attestation that is not local-simulated"
      ],
      repo: hostedProofObservation?.repo,
      branch: hostedProofObservation?.branch,
      localHead: hostedProofObservation?.localHead,
      remoteHead: hostedProofObservation?.branchTracking?.remoteHead,
      workflowPath: hostedProofObservation?.remoteWorkflow?.path,
      workflowName: hostedProofObservation?.localWorkflow?.name,
      artifactName: hostedProofObservation?.artifactName,
      preferredInputOrder: hostedProofObservation?.preferredInputOrder,
      recommendedCommandSet: hostedProofObservation?.recommendedCommandSet
    });
  }

  if (releaseHealth?.paymentStatus === "deferred") {
    items.push({
      key: "payment-proof",
      title: "Payment proof handoff",
      blocker: "Stripe proof remains outside the current merge gate.",
      requiredInputs: [
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_PRICE_ID_FOUNDING_MEMBER"
      ],
      expectedOutputs: [
        "Checkout start proof",
        "Webhook receipt proof",
        "Signup reconciliation proof"
      ]
    });
  }

  return items;
}
