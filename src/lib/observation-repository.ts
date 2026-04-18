import { randomUUID } from "node:crypto";

import { isSupabaseConfigured } from "./env.ts";
import type { GovernedPublicObservation, ObservationReviewStatus } from "./observation-feed.ts";
import { getSupabasePublicClient, getSupabaseServiceClient } from "./supabase.ts";
import {
  deleteEvidenceById,
  fetchEvidenceMap,
  type EvidenceUploadInput,
  uploadEvidenceFile
} from "./observation-evidence-store.ts";
import type { ObservationEvidence, PriceObservation } from "./domain.ts";

type ObservationRecord = Record<string, unknown>;

function requireSupabase() {
  const client = getSupabaseServiceClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  return client;
}

function toOptionalIsoString(value: unknown) {
  if (!value) {
    return null;
  }

  return new Date(String(value)).toISOString();
}

function toOptionalNumber(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapObservationRecord(
  record: ObservationRecord,
  evidenceMap: Map<string, ObservationEvidence>
): PriceObservation {
  const evidenceId =
    record.evidence_id === null || record.evidence_id === undefined
      ? null
      : String(record.evidence_id);
  const evidence = evidenceId ? evidenceMap.get(evidenceId) ?? null : null;

  return {
    id: String(record.id),
    canonicalProductId: String(record.canonical_product_id),
    retailerId: String(record.retailer_id) as PriceObservation["retailerId"],
    storeId: String(record.store_id),
    zipCode: String(record.zip_code),
    channel: String(record.channel) as PriceObservation["channel"],
    priceType: String(record.price_type) as PriceObservation["priceType"],
    priceAmount: Number(record.price_amount),
    measurementValue: Number(record.measurement_value),
    measurementUnit: String(record.measurement_unit) as PriceObservation["measurementUnit"],
    packLabel: String(record.pack_label),
    comparabilityGrade: String(record.comparability_grade) as PriceObservation["comparabilityGrade"],
    sourceUrl: String(record.source_url),
    sourceLabel: String(record.source_label),
    collectedAt: new Date(String(record.collected_at)).toISOString(),
    confidence: String(record.confidence) as PriceObservation["confidence"],
    notes: record.notes ? String(record.notes) : undefined,
    isEstimatedWeight: Boolean(record.is_estimated_weight),
    isMembershipRequired: Boolean(record.is_membership_required),
    isCouponRequired: Boolean(record.is_coupon_required),
    isClubOnly: Boolean(record.is_club_only),
    evidenceId,
    evidenceOriginalName: evidence?.originalName ?? null,
    evidenceContentType: evidence?.contentType ?? null,
    evidenceByteSize: evidence?.byteSize ?? null,
    evidenceUploadedAt: evidence?.uploadedAt ?? null
  };
}

function mapPublicObservationRecord(record: ObservationRecord): GovernedPublicObservation {
  return {
    id: String(record.id),
    canonicalProductId: String(record.canonical_product_id),
    retailerId: String(record.retailer_id) as PriceObservation["retailerId"],
    storeId: String(record.store_id),
    zipCode: String(record.zip_code),
    channel: String(record.channel) as PriceObservation["channel"],
    priceType: String(record.price_type) as PriceObservation["priceType"],
    priceAmount: Number(record.price_amount),
    measurementValue: Number(record.measurement_value),
    measurementUnit: String(record.measurement_unit) as PriceObservation["measurementUnit"],
    packLabel: String(record.pack_label),
    comparabilityGrade: String(record.comparability_grade) as PriceObservation["comparabilityGrade"],
    sourceUrl: String(record.source_url),
    sourceLabel: String(record.source_label),
    collectedAt: new Date(String(record.collected_at)).toISOString(),
    confidence: String(record.confidence) as PriceObservation["confidence"],
    isEstimatedWeight: Boolean(record.is_estimated_weight),
    isMembershipRequired: Boolean(record.is_membership_required),
    isCouponRequired: Boolean(record.is_coupon_required),
    isClubOnly: Boolean(record.is_club_only),
    notes: undefined,
    evidenceId: null,
    evidenceOriginalName: null,
    evidenceContentType: null,
    evidenceByteSize: null,
    evidenceUploadedAt: null,
    reviewStatus:
      (record.review_status ? String(record.review_status) : null) as ObservationReviewStatus | null,
    approvedAt: toOptionalIsoString(record.approved_at),
    approvedBy: record.approved_by ? String(record.approved_by) : null,
    publishedAt: toOptionalIsoString(record.published_at),
    publishedSnapshotId: record.published_snapshot_id ? String(record.published_snapshot_id) : null,
    snapshotIsActive:
      record.snapshot_is_active === null || record.snapshot_is_active === undefined
        ? null
        : Boolean(record.snapshot_is_active),
    snapshotCoverageRate: toOptionalNumber(record.snapshot_coverage_rate),
    retiredAt: toOptionalIsoString(record.retired_at),
    invalidatedAt: toOptionalIsoString(record.invalidated_at)
  };
}

export async function readStoredObservations() {
  if (!isSupabaseConfigured()) {
    return [] as PriceObservation[];
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("price_observations")
    .select("*")
    .order("collected_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to read price observations: ${error.message}`);
  }

  const records = (data ?? []) as ObservationRecord[];
  const evidenceIds = records
    .map((record) => (record.evidence_id ? String(record.evidence_id) : null))
    .filter((value): value is string => Boolean(value));
  const evidenceMap = await fetchEvidenceMap([...new Set(evidenceIds)]);

  return records.map((record) => mapObservationRecord(record, evidenceMap));
}

export async function readPublicStoredObservations() {
  const publicClient = getSupabasePublicClient();

  if (!publicClient) {
    return [] as GovernedPublicObservation[];
  }

  const { data, error } = await publicClient
    .from("published_price_observations")
    .select(
      "id,canonical_product_id,retailer_id,store_id,zip_code,channel,price_type,price_amount,measurement_value,measurement_unit,pack_label,comparability_grade,source_url,source_label,collected_at,confidence,is_estimated_weight,is_membership_required,is_coupon_required,is_club_only,review_status,approved_at,approved_by,published_at,published_snapshot_id,retired_at,invalidated_at,snapshot_is_active,snapshot_coverage_rate"
    )
    .order("published_at", { ascending: false })
    .order("collected_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to read public price observations: ${error.message}`);
  }

  return ((data ?? []) as ObservationRecord[]).map((record) => mapPublicObservationRecord(record));
}

export async function saveObservation(
  observation: PriceObservation,
  evidenceFile?: EvidenceUploadInput
) {
  const supabase = requireSupabase();
  let evidence: ObservationEvidence | null = null;

  if (evidenceFile) {
    evidence = await uploadEvidenceFile(evidenceFile);
  }

  const payload = {
    id: observation.id,
    canonical_product_id: observation.canonicalProductId,
    retailer_id: observation.retailerId,
    store_id: observation.storeId,
    zip_code: observation.zipCode,
    channel: observation.channel,
    price_type: observation.priceType,
    price_amount: observation.priceAmount,
    measurement_value: observation.measurementValue,
    measurement_unit: observation.measurementUnit,
    pack_label: observation.packLabel,
    comparability_grade: observation.comparabilityGrade,
    source_url: observation.sourceUrl,
    source_label: observation.sourceLabel,
    collected_at: observation.collectedAt,
    confidence: observation.confidence,
    notes: observation.notes ?? null,
    is_estimated_weight: observation.isEstimatedWeight ?? false,
    is_membership_required: observation.isMembershipRequired ?? false,
    is_coupon_required: observation.isCouponRequired ?? false,
    is_club_only: observation.isClubOnly ?? false,
    evidence_id: evidence?.id ?? null
  };

  const { data, error } = await supabase
    .from("price_observations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    if (evidence) {
      await deleteEvidenceById(evidence);
    }

    throw new Error(`Failed to save price observation: ${error.message}`);
  }

  const evidenceMap = evidence
    ? new Map<string, ObservationEvidence>([[evidence.id, evidence]])
    : new Map<string, ObservationEvidence>();

  return mapObservationRecord(data as ObservationRecord, evidenceMap);
}

export async function saveImportedObservation(rawObservation: Partial<PriceObservation>) {
  const observation: PriceObservation = {
    id: rawObservation.id ?? randomUUID(),
    canonicalProductId: rawObservation.canonicalProductId ?? "",
    retailerId: rawObservation.retailerId ?? "kroger",
    storeId: rawObservation.storeId ?? "",
    zipCode: rawObservation.zipCode ?? "",
    channel: rawObservation.channel ?? "product_page",
    priceType: rawObservation.priceType ?? "regular",
    priceAmount: rawObservation.priceAmount ?? 0,
    measurementValue: rawObservation.measurementValue ?? 0,
    measurementUnit: rawObservation.measurementUnit ?? "lb",
    packLabel: rawObservation.packLabel ?? "",
    comparabilityGrade: rawObservation.comparabilityGrade ?? "partial",
    sourceUrl: rawObservation.sourceUrl ?? "",
    sourceLabel: rawObservation.sourceLabel ?? "Legacy import",
    collectedAt: rawObservation.collectedAt ?? new Date().toISOString(),
    confidence: rawObservation.confidence ?? "low",
    notes: rawObservation.notes,
    isEstimatedWeight: rawObservation.isEstimatedWeight ?? false,
    isMembershipRequired: rawObservation.isMembershipRequired ?? false,
    isCouponRequired: rawObservation.isCouponRequired ?? false,
    isClubOnly: rawObservation.isClubOnly ?? false
  };

  return saveObservation(observation);
}
