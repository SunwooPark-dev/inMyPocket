import { ANCHOR_BASKET, PILOT_CLUSTERS, STORES } from "./catalog.ts";
import type { PriceObservation, RetailerId } from "./domain.ts";

type BaseSeed = {
  priceAmount: number;
  measurementValue: number;
  packLabel: string;
  measurementUnit: PriceObservation["measurementUnit"];
  comparabilityGrade?: PriceObservation["comparabilityGrade"];
  notes?: string;
};

const BASE_MATRIX: Record<RetailerId, Record<string, BaseSeed>> = {
  kroger: {
    bananas: { priceAmount: 1.79, measurementValue: 1, measurementUnit: "lb", packLabel: "loose / 1 lb" },
    apples: { priceAmount: 4.99, measurementValue: 3, measurementUnit: "lb", packLabel: "3 lb bag" },
    strawberries: { priceAmount: 2.99, measurementValue: 1, measurementUnit: "lb", packLabel: "16 oz clamshell" },
    oranges: { priceAmount: 5.49, measurementValue: 3, measurementUnit: "lb", packLabel: "3 lb bag" },
    potatoes: { priceAmount: 3.99, measurementValue: 5, measurementUnit: "lb", packLabel: "5 lb bag" },
    tomatoes: { priceAmount: 1.69, measurementValue: 1, measurementUnit: "lb", packLabel: "roma / 1 lb" },
    onions: { priceAmount: 3.29, measurementValue: 3, measurementUnit: "lb", packLabel: "3 lb bag" },
    carrots: { priceAmount: 1.99, measurementValue: 2, measurementUnit: "lb", packLabel: "2 lb bag" },
    chicken: { priceAmount: 8.07, measurementValue: 2.7, measurementUnit: "lb", packLabel: "family pack / 2.7 lb", comparabilityGrade: "estimated-weight" },
    beef: { priceAmount: 5.49, measurementValue: 1, measurementUnit: "lb", packLabel: "1 lb pack" },
    pork: { priceAmount: 7.9, measurementValue: 2.4, measurementUnit: "lb", packLabel: "2.4 lb tray", comparabilityGrade: "estimated-weight" },
    rice: { priceAmount: 4.79, measurementValue: 5, measurementUnit: "lb", packLabel: "5 lb bag" },
    bread: { priceAmount: 2.99, measurementValue: 22, measurementUnit: "oz", packLabel: "22 oz loaf" },
    milk: { priceAmount: 3.79, measurementValue: 128, measurementUnit: "floz", packLabel: "1 gallon" },
    eggs: { priceAmount: 2.99, measurementValue: 12, measurementUnit: "egg", packLabel: "12 count" },
    tuna: { priceAmount: 4.99, measurementValue: 20, measurementUnit: "oz", packLabel: "4 x 5 oz pack" },
    toothpaste: { priceAmount: 2.79, measurementValue: 6, measurementUnit: "oz", packLabel: "6 oz tube" },
    soap: { priceAmount: 4.49, measurementValue: 10, measurementUnit: "oz", packLabel: "10 oz total bar soap" },
    "toilet-paper": { priceAmount: 8.99, measurementValue: 2040, measurementUnit: "sheet", packLabel: "2,040 sheets" },
    detergent: { priceAmount: 10.99, measurementValue: 92, measurementUnit: "floz", packLabel: "92 fl oz" }
  },
  aldi: {
    bananas: { priceAmount: 0.69, measurementValue: 1, measurementUnit: "lb", packLabel: "loose / 1 lb" },
    apples: { priceAmount: 3.29, measurementValue: 2, measurementUnit: "lb", packLabel: "2 lb bag", comparabilityGrade: "near-match" },
    strawberries: { priceAmount: 2.49, measurementValue: 1, measurementUnit: "lb", packLabel: "16 oz clamshell" },
    oranges: { priceAmount: 4.29, measurementValue: 3, measurementUnit: "lb", packLabel: "3 lb bag" },
    potatoes: { priceAmount: 3.49, measurementValue: 5, measurementUnit: "lb", packLabel: "5 lb bag" },
    tomatoes: { priceAmount: 1.49, measurementValue: 1, measurementUnit: "lb", packLabel: "roma / 1 lb" },
    onions: { priceAmount: 2.69, measurementValue: 3, measurementUnit: "lb", packLabel: "3 lb bag" },
    carrots: { priceAmount: 1.59, measurementValue: 2, measurementUnit: "lb", packLabel: "2 lb bag" },
    chicken: { priceAmount: 6.46, measurementValue: 2.4, measurementUnit: "lb", packLabel: "family pack / 2.4 lb", comparabilityGrade: "estimated-weight" },
    beef: { priceAmount: 4.39, measurementValue: 1, measurementUnit: "lb", packLabel: "1 lb pack" },
    pork: { priceAmount: 5.98, measurementValue: 2, measurementUnit: "lb", packLabel: "2 lb tray" },
    rice: { priceAmount: 4.39, measurementValue: 5, measurementUnit: "lb", packLabel: "5 lb bag" },
    bread: { priceAmount: 1.89, measurementValue: 20, measurementUnit: "oz", packLabel: "20 oz loaf", comparabilityGrade: "near-match" },
    milk: { priceAmount: 3.29, measurementValue: 128, measurementUnit: "floz", packLabel: "1 gallon" },
    eggs: { priceAmount: 2.59, measurementValue: 12, measurementUnit: "egg", packLabel: "12 count" },
    tuna: { priceAmount: 4.29, measurementValue: 20, measurementUnit: "oz", packLabel: "4 x 5 oz pack" },
    toothpaste: { priceAmount: 2.29, measurementValue: 6.2, measurementUnit: "oz", packLabel: "6.2 oz tube", comparabilityGrade: "near-match" },
    soap: { priceAmount: 3.29, measurementValue: 10, measurementUnit: "oz", packLabel: "10 oz total bar soap" },
    "toilet-paper": { priceAmount: 7.49, measurementValue: 1980, measurementUnit: "sheet", packLabel: "1,980 sheets", comparabilityGrade: "near-match" },
    detergent: { priceAmount: 8.99, measurementValue: 100, measurementUnit: "floz", packLabel: "100 fl oz", comparabilityGrade: "near-match" }
  },
  walmart: {
    bananas: { priceAmount: 0.68, measurementValue: 1, measurementUnit: "lb", packLabel: "loose / 1 lb" },
    apples: { priceAmount: 4.44, measurementValue: 3, measurementUnit: "lb", packLabel: "3 lb bag" },
    strawberries: { priceAmount: 2.77, measurementValue: 1, measurementUnit: "lb", packLabel: "16 oz clamshell" },
    oranges: { priceAmount: 4.97, measurementValue: 3, measurementUnit: "lb", packLabel: "3 lb bag" },
    potatoes: { priceAmount: 3.97, measurementValue: 5, measurementUnit: "lb", packLabel: "5 lb bag" },
    tomatoes: { priceAmount: 1.48, measurementValue: 1, measurementUnit: "lb", packLabel: "roma / 1 lb" },
    onions: { priceAmount: 2.98, measurementValue: 3, measurementUnit: "lb", packLabel: "3 lb bag" },
    carrots: { priceAmount: 1.76, measurementValue: 2, measurementUnit: "lb", packLabel: "2 lb bag" },
    chicken: { priceAmount: 7.72, measurementValue: 2.6, measurementUnit: "lb", packLabel: "family pack / 2.6 lb", comparabilityGrade: "estimated-weight" },
    beef: { priceAmount: 4.98, measurementValue: 1, measurementUnit: "lb", packLabel: "1 lb pack" },
    pork: { priceAmount: 6.48, measurementValue: 2, measurementUnit: "lb", packLabel: "2 lb tray" },
    rice: { priceAmount: 4.68, measurementValue: 5, measurementUnit: "lb", packLabel: "5 lb bag" },
    bread: { priceAmount: 1.98, measurementValue: 20, measurementUnit: "oz", packLabel: "20 oz loaf", comparabilityGrade: "near-match" },
    milk: { priceAmount: 3.64, measurementValue: 128, measurementUnit: "floz", packLabel: "1 gallon" },
    eggs: { priceAmount: 2.68, measurementValue: 12, measurementUnit: "egg", packLabel: "12 count" },
    tuna: { priceAmount: 4.72, measurementValue: 20, measurementUnit: "oz", packLabel: "4 x 5 oz pack" },
    toothpaste: { priceAmount: 2.47, measurementValue: 6, measurementUnit: "oz", packLabel: "6 oz tube" },
    soap: { priceAmount: 3.97, measurementValue: 10, measurementUnit: "oz", packLabel: "10 oz total bar soap" },
    "toilet-paper": { priceAmount: 8.47, measurementValue: 1980, measurementUnit: "sheet", packLabel: "1,980 sheets", comparabilityGrade: "near-match" },
    detergent: { priceAmount: 10.47, measurementValue: 100, measurementUnit: "floz", packLabel: "100 fl oz", comparabilityGrade: "near-match" }
  }
};

const ZIP_MULTIPLIERS: Record<string, Record<RetailerId, number>> = {
  "30328": { kroger: 1, aldi: 1, walmart: 1 },
  "30022": { kroger: 1.03, aldi: 1.02, walmart: 1.01 },
  "30076": { kroger: 0.99, aldi: 1.01, walmart: 0.98 }
};

const OVERRIDES = [
  { retailerId: "kroger", canonicalProductId: "bread", priceType: "member", priceAmount: 2.49 },
  { retailerId: "kroger", canonicalProductId: "toothpaste", priceType: "coupon_required", priceAmount: 1.99 },
  { retailerId: "kroger", canonicalProductId: "eggs", priceType: "sale", priceAmount: 2.79 },
  { retailerId: "walmart", canonicalProductId: "milk", priceType: "sale", priceAmount: 3.44 },
  { retailerId: "walmart", canonicalProductId: "bread", priceType: "sale", priceAmount: 1.84 },
  { retailerId: "aldi", canonicalProductId: "strawberries", priceType: "sale", priceAmount: 2.19 }
] as const;

const BASE_TIMESTAMP = "2026-04-12T06:15:00-07:00";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function sourceUrlFor(retailerId: RetailerId) {
  if (retailerId === "kroger") return "https://www.kroger.com";
  if (retailerId === "aldi") return "https://www.aldi.us";
  return "https://www.walmart.com";
}

function sourceLabelFor(retailerId: RetailerId) {
  if (retailerId === "kroger") return "Official Kroger public web";
  if (retailerId === "aldi") return "Official ALDI public web";
  return "Official Walmart public web";
}

const BASE_OBSERVATIONS: PriceObservation[] = PILOT_CLUSTERS.flatMap((cluster) =>
  STORES.filter((store) => store.zipCode === cluster.zipCode).flatMap((store) =>
    ANCHOR_BASKET.map((item) => {
      const base = BASE_MATRIX[store.retailerId][item.id];
      const multiplier = ZIP_MULTIPLIERS[cluster.zipCode][store.retailerId];

      return {
        id: `${store.id}-${item.id}-regular`,
        canonicalProductId: item.id,
        retailerId: store.retailerId,
        storeId: store.id,
        zipCode: cluster.zipCode,
        channel: "product_page",
        priceType: "regular",
        priceAmount: roundCurrency(base.priceAmount * multiplier),
        measurementValue: base.measurementValue,
        measurementUnit: base.measurementUnit,
        packLabel: base.packLabel,
        comparabilityGrade: base.comparabilityGrade ?? "exact",
        sourceUrl: sourceUrlFor(store.retailerId),
        sourceLabel: sourceLabelFor(store.retailerId),
        collectedAt: BASE_TIMESTAMP,
        confidence: "medium",
        notes: base.notes
      } satisfies PriceObservation;
    })
  )
);

const SCENARIO_OBSERVATIONS: PriceObservation[] = PILOT_CLUSTERS.flatMap((cluster) =>
    OVERRIDES.map((override) => {
      const store = STORES.find(
        (candidate) =>
          candidate.zipCode === cluster.zipCode && candidate.retailerId === override.retailerId
      );

      if (!store) {
        throw new Error(`Missing store for ${override.retailerId} ${cluster.zipCode}`);
      }

      const base = BASE_MATRIX[override.retailerId][override.canonicalProductId];
      const multiplier = ZIP_MULTIPLIERS[cluster.zipCode][override.retailerId];

      return {
        id: `${store.id}-${override.canonicalProductId}-${override.priceType}`,
        canonicalProductId: override.canonicalProductId,
        retailerId: override.retailerId,
        storeId: store.id,
        zipCode: cluster.zipCode,
        channel: "product_page",
        priceType: override.priceType,
        priceAmount: roundCurrency(override.priceAmount * multiplier),
        measurementValue: base.measurementValue,
        measurementUnit: base.measurementUnit,
        packLabel: base.packLabel,
        comparabilityGrade: base.comparabilityGrade ?? "exact",
        sourceUrl: sourceUrlFor(override.retailerId),
        sourceLabel: `${sourceLabelFor(override.retailerId)} (scenario seed)`,
        collectedAt: BASE_TIMESTAMP,
        confidence: "low",
        isMembershipRequired: override.priceType === "member",
        isCouponRequired: override.priceType === "coupon_required",
        notes: "Seeded scenario data for prototype preview only."
      } satisfies PriceObservation;
    })
);

export const DEMO_OBSERVATIONS: PriceObservation[] = [...BASE_OBSERVATIONS, ...SCENARIO_OBSERVATIONS];
