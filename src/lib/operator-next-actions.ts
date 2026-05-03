import type { HostedProofObservation, ReleaseHealthSummary } from "./ops-evidence.ts";

export type OperatorNextAction = {
  key: string;
  title: string;
  reason: string;
  commands: string[];
  priority: "now" | "next" | "later";
};

export function getOperatorNextActions(
  releaseHealth: ReleaseHealthSummary | null,
  hostedProofObservation: HostedProofObservation | null = null
) {
  const actions: OperatorNextAction[] = [];

  if (!releaseHealth) {
    actions.push({
      key: "bootstrap-proof",
      title: "Generate the first operator proof bundle",
      reason: "No canonical release-health verdict exists yet in this runtime.",
      commands: ["pnpm ops:evidence", "pnpm ops:verify"],
      priority: "now"
    });
    return actions;
  }

  if (releaseHealth.freshnessStatus === "stale") {
    actions.push({
      key: "refresh-proof",
      title: "Refresh stale operator proof",
      reason: "A newer upstream artifact exists than the current canonical verification snapshot.",
      commands: ["pnpm ops:evidence", "pnpm ops:verify"],
      priority: "now"
    });
  }

  if (releaseHealth.proofLevel === "failed" || releaseHealth.verdict === "red") {
    actions.push({
      key: "repair-local-proof",
      title: "Repair the local operator proof lane",
      reason:
        "The latest canonical verification snapshot is red. Restore the local app/runtime prerequisites, then rerun the operator proof so hosted follow-up does not mask a current local failure.",
      commands: ["pnpm dev", "pnpm ops:evidence", "pnpm ops:verify"],
      priority: "now"
    });
  }

  if (releaseHealth.visualRegressionStatus !== "green") {
    actions.push({
      key: "refresh-visual",
      title: "Refresh visual advisory",
      reason: "Visual drift is not currently green.",
      commands: ["pnpm visual:check", "pnpm ops:verify"],
      priority: "next"
    });
  }

  if (releaseHealth.liveSupabaseProofStatus !== "passed") {
    actions.push({
      key: "harden-published-view",
      title: "Close Supabase direct-grant boundary",
      reason:
        `Live Supabase proof is ${releaseHealth.liveSupabaseProofStatus}. The active contract requires server-owned public reads and no direct publishable-key governed-row access.`,
      commands: [
        "pnpm ops:harden-published-view",
        "pnpm ops:harden-published-view:apply",
        "pnpm smoke:local -SkipPayment",
        "pnpm ops:evidence",
        "pnpm ops:verify"
      ],
      priority: "now"
    });
  }

  if (releaseHealth.hostedObservationStatus !== "observed-hosted") {
    const reason = hostedProofObservation?.summary
      ? `The current proof scope is still local-only or local-simulated. ${hostedProofObservation.summary}`
      : "The current proof scope is still local-only or local-simulated.";
    const commands = hostedProofObservation?.requiredNextInputs?.length
      ? (hostedProofObservation.recommendedCommandSet?.length
          ? hostedProofObservation.recommendedCommandSet
          : hostedProofObservation.requiredNextInputs)
      : ["Push or open a PR to trigger GitHub Actions", "Inspect uploaded .ops-evidence artifacts"];
    actions.push({
      key: "observe-hosted",
      title: "Observe a real hosted CI run",
      reason,
      commands,
      priority: "next"
    });
  }

  if (releaseHealth.paymentStatus === "deferred") {
    actions.push({
      key: "reopen-payment",
      title: "Reopen payment proof",
      reason: "Payment remains intentionally outside the current merge gate until Stripe test-mode secrets exist.",
      commands: [
        "Provide STRIPE_SECRET_KEY",
        "Provide STRIPE_WEBHOOK_SECRET",
        "Provide STRIPE_PRICE_ID_FOUNDING_MEMBER"
      ],
      priority: "later"
    });
  }

  if (actions.length === 0) {
    actions.push({
      key: "monitor-state",
      title: "Monitor the current local milestone",
      reason: "Local non-payment proof is current and no immediate local action is required.",
      commands: ["pnpm smoke:local -SkipPayment", "pnpm ops:verify"],
      priority: "later"
    });
  }

  return actions;
}
