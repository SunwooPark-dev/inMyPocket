import { randomUUID } from "node:crypto";

import { ANCHOR_BASKET } from "../../../lib/catalog";
import { validateEvidenceFileDescriptor } from "../../../lib/admin-upload";
import { isAdminAuthorized } from "../../../lib/admin-auth";
import { isSupabaseConfigured } from "../../../lib/env";
import { saveObservation, getRecentStoredObservations } from "../../../lib/server-storage";
import { getStoreById, isAllowedSourceUrl } from "../../../lib/source-policy";
import type { ComparabilityGrade, MeasurementUnit, PriceObservation, PriceType } from "../../../lib/domain";

export async function GET() {
  if (!(await isAdminAuthorized())) {
    return Response.json({ error: "Admin access required." }, { status: 401 });
  }

  const observations = await getRecentStoredObservations(25);
  return Response.json({ observations });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthorized())) {
    return Response.json({ error: "Admin access required." }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const formData = await request.formData();
  const canonicalProductId = String(formData.get("canonicalProductId") ?? "").trim();
  const storeId = String(formData.get("storeId") ?? "").trim();
  const priceType = String(formData.get("priceType") ?? "").trim() as PriceType;
  const measurementUnit = String(formData.get("measurementUnit") ?? "").trim() as MeasurementUnit;
  const comparabilityGrade = String(formData.get("comparabilityGrade") ?? "").trim() as ComparabilityGrade;
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  const collectedAt = String(formData.get("collectedAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const priceAmount = Number(formData.get("priceAmount"));
  const measurementValue = Number(formData.get("measurementValue"));
  const evidence = formData.get("evidence");

  const item = ANCHOR_BASKET.find((candidate) => candidate.id === canonicalProductId);
  const store = getStoreById(storeId);

  if (!item) {
    return Response.json({ error: "A valid anchor basket item is required." }, { status: 400 });
  }

  if (!store) {
    return Response.json({ error: "A valid pilot store is required." }, { status: 400 });
  }

  if (!priceType) {
    return Response.json({ error: "Price type is required." }, { status: 400 });
  }

  if (!measurementUnit) {
    return Response.json({ error: "Measurement unit is required." }, { status: 400 });
  }

  if (!comparabilityGrade) {
    return Response.json({ error: "Comparability grade is required." }, { status: 400 });
  }

  if (!Number.isFinite(priceAmount) || priceAmount <= 0) {
    return Response.json({ error: "Price amount must be greater than 0." }, { status: 400 });
  }

  if (!Number.isFinite(measurementValue) || measurementValue <= 0) {
    return Response.json({ error: "Measurement value must be greater than 0." }, { status: 400 });
  }

  if (!sourceUrl || !isAllowedSourceUrl(store.retailerId, sourceUrl)) {
    return Response.json(
      { error: "Source URL must be an https URL on the retailer's official public domain." },
      { status: 400 }
    );
  }

  if (!collectedAt || Number.isNaN(new Date(collectedAt).getTime())) {
    return Response.json({ error: "Collected timestamp must be a valid ISO datetime." }, { status: 400 });
  }

  let evidenceFile:
    | {
        buffer: Buffer;
        originalName: string;
        contentType: string;
        byteSize: number;
      }
    | undefined;

  if (evidence instanceof File && evidence.size > 0) {
    const uploadError = validateEvidenceFileDescriptor({
      size: evidence.size,
      type: evidence.type
    });

    if (uploadError) {
      return Response.json({ error: uploadError }, { status: 400 });
    }

    evidenceFile = {
      buffer: Buffer.from(await evidence.arrayBuffer()),
      originalName: evidence.name,
      contentType: evidence.type,
      byteSize: evidence.size
    };
  }

  const observation: PriceObservation = {
    id: randomUUID(),
    canonicalProductId,
    retailerId: store.retailerId,
    storeId: store.id,
    zipCode: store.zipCode,
    channel: "product_page",
    priceType,
    priceAmount,
    measurementValue,
    measurementUnit,
    packLabel: item.targetAmountLabel,
    comparabilityGrade,
    sourceUrl,
    sourceLabel: "Manual operator validation",
    collectedAt,
    confidence: comparabilityGrade === "exact" ? "high" : "medium",
    notes: notes || "Saved from admin preview form."
  };

  const savedObservation = await saveObservation(observation, evidenceFile);

  return Response.json({ ok: true, observation: savedObservation });
}
