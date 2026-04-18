import type { HostedProofObservation, ReleaseHealthSummary } from "./ops-evidence.ts";

export type ExternalBlocker = {
  key: string;
  title: string;
  detail: string;
  unblockRequirement: string;
  severity: "high" | "medium";
};

export function getExternalBlockers(
  releaseHealth: ReleaseHealthSummary | null,
  hostedProofObservation: HostedProofObservation | null = null
) {
  const blockers: ExternalBlocker[] = [];

  if (!releaseHealth || releaseHealth.hostedObservationStatus !== "observed-hosted") {
    const detail = hostedProofObservation?.summary
      ? `The current proof scope is local-only or local-simulated. ${hostedProofObservation.summary}`
      : "The current proof scope is local-only or local-simulated. No real GitHub-hosted artifact has been confirmed from this workspace.";
    const unblockRequirement = hostedProofObservation?.requiredNextInputs?.length
      ? hostedProofObservation.requiredNextInputs.join(" ; ")
      : "Provide the matching GitHub repo / PR / workflow run so the hosted artifact can be observed.";
    blockers.push({
      key: "hosted-proof",
      title: "Real hosted proof is still unobserved",
      detail,
      unblockRequirement,
      severity: "high"
    });
  }

  if (releaseHealth?.paymentStatus === "deferred") {
    blockers.push({
      key: "payment-proof",
      title: "Payment proof is externally blocked",
      detail: "Stripe proof remains outside the current merge gate.",
      unblockRequirement: "Provide STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and STRIPE_PRICE_ID_FOUNDING_MEMBER.",
      severity: "high"
    });
  }

  return blockers;
}
