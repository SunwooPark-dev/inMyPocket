import type { ReleaseHealthSummary } from "./ops-evidence.ts";

export type ExternalBlocker = {
  key: string;
  title: string;
  detail: string;
  unblockRequirement: string;
  severity: "high" | "medium";
};

export function getExternalBlockers(releaseHealth: ReleaseHealthSummary | null) {
  const blockers: ExternalBlocker[] = [];

  if (!releaseHealth || releaseHealth.hostedObservationStatus !== "observed-hosted") {
    blockers.push({
      key: "hosted-proof",
      title: "Real hosted proof is still unobserved",
      detail: "The current proof scope is local-only or local-simulated. No real GitHub-hosted artifact has been confirmed from this workspace.",
      unblockRequirement: "Provide the matching GitHub repo / PR / workflow run so the hosted artifact can be observed.",
      severity: "high"
    });
  }

  if (!releaseHealth || releaseHealth.paymentStatus === "deferred") {
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
