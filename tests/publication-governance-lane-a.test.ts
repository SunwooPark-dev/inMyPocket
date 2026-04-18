import test from "node:test";
import assert from "node:assert/strict";

import {
  getGovernedObservationTtlMs,
  isGovernedObservationFresh,
  isPublicObservationEligible,
  observationKey,
  selectGovernedPublicObservations,
  type GovernedPublicObservation
} from "../src/lib/observation-feed.ts";

function makeGovernedObservation(
  overrides: Partial<GovernedPublicObservation> = {}
): GovernedPublicObservation {
  return {
    id: overrides.id ?? "obs-1",
    canonicalProductId: overrides.canonicalProductId ?? "milk",
    retailerId: overrides.retailerId ?? "kroger",
    storeId: overrides.storeId ?? "kroger-30328",
    zipCode: overrides.zipCode ?? "30328",
    channel: overrides.channel ?? "product_page",
    priceType: overrides.priceType ?? "regular",
    priceAmount: overrides.priceAmount ?? 3.79,
    measurementValue: overrides.measurementValue ?? 128,
    measurementUnit: overrides.measurementUnit ?? "floz",
    packLabel: overrides.packLabel ?? "1 gallon",
    comparabilityGrade: overrides.comparabilityGrade ?? "exact",
    sourceUrl: overrides.sourceUrl ?? "https://www.kroger.com/p/milk",
    sourceLabel: overrides.sourceLabel ?? "Official Kroger public web",
    collectedAt: overrides.collectedAt ?? "2026-04-16T12:00:00.000Z",
    confidence: overrides.confidence ?? "high",
    isEstimatedWeight: overrides.isEstimatedWeight ?? false,
    isMembershipRequired: overrides.isMembershipRequired ?? false,
    isCouponRequired: overrides.isCouponRequired ?? false,
    isClubOnly: overrides.isClubOnly ?? false,
    evidenceId: null,
    evidenceOriginalName: null,
    evidenceContentType: null,
    evidenceByteSize: null,
    evidenceUploadedAt: null,
    reviewStatus: "reviewStatus" in overrides ? overrides.reviewStatus : "published",
    approvedAt: "approvedAt" in overrides ? overrides.approvedAt : "2026-04-16T12:10:00.000Z",
    approvedBy: "approvedBy" in overrides ? overrides.approvedBy : "operator@inmypoket.local",
    publishedAt: "publishedAt" in overrides ? overrides.publishedAt : "2026-04-16T12:20:00.000Z",
    publishedSnapshotId:
      "publishedSnapshotId" in overrides ? overrides.publishedSnapshotId : "snapshot-30328-active",
    snapshotIsActive: "snapshotIsActive" in overrides ? overrides.snapshotIsActive : true,
    snapshotCoverageRate: "snapshotCoverageRate" in overrides ? overrides.snapshotCoverageRate : 1,
    retiredAt: "retiredAt" in overrides ? overrides.retiredAt : null,
    invalidatedAt: "invalidatedAt" in overrides ? overrides.invalidatedAt : null,
    notes: overrides.notes
  };
}

test("observationKey remains store + product + priceType scoped", () => {
  const key = observationKey(makeGovernedObservation());
  assert.equal(key, "kroger-30328::milk::regular");
});

test("governed TTL rejects store_call rows and shortens weekly_ad freshness", () => {
  assert.equal(getGovernedObservationTtlMs(makeGovernedObservation({ channel: "store_call" })), null);
  assert.equal(getGovernedObservationTtlMs(makeGovernedObservation({ channel: "weekly_ad" })), 12 * 60 * 60 * 1000);
  assert.equal(getGovernedObservationTtlMs(makeGovernedObservation({ channel: "product_page" })), 24 * 60 * 60 * 1000);
});

test("public eligibility requires approved published rows on an active snapshot", () => {
  const now = new Date("2026-04-16T18:00:00.000Z");

  assert.equal(isPublicObservationEligible(makeGovernedObservation(), now), true);
  assert.equal(
    isPublicObservationEligible(makeGovernedObservation({ reviewStatus: "approved" }), now),
    false
  );
  assert.equal(
    isPublicObservationEligible(makeGovernedObservation({ snapshotIsActive: false }), now),
    false
  );
  assert.equal(
    isPublicObservationEligible(makeGovernedObservation({ approvedBy: null }), now),
    false
  );
  assert.equal(
    isPublicObservationEligible(makeGovernedObservation({ publishedSnapshotId: null }), now),
    false
  );
});

test("public eligibility rejects retired invalidated stale and store_call rows", () => {
  const now = new Date("2026-04-17T18:00:00.000Z");

  assert.equal(
    isPublicObservationEligible(makeGovernedObservation({ retiredAt: "2026-04-16T13:00:00.000Z" }), now),
    false
  );
  assert.equal(
    isPublicObservationEligible(makeGovernedObservation({ invalidatedAt: "2026-04-16T13:00:00.000Z" }), now),
    false
  );
  assert.equal(
    isPublicObservationEligible(makeGovernedObservation({ collectedAt: "2026-04-15T11:59:59.000Z" }), now),
    false
  );
  assert.equal(
    isPublicObservationEligible(makeGovernedObservation({ channel: "store_call" }), now),
    false
  );
});

test("freshness helper applies the governed TTL rules", () => {
  const now = new Date("2026-04-16T18:00:00.000Z");

  assert.equal(
    isGovernedObservationFresh(makeGovernedObservation({ collectedAt: "2026-04-16T07:00:01.000Z" }), now),
    true
  );
  assert.equal(
    isGovernedObservationFresh(makeGovernedObservation({ collectedAt: "2026-04-15T17:59:59.000Z" }), now),
    false
  );
  assert.equal(
    isGovernedObservationFresh(
      makeGovernedObservation({ channel: "weekly_ad", collectedAt: "2026-04-16T05:59:59.000Z" }),
      now
    ),
    false
  );
});

test("governed selector ignores newer unapproved rows and keeps the published active snapshot row", () => {
  const now = new Date("2026-04-16T18:00:00.000Z");
  const approvedPublished = makeGovernedObservation({
    id: "published-1",
    priceAmount: 3.79,
    collectedAt: "2026-04-16T11:00:00.000Z",
    publishedAt: "2026-04-16T12:20:00.000Z"
  });
  const newerButUnapproved = makeGovernedObservation({
    id: "draft-2",
    priceAmount: 4.59,
    collectedAt: "2026-04-16T17:00:00.000Z",
    reviewStatus: "review_required",
    approvedAt: null,
    approvedBy: null,
    publishedAt: null,
    publishedSnapshotId: null
  });

  const selected = selectGovernedPublicObservations([approvedPublished, newerButUnapproved], now);

  assert.equal(selected.length, 1);
  assert.equal(selected[0]?.id, "published-1");
  assert.equal(selected[0]?.priceAmount, 3.79);
});

test("governed selector prefers the latest eligible published row for the same key", () => {
  const now = new Date("2026-04-16T18:00:00.000Z");
  const earlierPublished = makeGovernedObservation({
    id: "published-older",
    priceAmount: 3.79,
    publishedAt: "2026-04-16T12:20:00.000Z"
  });
  const laterPublished = makeGovernedObservation({
    id: "published-newer",
    priceAmount: 3.49,
    publishedAt: "2026-04-16T13:20:00.000Z"
  });

  const selected = selectGovernedPublicObservations([laterPublished, earlierPublished], now);

  assert.equal(selected.length, 1);
  assert.equal(selected[0]?.id, "published-newer");
  assert.equal(selected[0]?.priceAmount, 3.49);
});

test("governed selector rejects under-covered snapshots", () => {
  const now = new Date("2026-04-16T18:00:00.000Z");

  const selected = selectGovernedPublicObservations(
    [makeGovernedObservation({ snapshotCoverageRate: 0.5 })],
    now
  );

  assert.deepEqual(selected, []);
});
