import { ANCHOR_BASKET } from "./catalog.ts";
import { calculateSelectedPrice } from "./compare.ts";
import type { PriceObservation } from "./domain.ts";
import {
  isGovernedObservationFresh,
  isPublicObservationEligible,
  observationKey,
  type GovernedPublicObservation
} from "./observation-feed.ts";

export type OperatorObservationQueueState =
  | "missing_evidence"
  | "ambiguous_normalization"
  | "duplicate"
  | "stale"
  | "publication_error";

export type OperatorObservationQueueVisibility = "private_operator_queue";

export type OperatorObservationQueueItem = {
  observation: GovernedPublicObservation;
  states: OperatorObservationQueueState[];
  reasons: string[];
  visibility: OperatorObservationQueueVisibility;
};

export type OperatorObservationQueue = {
  items: OperatorObservationQueueItem[];
};

const AMBIGUOUS_COMPARABILITY_GRADES: PriceObservation["comparabilityGrade"][] = [
  "near-match",
  "estimated-weight",
  "partial",
  "non-comparable"
];

const STATE_LABELS: Record<OperatorObservationQueueState, string> = {
  missing_evidence: "Missing evidence",
  ambiguous_normalization: "Ambiguous normalization",
  duplicate: "Duplicate private key",
  stale: "Stale record",
  publication_error: "Publication metadata error"
};

export function formatOperatorObservationQueueState(state: OperatorObservationQueueState) {
  return STATE_LABELS[state];
}

export function hasAmbiguousNormalization(observation: PriceObservation) {
  const item = ANCHOR_BASKET.find((candidate) => candidate.id === observation.canonicalProductId);

  if (!item) {
    return true;
  }

  if (AMBIGUOUS_COMPARABILITY_GRADES.includes(observation.comparabilityGrade)) {
    return true;
  }

  if (observation.measurementValue <= 0 || observation.priceAmount <= 0) {
    return true;
  }

  try {
    calculateSelectedPrice(observation, item);
    return false;
  } catch {
    return true;
  }
}

export function hasPublicationMetadataError(observation: GovernedPublicObservation, now = new Date()) {
  if (observation.reviewStatus !== "published") {
    return false;
  }

  return !isPublicObservationEligible(observation, now);
}

function buildDuplicateKeyCounts(observations: GovernedPublicObservation[]) {
  const counts = new Map<string, number>();

  observations.forEach((observation) => {
    const key = observationKey(observation);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return counts;
}

export function getOperatorObservationQueueStates(
  observation: GovernedPublicObservation,
  duplicateKeyCounts: Map<string, number>,
  now = new Date()
): OperatorObservationQueueState[] {
  const states: OperatorObservationQueueState[] = [];

  if (!observation.evidenceId || !observation.evidenceOriginalName || !observation.evidenceUploadedAt) {
    states.push("missing_evidence");
  }

  if (hasAmbiguousNormalization(observation)) {
    states.push("ambiguous_normalization");
  }

  if ((duplicateKeyCounts.get(observationKey(observation)) ?? 0) > 1) {
    states.push("duplicate");
  }

  if (!isGovernedObservationFresh(observation, now)) {
    states.push("stale");
  }

  if (hasPublicationMetadataError(observation, now)) {
    states.push("publication_error");
  }

  return states;
}

function reasonsForStates(states: OperatorObservationQueueState[]) {
  return states.map((state) => STATE_LABELS[state]);
}

export function buildOperatorObservationQueue(
  observations: GovernedPublicObservation[],
  now = new Date()
): OperatorObservationQueue {
  const duplicateKeyCounts = buildDuplicateKeyCounts(observations);

  return {
    items: observations.map((observation) => {
      const states = getOperatorObservationQueueStates(observation, duplicateKeyCounts, now);

      return {
        observation,
        states,
        reasons: reasonsForStates(states),
        visibility: "private_operator_queue" as const
      };
    })
  };
}
