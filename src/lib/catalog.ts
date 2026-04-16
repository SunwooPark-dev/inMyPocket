import type { AnchorBasketItem, PilotCluster, RetailerProfile, StoreLocation } from "./domain.ts";

export const PILOT_CLUSTERS: PilotCluster[] = [
  {
    zipCode: "30328",
    label: "Sandy Springs",
    county: "Fulton County",
    note: "North Atlanta suburban core pilot cluster"
  },
  {
    zipCode: "30022",
    label: "Alpharetta East",
    county: "Fulton County",
    note: "Higher-income suburban cluster with strong retailer overlap"
  },
  {
    zipCode: "30076",
    label: "Roswell North",
    county: "Fulton County",
    note: "North Fulton cluster with strong caregiver search fit"
  }
];

export const RETAILERS: RetailerProfile[] = [
  {
    id: "kroger",
    name: "Kroger",
    color: "#1656d1",
    publicVisibility: "high",
    complianceRisk: "medium",
    membershipLabel: "Shopper's Card",
    officialDomains: ["kroger.com"],
    notes: "High product-page visibility, membership pricing must stay separate."
  },
  {
    id: "aldi",
    name: "ALDI",
    color: "#016633",
    publicVisibility: "high",
    complianceRisk: "high",
    membershipLabel: "No membership",
    officialDomains: ["aldi.us"],
    notes: "Strong value perception, manual validation only."
  },
  {
    id: "walmart",
    name: "Walmart",
    color: "#0071ce",
    publicVisibility: "high",
    complianceRisk: "high",
    membershipLabel: "No membership",
    officialDomains: ["walmart.com"],
    notes: "High coverage benchmark, channel separation is critical."
  }
];

export const STORES: StoreLocation[] = PILOT_CLUSTERS.flatMap((cluster) => [
  {
    id: `kroger-${cluster.zipCode}`,
    retailerId: "kroger" as const,
    zipCode: cluster.zipCode,
    label: `${cluster.label} Kroger`,
    addressHint: `${cluster.label} pilot store`
  },
  {
    id: `aldi-${cluster.zipCode}`,
    retailerId: "aldi" as const,
    zipCode: cluster.zipCode,
    label: `${cluster.label} ALDI`,
    addressHint: `${cluster.label} pilot store`
  },
  {
    id: `walmart-${cluster.zipCode}`,
    retailerId: "walmart" as const,
    zipCode: cluster.zipCode,
    label: `${cluster.label} Walmart`,
    addressHint: `${cluster.label} pilot store`
  }
]);

export const ANCHOR_BASKET: AnchorBasketItem[] = [
  {
    id: "bananas",
    item: "Bananas",
    category: "fruit",
    canonicalSpec: "loose bananas sold by weight",
    comparisonUnit: "USD/lb",
    normalizationUnit: "lb",
    fallbackRule: "If only single-item pricing is shown, list it separately and leave it out of the default basket total.",
    targetAmount: 2,
    targetAmountLabel: "2 lb"
  },
  {
    id: "apples",
    item: "Apples",
    category: "fruit",
    canonicalSpec: "gala apples 3 lb bag",
    comparisonUnit: "USD/lb",
    normalizationUnit: "lb",
    fallbackRule: "Only 2 lb or 4 lb bags count as a close-size match.",
    targetAmount: 3,
    targetAmountLabel: "3 lb"
  },
  {
    id: "strawberries",
    item: "Strawberries",
    category: "fruit",
    canonicalSpec: "strawberries 1 lb clamshell",
    comparisonUnit: "USD/lb",
    normalizationUnit: "lb",
    fallbackRule: "Only 12 oz or 16 oz packs count as a close-size match.",
    targetAmount: 1,
    targetAmountLabel: "1 lb"
  },
  {
    id: "oranges",
    item: "Oranges",
    category: "fruit",
    canonicalSpec: "navel oranges 3 lb bag",
    comparisonUnit: "USD/lb",
    normalizationUnit: "lb",
    fallbackRule: "If only loose oranges are shown, list unit pricing only and leave them out of the default basket total.",
    targetAmount: 3,
    targetAmountLabel: "3 lb"
  },
  {
    id: "potatoes",
    item: "Potatoes",
    category: "vegetable",
    canonicalSpec: "russet potatoes 5 lb bag",
    comparisonUnit: "USD/lb",
    normalizationUnit: "lb",
    fallbackRule: "Only 3 lb or 10 lb bags count as a close-size match.",
    targetAmount: 5,
    targetAmountLabel: "5 lb"
  },
  {
    id: "tomatoes",
    item: "Tomatoes",
    category: "vegetable",
    canonicalSpec: "roma tomatoes sold by weight",
    comparisonUnit: "USD/lb",
    normalizationUnit: "lb",
    fallbackRule: "Vine tomatoes do not count as a comparable match.",
    targetAmount: 1.5,
    targetAmountLabel: "1.5 lb"
  },
  {
    id: "onions",
    item: "Onions",
    category: "vegetable",
    canonicalSpec: "yellow onions 3 lb bag",
    comparisonUnit: "USD/lb",
    normalizationUnit: "lb",
    fallbackRule: "Only 2 lb or 5 lb bags count as a close-size match.",
    targetAmount: 3,
    targetAmountLabel: "3 lb"
  },
  {
    id: "carrots",
    item: "Carrots",
    category: "vegetable",
    canonicalSpec: "whole carrots 2 lb bag",
    comparisonUnit: "USD/lb",
    normalizationUnit: "lb",
    fallbackRule: "Only 1 lb or 3 lb bags count as a close-size match.",
    targetAmount: 2,
    targetAmountLabel: "2 lb"
  },
  {
    id: "chicken",
    item: "Chicken breast",
    category: "protein",
    canonicalSpec: "boneless skinless chicken breast",
    comparisonUnit: "USD/lb",
    normalizationUnit: "lb",
    fallbackRule: "Frozen-only chicken stays out of the default basket total.",
    targetAmount: 2,
    targetAmountLabel: "2 lb"
  },
  {
    id: "beef",
    item: "Ground beef",
    category: "protein",
    canonicalSpec: "ground beef 80/20 1 lb pack",
    comparisonUnit: "USD/lb",
    normalizationUnit: "lb",
    fallbackRule: "85/15 or 73/27 blends do not count as a comparable match.",
    targetAmount: 1,
    targetAmountLabel: "1 lb"
  },
  {
    id: "pork",
    item: "Pork loin chops",
    category: "protein",
    canonicalSpec: "boneless pork loin chops",
    comparisonUnit: "USD/lb",
    normalizationUnit: "lb",
    fallbackRule: "A different cut does not count as a comparable match.",
    targetAmount: 2,
    targetAmountLabel: "2 lb"
  },
  {
    id: "rice",
    item: "Rice",
    category: "essential",
    canonicalSpec: "long-grain white rice 5 lb bag",
    comparisonUnit: "USD/lb",
    normalizationUnit: "lb",
    fallbackRule: "Only 3 lb or 10 lb bags count as a close-size match.",
    targetAmount: 5,
    targetAmountLabel: "5 lb"
  },
  {
    id: "bread",
    item: "Bread",
    category: "essential",
    canonicalSpec: "sandwich bread 20-24 oz loaf",
    comparisonUnit: "USD/oz",
    normalizationUnit: "oz",
    fallbackRule: "Specialty loaves stay out of the default basket comparison.",
    targetAmount: 22,
    targetAmountLabel: "22 oz"
  },
  {
    id: "milk",
    item: "Milk",
    category: "essential",
    canonicalSpec: "2% milk 1 gallon",
    comparisonUnit: "USD/fl oz",
    normalizationUnit: "floz",
    fallbackRule: "A half gallon is shown as a close-size match and converted to the 1 gallon target.",
    targetAmount: 128,
    targetAmountLabel: "128 fl oz"
  },
  {
    id: "eggs",
    item: "Eggs",
    category: "essential",
    canonicalSpec: "large eggs 12 count",
    comparisonUnit: "USD/egg",
    normalizationUnit: "egg",
    fallbackRule: "18-count eggs are a close-size match; cage-free eggs stay out of the default comparison.",
    targetAmount: 12,
    targetAmountLabel: "12 eggs"
  },
  {
    id: "tuna",
    item: "Tuna",
    category: "essential",
    canonicalSpec: "chunk light tuna 5 oz can, 4 pack preferred",
    comparisonUnit: "USD/oz",
    normalizationUnit: "oz",
    fallbackRule: "Single cans are shown as unit-only comparisons.",
    targetAmount: 20,
    targetAmountLabel: "20 oz"
  },
  {
    id: "toothpaste",
    item: "Toothpaste",
    category: "essential",
    canonicalSpec: "standard cavity toothpaste 5.0-6.4 oz tube",
    comparisonUnit: "USD/oz",
    normalizationUnit: "oz",
    fallbackRule: "Whitening, sensitivity, and kids variants stay in separate groups.",
    targetAmount: 5.5,
    targetAmountLabel: "5.5 oz"
  },
  {
    id: "soap",
    item: "Bar soap",
    category: "essential",
    canonicalSpec: "bar soap multipack, 8-12 oz total soap weight",
    comparisonUnit: "USD/oz",
    normalizationUnit: "oz",
    fallbackRule: "Liquid soap is treated as a separate product.",
    targetAmount: 10,
    targetAmountLabel: "10 oz"
  },
  {
    id: "toilet-paper",
    item: "Toilet paper",
    category: "essential",
    canonicalSpec: "toilet paper pack normalized by total sheet count",
    comparisonUnit: "USD/100 sheets",
    normalizationUnit: "sheet100",
    fallbackRule: "We compare toilet paper by total sheet count, not roll label.",
    targetAmount: 2000,
    targetAmountLabel: "2,000 sheets"
  },
  {
    id: "detergent",
    item: "Laundry detergent",
    category: "essential",
    canonicalSpec: "liquid laundry detergent 90-100 fl oz",
    comparisonUnit: "USD/fl oz",
    normalizationUnit: "floz",
    fallbackRule: "Pods are treated as a different format.",
    targetAmount: 96,
    targetAmountLabel: "96 fl oz"
  }
];

export const PUBLISH_GATES = [
  "source URL exists",
  "collected timestamp exists",
  "store or ZIP context exists",
  "price type exists",
  "comparability grade exists",
  "coverage is 80% or higher, or basket is marked incomplete",
  "weekly ad and member-only values never mix into the default total"
];

export const DAILY_RUNBOOK = [
  "06:00 target store set review",
  "06:10 manual validation starts",
  "06:45 raw observations complete",
  "06:50 QA review for outliers and channel mismatch",
  "07:05 publish gate review",
  "07:15 daily basket snapshot publish",
  "07:30 digest email queue",
  "Afternoon: support and source policy review"
];

export const SOURCE_GOVERNANCE = {
  allowed: [
    "Official public product pages",
    "Official weekly ads",
    "Operator manual validation",
    "Store call confirmations",
    "Approved partner feeds"
  ],
  prohibited: [
    "Login-gated data",
    "Hidden API calls",
    "Anti-bot bypass",
    "Coupon auto-clipping",
    "Bulk unapproved scraping"
  ],
  scenarios: [
    "base_regular_total",
    "base_sale_total",
    "free_member_total",
    "coupon_required_total",
    "club_only_total",
    "weekly_ad_partial_total"
  ]
};
