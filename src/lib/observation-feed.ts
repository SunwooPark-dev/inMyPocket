import { DEMO_OBSERVATIONS } from "./demo-data.ts";
import { readPublicStoredObservations, readStoredObservations } from "./observation-repository.ts";
import type { PriceObservation } from "./domain.ts";

export type ObservationReviewStatus =
  | "draft"
  | "review_required"
  | "approved"
  | "published"
  | "retired"
  | "invalidated";

export type GovernedPublicObservation = PriceObservation & {
  reviewStatus?: ObservationReviewStatus | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  publishedAt?: string | null;
  publishedSnapshotId?: string | null;
  snapshotIsActive?: boolean | null;
  snapshotCoverageRate?: number | null;
  retiredAt?: string | null;
  invalidatedAt?: string | null;
};

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const MINIMUM_PUBLIC_SNAPSHOT_COVERAGE = 0.8;

export function observationKey(
  observation: Pick<PriceObservation, "storeId" | "canonicalProductId" | "priceType">
) {
  return `${observation.storeId}::${observation.canonicalProductId}::${observation.priceType}`;
}

export function mergeObservations(
  seededObservations: PriceObservation[],
  storedObservations: PriceObservation[]
) {
  const merged = new Map<string, PriceObservation>();

  seededObservations.forEach((observation) => {
    merged.set(observationKey(observation), observation);
  });

  storedObservations
    .slice()
    .sort(
      (left, right) =>
        new Date(left.collectedAt).getTime() - new Date(right.collectedAt).getTime()
    )
    .forEach((observation) => {
      merged.set(observationKey(observation), observation);
    });

  return Array.from(merged.values());
}

function isWeeklyAdObservation(observation: Pick<PriceObservation, "channel" | "priceType">) {
  return observation.channel === "weekly_ad" || observation.priceType === "weekly_ad";
}

export function getGovernedObservationTtlMs(
  observation: Pick<PriceObservation, "channel" | "priceType">
) {
  if (observation.channel === "store_call") {
    return null;
  }

  return isWeeklyAdObservation(observation) ? TWELVE_HOURS_MS : TWENTY_FOUR_HOURS_MS;
}

export function isGovernedObservationFresh(
  observation: Pick<PriceObservation, "channel" | "priceType" | "collectedAt">,
  now = new Date()
) {
  const ttlMs = getGovernedObservationTtlMs(observation);

  if (ttlMs === null) {
    return false;
  }

  const collectedAtMs = new Date(observation.collectedAt).getTime();

  if (Number.isNaN(collectedAtMs)) {
    return false;
  }

  return now.getTime() - collectedAtMs <= ttlMs;
}

export function isPublicObservationEligible(
  observation: GovernedPublicObservation,
  now = new Date()
) {
  if (observation.reviewStatus !== "published") {
    return false;
  }

  if (!observation.approvedAt || !observation.approvedBy) {
    return false;
  }

  if (!observation.publishedAt || !observation.publishedSnapshotId) {
    return false;
  }

  if (observation.snapshotIsActive !== true) {
    return false;
  }

  if (
    typeof observation.snapshotCoverageRate === "number" &&
    observation.snapshotCoverageRate < MINIMUM_PUBLIC_SNAPSHOT_COVERAGE
  ) {
    return false;
  }

  if (observation.retiredAt || observation.invalidatedAt) {
    return false;
  }

  if (observation.channel === "store_call") {
    return false;
  }

  return isGovernedObservationFresh(observation, now);
}

function governedPublicSortValue(observation: GovernedPublicObservation) {
  const publishedAtMs = observation.publishedAt ? new Date(observation.publishedAt).getTime() : 0;
  const collectedAtMs = new Date(observation.collectedAt).getTime();
  return Number.isNaN(publishedAtMs) ? collectedAtMs : publishedAtMs;
}

export function selectGovernedPublicObservations(
  observations: GovernedPublicObservation[],
  now = new Date()
) {
  const merged = new Map<string, GovernedPublicObservation>();

  observations
    .filter((observation) => isPublicObservationEligible(observation, now))
    .slice()
    .sort((left, right) => governedPublicSortValue(left) - governedPublicSortValue(right))
    .forEach((observation) => {
      merged.set(observationKey(observation), observation);
    });

  return Array.from(merged.values()) as PriceObservation[];
}

export async function getEffectiveObservations() {
  const stored = await readStoredObservations();
  return mergeObservations(DEMO_OBSERVATIONS, stored);
}

export async function getPublicEffectiveObservations() {
  const stored = await readPublicStoredObservations();
  return selectGovernedPublicObservations(stored);
}

export async function getRecentStoredObservations(limit = 12) {
  const stored = await readStoredObservations();
  return stored
    .slice()
    .sort(
      (left, right) =>
        new Date(right.collectedAt).getTime() - new Date(left.collectedAt).getTime()
    )
    .slice(0, limit);
}
