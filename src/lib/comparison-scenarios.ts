import type { ComparisonScenario } from "./domain";

export const ALL_COMPARISON_SCENARIOS = [
  "base_regular_total",
  "base_sale_total",
  "free_member_total",
  "coupon_required_total",
  "club_only_total",
  "weekly_ad_partial_total"
] as const satisfies ComparisonScenario[];

export const PUBLIC_COMPARISON_SCENARIOS = ALL_COMPARISON_SCENARIOS;

export const SCENARIO_LABELS: Record<ComparisonScenario, string> = {
  base_regular_total: "Standard prices",
  base_sale_total: "Sale prices",
  free_member_total: "Member savings view",
  coupon_required_total: "Coupon-required prices",
  club_only_total: "Club-only prices",
  weekly_ad_partial_total: "Weekly ad prices"
};

export function resolveComparisonScenario(value: string | undefined): ComparisonScenario {
  if (value && ALL_COMPARISON_SCENARIOS.includes(value as ComparisonScenario)) {
    return value as ComparisonScenario;
  }

  return "base_regular_total";
}

export function getScenarioHelpText(scenario: ComparisonScenario) {
  if (scenario === "base_sale_total") {
    return "Includes clearly visible public sale prices today.";
  }

  if (scenario === "free_member_total") {
    return "Includes free member savings when stores show them publicly.";
  }

  if (scenario === "coupon_required_total") {
    return "Shows coupon-required prices separately so they do not get mixed into the standard basket.";
  }

  if (scenario === "club_only_total") {
    return "Shows club-only pricing separately when stores require an extra membership layer.";
  }

  if (scenario === "weekly_ad_partial_total") {
    return "Shows the weekly-ad subset without pretending every basket item is on ad.";
  }

  return "Shows standard public basket prices without coupon tricks.";
}
