import type { ReleaseHealthSummary } from "./ops-evidence.ts";

export type ExternalProofHandoffItem = {
  key: string;
  title: string;
  blocker: string;
  requiredInputs: string[];
  expectedOutputs: string[];
};

export function getExternalProofHandoff(releaseHealth: ReleaseHealthSummary | null) {
  const items: ExternalProofHandoffItem[] = [];

  if (!releaseHealth || releaseHealth.hostedObservationStatus !== "observed-hosted") {
    items.push({
      key: "hosted-proof",
      title: "Hosted proof handoff",
      blocker: "No matching GitHub-hosted run/artifact has been observed for this workspace.",
      requiredInputs: [
        "Matching GitHub repository",
        "PR or push that triggers the hosted workflow",
        "Workflow run link or artifact link"
      ],
      expectedOutputs: [
        "Observed hosted CI run",
        "Uploaded .ops-evidence artifact",
        "Hosted attestation that is not local-simulated"
      ]
    });
  }

  if (!releaseHealth || releaseHealth.paymentStatus === "deferred") {
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
