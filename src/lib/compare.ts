import { ANCHOR_BASKET, RETAILERS, STORES } from "./catalog.ts";
import { DEMO_OBSERVATIONS } from "./demo-data.ts";
import type {
  AnchorBasketItem,
  BasketSummary,
  ComparisonScenario,
  ItemComparisonRow,
  PreviewResult,
  PriceObservation,
  RetailerId,
  SelectedPrice
} from "./domain.ts";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function roundCoverage(value: number) {
  return Math.round(value * 1000) / 10;
}

function normalizeAmount(
  measurementValue: number,
  measurementUnit: PriceObservation["measurementUnit"],
  normalizationUnit: AnchorBasketItem["normalizationUnit"]
) {
  if (measurementUnit === normalizationUnit) {
    return measurementValue;
  }

  if (measurementUnit === "sheet" && normalizationUnit === "sheet100") {
    return measurementValue / 100;
  }

  throw new Error(`Unsupported conversion from ${measurementUnit} to ${normalizationUnit}`);
}

function targetAmountForItem(item: AnchorBasketItem) {
  if (item.normalizationUnit === "sheet100") {
    return item.targetAmount / 100;
  }

  return item.targetAmount;
}

export function calculateSelectedPrice(
  observation: PriceObservation,
  item: AnchorBasketItem
): SelectedPrice {
  const normalizedMeasurement = normalizeAmount(
    observation.measurementValue,
    observation.measurementUnit,
    item.normalizationUnit
  );
  const normalizedUnitPrice = observation.priceAmount / normalizedMeasurement;
  const estimatedBasketContribution = normalizedUnitPrice * targetAmountForItem(item);

  return {
    observation,
    normalizedUnitPrice: roundCurrency(normalizedUnitPrice),
    estimatedBasketContribution: roundCurrency(estimatedBasketContribution)
  };
}

function isComparable(observation: PriceObservation) {
  return observation.comparabilityGrade !== "non-comparable";
}

function candidatePriorityForScenario(
  scenario: ComparisonScenario,
  priceType: PriceObservation["priceType"]
) {
  const priorities: Record<ComparisonScenario, PriceObservation["priceType"][]> = {
    base_regular_total: ["regular"],
    base_sale_total: ["sale", "regular"],
    free_member_total: ["member", "sale", "regular"],
    coupon_required_total: ["coupon_required", "member", "sale", "regular"],
    club_only_total: ["club_only"],
    weekly_ad_partial_total: ["weekly_ad"]
  };

  return priorities[scenario].indexOf(priceType);
}

export function selectObservation(
  scenario: ComparisonScenario,
  observations: PriceObservation[]
) {
  return observations
    .filter((observation) => isComparable(observation))
    .filter((observation) => candidatePriorityForScenario(scenario, observation.priceType) !== -1)
    .sort((left, right) => {
      const leftPriority = candidatePriorityForScenario(scenario, left.priceType);
      const rightPriority = candidatePriorityForScenario(scenario, right.priceType);

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return left.priceAmount - right.priceAmount;
    })[0] ?? null;
}

export function buildBasketSummary(
  zipCode: string,
  scenario: ComparisonScenario,
  observations: PriceObservation[] = DEMO_OBSERVATIONS
): BasketSummary[] {
  const storesForZip = STORES.filter((store) => store.zipCode === zipCode);

  return storesForZip
    .map((store) => {
      const retailer = RETAILERS.find((candidate) => candidate.id === store.retailerId);

      if (!retailer) {
        throw new Error(`Missing retailer ${store.retailerId}`);
      }

      const selectedPrices = ANCHOR_BASKET.flatMap((item) => {
        const itemObservations = observations.filter(
          (observation) =>
            observation.storeId === store.id && observation.canonicalProductId === item.id
        );
        const selected = selectObservation(scenario, itemObservations);

        if (!selected) {
          return [];
        }

        return [calculateSelectedPrice(selected, item)];
      });

      const comparableCount = selectedPrices.length;
      const coverageRate = comparableCount / ANCHOR_BASKET.length;
      const blockers: string[] = [];

      if (coverageRate < 0.8) blockers.push("Coverage below 80%");
      if (selectedPrices.some((price) => !price.observation.sourceUrl)) blockers.push("Missing source URL");
      if (selectedPrices.some((price) => !price.observation.collectedAt)) blockers.push("Missing collected timestamp");

      if (
        scenario === "base_regular_total" &&
        selectedPrices.some((price) => price.observation.priceType !== "regular")
      ) {
        blockers.push("Default basket mixed non-regular prices");
      }

      return {
        retailer,
        store,
        selectedPrices,
        total: roundCurrency(
          selectedPrices.reduce((sum, price) => sum + price.estimatedBasketContribution, 0)
        ),
        comparableCount,
        coverageRate: roundCoverage(coverageRate),
        blockers,
        publishReady: blockers.length === 0
      };
    })
    .sort((left, right) => left.total - right.total);
}

export function getPublishableBasketSummaries(
  zipCode: string,
  scenario: ComparisonScenario,
  observations: PriceObservation[] = DEMO_OBSERVATIONS
): BasketSummary[] {
  return buildBasketSummary(zipCode, scenario, observations).filter(
    (summary) => summary.publishReady && summary.comparableCount > 0
  );
}

export function buildItemRows(
  zipCode: string,
  scenario: ComparisonScenario,
  observations: PriceObservation[] = DEMO_OBSERVATIONS
): ItemComparisonRow[] {
  const storeLookup = Object.fromEntries(
    STORES.filter((store) => store.zipCode === zipCode).map((store) => [store.retailerId, store.id])
  );

  return ANCHOR_BASKET.map((item) => {
    const pricesByRetailer = {
      kroger: null,
      aldi: null,
      walmart: null
    } as Record<RetailerId, SelectedPrice | null>;

    (Object.keys(pricesByRetailer) as RetailerId[]).forEach((retailerId) => {
      const itemObservations = observations.filter(
        (observation) =>
          observation.storeId === storeLookup[retailerId] &&
          observation.canonicalProductId === item.id
      );
      const selected = selectObservation(scenario, itemObservations);
      pricesByRetailer[retailerId] = selected ? calculateSelectedPrice(selected, item) : null;
    });

    return { item, pricesByRetailer };
  });
}

export function buildPublishGate(
  zipCode: string,
  scenario: ComparisonScenario,
  observations: PriceObservation[] = DEMO_OBSERVATIONS
) {
  return buildBasketSummary(zipCode, scenario, observations).map((summary) => ({
    storeId: summary.store.id,
    zipCode,
    scenario,
    publishReady: summary.publishReady,
    coverageRate: summary.coverageRate,
    blockers: summary.blockers
  }));
}

export function getLastCollectedAt(zipCode: string, observations: PriceObservation[] = DEMO_OBSERVATIONS) {
  return observations.filter((observation) => observation.zipCode === zipCode)
    .map((observation) => observation.collectedAt)
    .sort()
    .at(-1);
}

export function previewObservation(input: {
  canonicalProductId: string;
  priceAmount: number;
  measurementValue: number;
  measurementUnit: PriceObservation["measurementUnit"];
  comparabilityGrade: PriceObservation["comparabilityGrade"];
  sourceUrl: string;
  collectedAt: string;
  storeId: string;
  priceType: PriceObservation["priceType"];
}): PreviewResult {
  const item = ANCHOR_BASKET.find((candidate) => candidate.id === input.canonicalProductId);

  if (!item) {
    throw new Error(`Unknown item ${input.canonicalProductId}`);
  }

  const blockers: string[] = [];

  if (!input.sourceUrl.trim()) blockers.push("Source URL is required");
  if (!input.collectedAt.trim()) blockers.push("Collected timestamp is required");
  if (!input.storeId.trim()) blockers.push("Store context is required");
  if (input.comparabilityGrade === "non-comparable") {
    blockers.push("Non-comparable items cannot publish into the default basket");
  }

  const selected = calculateSelectedPrice(
    {
      id: "preview",
      canonicalProductId: input.canonicalProductId,
      retailerId: "kroger",
      storeId: input.storeId,
      zipCode: "preview",
      channel: "product_page",
      priceType: input.priceType,
      priceAmount: input.priceAmount,
      measurementValue: input.measurementValue,
      measurementUnit: input.measurementUnit,
      packLabel: "preview",
      comparabilityGrade: input.comparabilityGrade,
      sourceUrl: input.sourceUrl,
      sourceLabel: "preview",
      collectedAt: input.collectedAt,
      confidence: "low"
    },
    item
  );

  return {
    normalizedUnitPrice: selected.normalizedUnitPrice,
    estimatedBasketContribution: selected.estimatedBasketContribution,
    blockers,
    publishReady: blockers.length === 0
  };
}
