import test from "node:test";
import assert from "node:assert/strict";

import { buildBasketSummary } from "../src/lib/compare.ts";
import {
  buildNearestStoreContext,
  buildNearestStoreSummaryCopy,
  getClusterCoordinates,
  isSupportedPilotZip,
  isValidZipFormat,
  resolveZipRequest
} from "../src/lib/location-context.ts";

test("resolveZipRequest keeps supported ZIPs explicit and flags unsupported or invalid input", () => {
  assert.deepEqual(resolveZipRequest(undefined), {
    pricingZip: "30328",
    invalidZip: null,
    unsupportedZip: null,
    hasExplicitZip: false,
    locationSource: "default_zip"
  });

  assert.equal(resolveZipRequest("30022").pricingZip, "30022");
  assert.equal(resolveZipRequest("30022").locationSource, "url_zip");
  assert.equal(resolveZipRequest("abc").invalidZip, "abc");
  assert.equal(resolveZipRequest("99999").unsupportedZip, "99999");
});

test("ZIP validation helpers preserve the pilot-only contract", () => {
  assert.equal(isValidZipFormat("30328"), true);
  assert.equal(isValidZipFormat("3032"), false);
  assert.equal(isSupportedPilotZip("30328"), true);
  assert.equal(isSupportedPilotZip("30329"), false);
});

test("nearest store context is built separately from cheapest ranking", () => {
  const summaries = buildBasketSummary("30076", "base_regular_total");
  const cheapestStoreIdsBefore = summaries.map((summary) => summary.store.id);
  const nearestContext = buildNearestStoreContext({
    pricingZip: "30076",
    locationSource: "browser_geo",
    distanceSource: "browser-geo",
    summaries,
    origin: {
      latitude: 34.0447,
      longitude: -84.3332
    }
  });

  assert.equal(nearestContext.nearestOverallStore?.id, "walmart-30076");
  assert.equal(nearestContext.nearestOverallDistanceMiles !== null, true);
  assert.deepEqual(
    summaries.map((summary) => summary.store.id),
    cheapestStoreIdsBefore
  );
});

test("cluster coordinates exist for all supported ZIPs", () => {
  const sandySprings = getClusterCoordinates("30328");
  const alpharettaEast = getClusterCoordinates("30022");

  assert.equal(typeof sandySprings.latitude, "number");
  assert.equal(typeof sandySprings.longitude, "number");
  assert.equal(typeof alpharettaEast.latitude, "number");
  assert.equal(typeof alpharettaEast.longitude, "number");
});

test("nearest store summary copy distinguishes same-store and split-store outcomes", () => {
  const sameStoreCopy = buildNearestStoreSummaryCopy({
    nearestStoreName: "Kroger",
    nearestDistanceMiles: 1.2,
    cheapestStoreName: "Kroger",
    savingsAmount: 0,
    nearestMatchesCheapest: true,
    nearestHasPublishableBasket: true,
    locationSource: "default_zip"
  });
  const splitStoreCopy = buildNearestStoreSummaryCopy({
    nearestStoreName: "Walmart",
    nearestDistanceMiles: 2.3,
    cheapestStoreName: "Kroger",
    savingsAmount: 4.15,
    nearestMatchesCheapest: false,
    nearestHasPublishableBasket: true,
    locationSource: "browser_geo"
  });
  const unpublishedNearestCopy = buildNearestStoreSummaryCopy({
    nearestStoreName: "Closest Walmart",
    nearestDistanceMiles: 1.1,
    cheapestStoreName: "Kroger",
    savingsAmount: 0,
    nearestMatchesCheapest: false,
    nearestHasPublishableBasket: false,
    locationSource: "default_zip"
  });

  assert.match(sameStoreCopy.detail, /closest store is also the cheapest/i);
  assert.match(splitStoreCopy.detail, /saving about \$4\.15/i);
  assert.match(splitStoreCopy.detail, /current location/i);
  assert.match(unpublishedNearestCopy.detail, /does not have a publishable basket today/i);
});

test("nearest store context can point to a tracked store even when summaries are missing it", () => {
  const allSummaries = buildBasketSummary("30328", "base_regular_total");
  const nearestStoreId = "aldi-30328";
  const filteredSummaries = allSummaries.filter((summary) => summary.store.id !== nearestStoreId);

  const nearestContext = buildNearestStoreContext({
    pricingZip: "30328",
    locationSource: "browser_geo",
    distanceSource: "browser-geo",
    summaries: filteredSummaries,
    origin: {
      latitude: 33.928061,
      longitude: -84.380147
    }
  });

  assert.equal(nearestContext.nearestOverallStore?.id, nearestStoreId);
  assert.equal(filteredSummaries.some((summary) => summary.store.id === nearestStoreId), false);
});
