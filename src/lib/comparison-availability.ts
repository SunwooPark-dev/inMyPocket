import type { PilotCluster } from "./domain.ts";

export type ComparisonUnavailableReason =
  | "no-published-data-for-this-zip"
  | "runtime-config-or-fetch-failure";

export function buildComparisonUnavailableState(input: {
  reason: ComparisonUnavailableReason;
  zipCode: string;
  cluster: PilotCluster | null;
  errorMessage?: string | null;
}) {
  const areaLabel = input.cluster ? `${input.cluster.label} (${input.zipCode})` : input.zipCode;

  if (input.reason === "runtime-config-or-fetch-failure") {
    return {
      title: `We can’t load ${areaLabel} right now`,
      detail:
        "The basket service could not load the current published comparison. Please try again in a little while.",
      helper:
        input.errorMessage && input.errorMessage.length > 0
          ? `Technical detail: ${input.errorMessage}`
          : "This is a runtime loading issue, not a pricing recommendation."
    };
  }

  return {
    title: `We do not have a published basket for ${areaLabel} yet`,
    detail:
      "Today’s comparison is temporarily unavailable for this area because no governed published basket is ready yet.",
    helper:
      "Try another pilot ZIP, check back later, or sign up for weekly updates so we can share the next verified basket."
  };
}
