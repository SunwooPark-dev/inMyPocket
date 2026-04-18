"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ANCHOR_BASKET, PILOT_CLUSTERS, RETAILERS, STORES } from "../lib/catalog";
import { previewObservation } from "../lib/compare";
import { ComparabilityGrade, MeasurementUnit, PriceType } from "../lib/domain";

const DEFAULT_FORM = {
  canonicalProductId: ANCHOR_BASKET[0].id,
  storeId: STORES[0].id,
  priceType: "regular" as PriceType,
  measurementUnit: "lb" as MeasurementUnit,
  comparabilityGrade: "exact" as ComparabilityGrade,
  priceAmount: "1.79",
  measurementValue: "1",
  sourceUrl: "https://www.kroger.com",
  collectedAt: "2026-04-12T06:15:00-07:00"
};

type AdminPreviewFormProps = {
  canSave: boolean;
};

export function AdminPreviewForm({ canSave }: AdminPreviewFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const selectedItem =
    ANCHOR_BASKET.find((item) => item.id === form.canonicalProductId) ?? ANCHOR_BASKET[0];
  const selectedStore = STORES.find((store) => store.id === form.storeId) ?? STORES[0];
  const selectedCluster = PILOT_CLUSTERS.find((cluster) => cluster.zipCode === selectedStore.zipCode);
  const selectedRetailer = RETAILERS.find((retailer) => retailer.id === selectedStore.retailerId);

  const preview = useMemo(
    () =>
      previewObservation({
        canonicalProductId: form.canonicalProductId,
        priceAmount: Number(form.priceAmount),
        measurementValue: Number(form.measurementValue),
        measurementUnit: form.measurementUnit,
        comparabilityGrade: form.comparabilityGrade,
        sourceUrl: form.sourceUrl,
        collectedAt: form.collectedAt,
        storeId: form.storeId,
        priceType: form.priceType
      }),
    [form]
  );

  async function handleSave() {
    setSaveStatus("saving");
    setSaveMessage("");

    if (!canSave) {
      setSaveStatus("error");
      setSaveMessage("Admin save is unavailable until Supabase is configured.");
      return;
    }

    const payload = new FormData();
    payload.set("canonicalProductId", form.canonicalProductId);
    payload.set("storeId", form.storeId);
    payload.set("priceType", form.priceType);
    payload.set("measurementUnit", form.measurementUnit);
    payload.set("comparabilityGrade", form.comparabilityGrade);
    payload.set("priceAmount", String(Number(form.priceAmount)));
    payload.set("measurementValue", String(Number(form.measurementValue)));
    payload.set("sourceUrl", form.sourceUrl);
    payload.set("collectedAt", form.collectedAt);
    payload.set("notes", notes);

    if (evidenceFile) {
      payload.set("evidence", evidenceFile);
    }

    const response = await fetch("/api/observations", {
      method: "POST",
      body: payload
    });

    const responsePayload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setSaveStatus("error");
      setSaveMessage(responsePayload?.error ?? "Could not save the observation.");
      return;
    }

    setSaveStatus("done");
    setSaveMessage("Observation saved. The dashboard now prefers this live record over the seed value.");
    setEvidenceFile(null);
    setNotes("");
    router.refresh();
  }

  return (
    <div className="admin-form">
      <div className="admin-form__grid">
        <label>
          Item
          <select
            value={form.canonicalProductId}
            onChange={(event) => setForm((current) => ({ ...current, canonicalProductId: event.target.value }))}
          >
            {ANCHOR_BASKET.map((item) => (
              <option key={item.id} value={item.id}>
                {item.item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Store
          <select
            value={form.storeId}
            onChange={(event) => setForm((current) => ({ ...current, storeId: event.target.value }))}
          >
            {STORES.map((store) => (
              <option key={store.id} value={store.id}>
                {store.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Price type
          <select
            value={form.priceType}
            onChange={(event) =>
              setForm((current) => ({ ...current, priceType: event.target.value as PriceType }))
            }
          >
            <option value="regular">regular</option>
            <option value="sale">sale</option>
            <option value="member">member</option>
            <option value="coupon_required">coupon_required</option>
            <option value="weekly_ad">weekly_ad</option>
          </select>
        </label>

        <label>
          Grade
          <select
            value={form.comparabilityGrade}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                comparabilityGrade: event.target.value as ComparabilityGrade
              }))
            }
          >
            <option value="exact">exact</option>
            <option value="near-match">near-match</option>
            <option value="estimated-weight">estimated-weight</option>
            <option value="partial">partial</option>
            <option value="non-comparable">non-comparable</option>
          </select>
        </label>

        <label>
          Price
          <input
            type="number"
            step="0.01"
            value={form.priceAmount}
            onChange={(event) => setForm((current) => ({ ...current, priceAmount: event.target.value }))}
          />
        </label>

        <label>
          Measurement value
          <input
            type="number"
            step="0.01"
            value={form.measurementValue}
            onChange={(event) =>
              setForm((current) => ({ ...current, measurementValue: event.target.value }))
            }
          />
        </label>

        <label>
          Measurement unit
          <select
            value={form.measurementUnit}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                measurementUnit: event.target.value as MeasurementUnit
              }))
            }
          >
            <option value="lb">lb</option>
            <option value="oz">oz</option>
            <option value="floz">fl oz</option>
            <option value="egg">egg</option>
            <option value="sheet">sheet</option>
          </select>
        </label>

        <label className="admin-form__wide">
          Source URL
          <input
            type="url"
            value={form.sourceUrl}
            onChange={(event) => setForm((current) => ({ ...current, sourceUrl: event.target.value }))}
          />
        </label>

        <label className="admin-form__wide">
          Collected at
          <input
            type="text"
            value={form.collectedAt}
            onChange={(event) =>
              setForm((current) => ({ ...current, collectedAt: event.target.value }))
            }
          />
        </label>

        <label className="admin-form__wide">
          Operator notes
          <textarea value={notes} rows={3} onChange={(event) => setNotes(event.target.value)} />
        </label>

        <label className="admin-form__wide">
          Raw evidence file
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div className="admin-preview">
        <div>
          <p className="section-eyebrow">Preview</p>
          <h3>{selectedItem.item}</h3>
          <p>
            {selectedStore.label} · {selectedCluster?.label}
          </p>
        </div>

        <div className="admin-preview__stats">
          <div>
            <span>Normalized unit price</span>
            <strong>${preview.normalizedUnitPrice.toFixed(2)}</strong>
          </div>
          <div>
            <span>Basket contribution</span>
            <strong>${preview.estimatedBasketContribution.toFixed(2)}</strong>
          </div>
          <div>
            <span>Publish status</span>
            <strong>{preview.publishReady ? "Ready" : "Blocked"}</strong>
          </div>
        </div>

        <div className="badge-row">
          <span className="pill pill--quiet">Target {selectedItem.targetAmountLabel}</span>
          <span className="pill pill--quiet">{selectedItem.comparisonUnit}</span>
          <span className="pill pill--quiet">
            Official host: {selectedRetailer?.officialDomains.join(", ") ?? "Unknown"}
          </span>
          {evidenceFile ? (
            <span className="pill pill--quiet">{evidenceFile.name}</span>
          ) : (
            <span className="pill pill--quiet">No evidence selected</span>
          )}
        </div>

        <ul className="compact-list">
          {preview.blockers.length > 0 ? (
            preview.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)
          ) : (
            <li>No blocker. Ready for review queue.</li>
          )}
        </ul>

        <div className="hero__actions">
          <button
            type="button"
            className="button"
            disabled={!preview.publishReady || saveStatus === "saving" || !canSave}
            onClick={handleSave}
          >
            {saveStatus === "saving" ? "Saving..." : "Save observation"}
          </button>
        </div>

        {saveMessage ? (
          <p className={saveStatus === "error" ? "form-message form-message--error" : "form-message"}>
            {saveMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
