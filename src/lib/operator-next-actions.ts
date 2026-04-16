import type { ReleaseHealthSummary } from "./ops-evidence.ts";

export type OperatorNextAction = {
  key: string;
  title: string;
  reason: string;
  commands: string[];
  priority: "now" | "next" | "later";
};

export function getOperatorNextActions(releaseHealth: ReleaseHealthSummary | null) {
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

  if (releaseHealth.visualRegressionStatus !== "green") {
    actions.push({
      key: "refresh-visual",
      title: "Refresh visual advisory",
      reason: "Visual drift is not currently green.",
      commands: ["pnpm visual:check", "pnpm ops:verify"],
      priority: "next"
    });
  }

  if (releaseHealth.hostedObservationStatus !== "observed-hosted") {
    actions.push({
      key: "observe-hosted",
      title: "Observe a real hosted CI run",
      reason: "The current proof scope is still local-only or local-simulated.",
      commands: ["Push or open a PR to trigger GitHub Actions", "Inspect uploaded .ops-evidence artifacts"],
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
