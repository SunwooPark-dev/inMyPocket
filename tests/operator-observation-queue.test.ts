import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOperatorObservationQueue,
  type OperatorObservationQueueItem
} from "../src/lib/operator-observation-queue.ts";
import { mapStoredObservationRecord } from "../src/lib/observation-repository.ts";
import {
  observationKey,
  selectGovernedPublicObservations,
  type GovernedPublicObservation
} from "../src/lib/observation-feed.ts";

function makeObservation(overrides: Partial<GovernedPublicObservation> = {}): GovernedPublicObservation {
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
    collectedAt: overrides.collectedAt ?? "2026-04-17T12:00:00.000Z",
    confidence: overrides.confidence ?? "high",
    isEstimatedWeight: overrides.isEstimatedWeight ?? false,
    isMembershipRequired: overrides.isMembershipRequired ?? false,
    isCouponRequired: overrides.isCouponRequired ?? false,
    isClubOnly: overrides.isClubOnly ?? false,
    evidenceId: "evidenceId" in overrides ? overrides.evidenceId : "evidence-1",
    evidenceOriginalName:
      "evidenceOriginalName" in overrides ? overrides.evidenceOriginalName : "receipt.png",
    evidenceContentType:
      "evidenceContentType" in overrides ? overrides.evidenceContentType : "image/png",
    evidenceByteSize: "evidenceByteSize" in overrides ? overrides.evidenceByteSize : 1024,
    evidenceUploadedAt:
      "evidenceUploadedAt" in overrides ? overrides.evidenceUploadedAt : "2026-04-17T12:05:00.000Z",
    reviewStatus: "reviewStatus" in overrides ? overrides.reviewStatus : "review_required",
    approvedAt: "approvedAt" in overrides ? overrides.approvedAt : null,
    approvedBy: "approvedBy" in overrides ? overrides.approvedBy : null,
    publishedAt: "publishedAt" in overrides ? overrides.publishedAt : null,
    publishedSnapshotId: "publishedSnapshotId" in overrides ? overrides.publishedSnapshotId : null,
    snapshotIsActive: "snapshotIsActive" in overrides ? overrides.snapshotIsActive : null,
    snapshotCoverageRate: "snapshotCoverageRate" in overrides ? overrides.snapshotCoverageRate : null,
    retiredAt: "retiredAt" in overrides ? overrides.retiredAt : null,
    invalidatedAt: "invalidatedAt" in overrides ? overrides.invalidatedAt : null,
    notes: overrides.notes
  };
}

function statesById(items: OperatorObservationQueueItem[]) {
  return Object.fromEntries(items.map((item) => [item.observation.id, item.states]));
}

test("operator observation queue exposes private diagnostics without publishing private saves", () => {
  const now = new Date("2026-04-17T18:00:00.000Z");
  const missingEvidence = makeObservation({
    id: "missing-evidence",
    storeId: "kroger-30328",
    canonicalProductId: "milk",
    evidenceId: null,
    evidenceOriginalName: null,
    evidenceContentType: null,
    evidenceByteSize: null,
    evidenceUploadedAt: null
  });
  const ambiguousNormalization = makeObservation({
    id: "ambiguous-normalization",
    storeId: "aldi-30328",
    canonicalProductId: "apples",
    measurementValue: 48,
    measurementUnit: "oz",
    packLabel: "3 lb bag",
    comparabilityGrade: "partial",
    notes: "Package size may not match canonical loose apple normalization."
  });
  const duplicateOlder = makeObservation({
    id: "duplicate-older",
    storeId: "walmart-30328",
    collectedAt: "2026-04-17T10:00:00.000Z"
  });
  const duplicateNewer = makeObservation({
    id: "duplicate-newer",
    storeId: "walmart-30328",
    collectedAt: "2026-04-17T11:00:00.000Z"
  });
  const stale = makeObservation({
    id: "stale",
    storeId: "kroger-30328",
    canonicalProductId: "eggs",
    measurementValue: 12,
    measurementUnit: "egg",
    packLabel: "12 ct",
    collectedAt: "2026-04-16T17:59:59.000Z"
  });
  const publicationError = makeObservation({
    id: "publication-error",
    storeId: "aldi-30328",
    canonicalProductId: "bread",
    measurementValue: 20,
    measurementUnit: "oz",
    packLabel: "20 oz loaf",
    reviewStatus: "published",
    approvedAt: "2026-04-17T12:10:00.000Z",
    approvedBy: "operator@inmypoket.local",
    publishedAt: null,
    publishedSnapshotId: null,
    snapshotIsActive: true,
    snapshotCoverageRate: 1
  });
  const danglingEvidence = makeObservation({
    id: "dangling-evidence",
    storeId: "publix-30328",
    canonicalProductId: "bananas",
    measurementValue: 1,
    measurementUnit: "lb",
    packLabel: "1 lb",
    evidenceId: "evidence-missing-from-store",
    evidenceOriginalName: null,
    evidenceContentType: null,
    evidenceByteSize: null,
    evidenceUploadedAt: null
  });

  assert.equal(observationKey(duplicateOlder), observationKey(duplicateNewer));

  const observations = [
    missingEvidence,
    ambiguousNormalization,
    duplicateOlder,
    duplicateNewer,
    stale,
    publicationError,
    danglingEvidence
  ];
  const queue = buildOperatorObservationQueue(observations, now);
  const byId = statesById(queue.items);

  assert.deepEqual(byId["missing-evidence"], ["missing_evidence"]);
  assert.deepEqual(byId["ambiguous-normalization"], ["ambiguous_normalization"]);
  assert.deepEqual(byId["duplicate-older"], ["duplicate"]);
  assert.deepEqual(byId["duplicate-newer"], ["duplicate"]);
  assert.deepEqual(byId["stale"], ["stale"]);
  assert.deepEqual(byId["publication-error"], ["publication_error"]);
  assert.deepEqual(byId["dangling-evidence"], ["missing_evidence"]);
  assert.equal(queue.items.every((item) => item.visibility === "private_operator_queue"), true);
  assert.deepEqual(selectGovernedPublicObservations(observations, now), []);
});

test("stored observation mapper preserves private governance metadata for operator queue", () => {
  const mapped = mapStoredObservationRecord({
    id: "stored-publication-error",
    canonical_product_id: "bread",
    retailer_id: "aldi",
    store_id: "aldi-30328",
    zip_code: "30328",
    channel: "product_page",
    price_type: "regular",
    price_amount: 2.49,
    measurement_value: 20,
    measurement_unit: "oz",
    pack_label: "20 oz loaf",
    comparability_grade: "exact",
    source_url: "https://www.aldi.us/bread",
    source_label: "Official Aldi public web",
    collected_at: "2026-04-17T12:00:00.000Z",
    confidence: "high",
    is_estimated_weight: false,
    is_membership_required: false,
    is_coupon_required: false,
    is_club_only: false,
    evidence_id: "evidence-1",
    review_status: "published",
    approved_at: "2026-04-17T12:10:00.000Z",
    approved_by: "operator@inmypoket.local",
    published_at: null,
    published_snapshot_id: null,
    snapshot_is_active: true,
    snapshot_coverage_rate: 1,
    retired_at: null,
    invalidated_at: null
  });

  assert.equal(mapped.reviewStatus, "published");
  assert.equal(mapped.approvedAt, "2026-04-17T12:10:00.000Z");
  assert.equal(mapped.approvedBy, "operator@inmypoket.local");
  assert.equal(mapped.publishedAt, null);
  assert.equal(mapped.publishedSnapshotId, null);
  assert.equal(mapped.snapshotIsActive, true);
  assert.equal(mapped.snapshotCoverageRate, 1);

  const queue = buildOperatorObservationQueue([mapped], new Date("2026-04-17T18:00:00.000Z"));
  assert.equal(queue.items[0]?.states.includes("publication_error"), true);
});
