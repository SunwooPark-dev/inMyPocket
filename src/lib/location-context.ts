import { PILOT_CLUSTERS, STORES } from "./catalog.ts";
import type {
  BasketSummary,
  Coordinates,
  LocationSource,
  NearestStoreContext,
  StoreLocation,
  StoreDistanceContext,
  ZipResolutionResult
} from "./domain";

const DEFAULT_PILOT_ZIP = "30328";
const ZIP_PATTERN = /^\d{5}$/;

export const LOCATION_MEMORY_KEYS = {
  selectedZip: "inmypoket.selectedZip",
  locationMode: "inmypoket.locationMode"
} as const;

export function isValidZipFormat(value: string | undefined) {
  return typeof value === "string" && ZIP_PATTERN.test(value.trim());
}

export function isSupportedPilotZip(value: string | undefined) {
  return PILOT_CLUSTERS.some((cluster) => cluster.zipCode === value?.trim());
}

export function getPilotClusterByZip(zipCode: string) {
  return PILOT_CLUSTERS.find((cluster) => cluster.zipCode === zipCode) ?? null;
}

export function resolveZipRequest(requestedZip: string | undefined): ZipResolutionResult {
  const normalizedZip = requestedZip?.trim() ?? "";

  if (!normalizedZip) {
    return {
      pricingZip: DEFAULT_PILOT_ZIP,
      invalidZip: null,
      unsupportedZip: null,
      hasExplicitZip: false,
      locationSource: "default_zip"
    };
  }

  if (!isValidZipFormat(normalizedZip)) {
    return {
      pricingZip: DEFAULT_PILOT_ZIP,
      invalidZip: normalizedZip,
      unsupportedZip: null,
      hasExplicitZip: true,
      locationSource: "default_zip"
    };
  }

  if (!isSupportedPilotZip(normalizedZip)) {
    return {
      pricingZip: DEFAULT_PILOT_ZIP,
      invalidZip: null,
      unsupportedZip: normalizedZip,
      hasExplicitZip: true,
      locationSource: "default_zip"
    };
  }

  return {
    pricingZip: normalizedZip,
    invalidZip: null,
    unsupportedZip: null,
    hasExplicitZip: true,
    locationSource: "url_zip"
  };
}

export function getClusterCoordinates(zipCode: string): Coordinates {
  const cluster = getPilotClusterByZip(zipCode) ?? getPilotClusterByZip(DEFAULT_PILOT_ZIP);

  if (!cluster) {
    throw new Error(`Missing pilot cluster for ZIP ${zipCode}`);
  }

  return {
    latitude: cluster.latitude,
    longitude: cluster.longitude
  };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceMiles(origin: Coordinates, destination: Coordinates) {
  const earthRadiusMiles = 3958.8;
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return Math.round(earthRadiusMiles * angularDistance * 10) / 10;
}

export function buildStoreDistanceContexts(
  stores: StoreLocation[],
  origin: Coordinates
): StoreDistanceContext[] {
  return stores
    .filter((store) => store.isActive)
    .map((store) => ({
      storeId: store.id,
      retailerId: store.retailerId,
      distanceMiles: calculateDistanceMiles(origin, {
        latitude: store.latitude,
        longitude: store.longitude
      })
    }))
    .sort(
      (left, right) =>
        (left.distanceMiles ?? Number.MAX_SAFE_INTEGER) -
        (right.distanceMiles ?? Number.MAX_SAFE_INTEGER)
    );
}

export function buildNearestStoreContext(args: {
  pricingZip: string;
  locationSource: LocationSource;
  distanceSource: "zip-centroid" | "browser-geo";
  summaries: BasketSummary[];
  origin: Coordinates;
}): NearestStoreContext {
  const storesForZip = STORES.filter((store) => store.zipCode === args.pricingZip);
  const distances = buildStoreDistanceContexts(storesForZip, args.origin);
  const nearestEntry = distances[0] ?? null;
  const nearestStore =
    storesForZip.find((store) => store.id === nearestEntry?.storeId) ?? null;

  return {
    pricingZip: args.pricingZip,
    locationSource: args.locationSource,
    distanceSource: args.distanceSource,
    nearestOverallStore: nearestStore,
    nearestOverallDistanceMiles: nearestEntry?.distanceMiles ?? null,
    distancesByStoreId: Object.fromEntries(
      distances.map((entry) => [entry.storeId, entry.distanceMiles])
    )
  };
}

export function buildNearestStoreSummaryCopy(args: {
  nearestStoreName: string;
  nearestDistanceMiles: number | null;
  cheapestStoreName: string;
  savingsAmount: number;
  nearestMatchesCheapest: boolean;
  nearestHasPublishableBasket: boolean;
  locationSource: LocationSource;
}) {
  const distanceLabel =
    args.nearestDistanceMiles === null ? "" : ` about ${args.nearestDistanceMiles.toFixed(1)} miles away`;
  const sourceLabel =
    args.locationSource === "browser_geo"
      ? "Using your current location."
      : "Using your ZIP area.";
  const headline = `${args.nearestStoreName} is the closest tracked store${distanceLabel}.`;

  if (args.nearestMatchesCheapest) {
    return {
      headline,
      detail: `${sourceLabel} The closest store is also the cheapest option today.`
    };
  }

  if (!args.nearestHasPublishableBasket) {
    return {
      headline,
      detail: `${sourceLabel} This closest tracked store does not have a publishable basket today, so the cheapest available basket is at ${args.cheapestStoreName}.`
    };
  }

  return {
    headline,
    detail: `${sourceLabel} The cheapest basket today is at ${args.cheapestStoreName}, saving about $${args.savingsAmount.toFixed(2)}.`
  };
}
