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

  if (releaseHealth && releaseHealth.liveSupabaseProofStatus !== "passed") {
    blockers.push({
      key: "supabase-direct-grant",
      title: "Supabase direct-grant boundary is not passed",
      detail:
        `Live Supabase proof is ${releaseHealth.liveSupabaseProofStatus}. Public basket reads must stay server-side, and publishable-key direct reads must be denied or return zero governed rows.`,
      unblockRequirement:
        "Run pnpm ops:harden-published-view, then pnpm ops:harden-published-view:apply from a linked Supabase environment, followed by pnpm smoke:local -SkipPayment.",
      severity: "high"
    });
  }


  return blockers;
}
