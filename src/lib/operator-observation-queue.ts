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

export type OperatorObservationQueueSummary = {
  totalItems: number;
  warningItems: number;
  clearItems: number;
  stateCounts: Record<OperatorObservationQueueState, number>;
  priorityStates: OperatorObservationQueueState[];
};

export type OperatorObservationQueueNextActionPriority = "now" | "later";

export type OperatorObservationQueueNextAction = {
  key:
    | "attach-evidence"
    | "review-normalization"
    | "resolve-duplicates"
    | "refresh-stale-records"
    | "repair-publication-metadata"
    | "monitor-private-queue"
    | "save-first-observation";
  label: string;
  title: string;
  detail: string;
  priority: OperatorObservationQueueNextActionPriority;
  state: OperatorObservationQueueState | null;
  count: number;
};

const QUEUE_STATE_ORDER: OperatorObservationQueueState[] = [
  "missing_evidence",
  "ambiguous_normalization",
  "duplicate",
  "stale",
  "publication_error"
];

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

const NEXT_ACTION_BY_STATE: Record<
  OperatorObservationQueueState,
  Omit<OperatorObservationQueueNextAction, "state" | "count">
> = {
  missing_evidence: {
    key: "attach-evidence",
    label: "Attach missing evidence",
    title: "Attach evidence before publication",
    detail: "One or more private observations are missing evidence metadata.",
    priority: "now"
  },
  ambiguous_normalization: {
    key: "review-normalization",
    label: "Review normalization",
    title: "Review ambiguous normalization",
    detail: "One or more private observations may not normalize cleanly into the basket.",
    priority: "now"
  },
  duplicate: {
    key: "resolve-duplicates",
    label: "Resolve duplicates",
    title: "Resolve duplicate private keys",
    detail: "One or more private observations share the same publication key.",
    priority: "now"
  },
  stale: {
    key: "refresh-stale-records",
    label: "Refresh stale records",
    title: "Refresh stale private observations",
    detail: "One or more private observations are outside the freshness window.",
    priority: "now"
  },
  publication_error: {
    key: "repair-publication-metadata",
    label: "Repair publication metadata",
    title: "Repair publication metadata",
    detail: "One or more published observations do not satisfy public eligibility metadata.",
    priority: "now"
  }
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

export function summarizeOperatorObservationQueue(
  queue: OperatorObservationQueue
): OperatorObservationQueueSummary {
  const stateCounts = Object.fromEntries(QUEUE_STATE_ORDER.map((state) => [state, 0])) as Record<
    OperatorObservationQueueState,
    number
  >;
  let warningItems = 0;

  queue.items.forEach((item) => {
    if (item.states.length > 0) {
      warningItems += 1;
    }

    item.states.forEach((state) => {
      stateCounts[state] += 1;
    });
  });

  const priorityStates = QUEUE_STATE_ORDER.filter((state) => stateCounts[state] > 0)
    .sort((left, right) => stateCounts[right] - stateCounts[left])
    .slice(0, 3);

  return {
    totalItems: queue.items.length,
    warningItems,
    clearItems: queue.items.length - warningItems,
    stateCounts,
    priorityStates
  };
}

export function getOperatorObservationQueueNextAction(
  summary: OperatorObservationQueueSummary
): OperatorObservationQueueNextAction {
  if (summary.totalItems === 0) {
    return {
      key: "save-first-observation",
      label: "Save first observation",
      title: "No private observations yet",
      detail: "Saved manual observations will appear in the private operator queue.",
      priority: "later",
      state: null,
      count: 0
    };
  }

  if (summary.warningItems === 0) {
    return {
      key: "monitor-private-queue",
      label: "Monitor private queue",
      title: "No local queue warnings",
      detail: "Recent stored observations have no local private-queue warnings.",
      priority: "later",
      state: null,
      count: 0
    };
  }

  const state = summary.priorityStates[0];

  if (!state) {
    return {
      key: "monitor-private-queue",
      label: "Monitor private queue",
      title: "No local queue warnings",
      detail: "Recent stored observations have no local private-queue warnings.",
      priority: "later",
      state: null,
      count: 0
    };
  }

  return {
    ...NEXT_ACTION_BY_STATE[state],
    state,
    count: summary.stateCounts[state]
  };
}
