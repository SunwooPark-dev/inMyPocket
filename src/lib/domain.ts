export type RetailerId = "kroger" | "aldi" | "walmart";

export type PriceType =
  | "regular"
  | "sale"
  | "member"
  | "coupon_required"
  | "club_only"
  | "weekly_ad";

export type ChannelType =
  | "product_page"
  | "pickup"
  | "delivery"
  | "weekly_ad"
  | "store_call";

export type MeasurementUnit = "lb" | "oz" | "floz" | "egg" | "sheet";
export type NormalizationUnit = "lb" | "oz" | "floz" | "egg" | "sheet100";

export type ComparabilityGrade =
  | "exact"
  | "near-match"
  | "estimated-weight"
  | "partial"
  | "non-comparable";

export type ComparisonScenario =
  | "base_regular_total"
  | "base_sale_total"
  | "free_member_total"
  | "coupon_required_total"
  | "club_only_total"
  | "weekly_ad_partial_total";

export type ConfidenceLevel = "high" | "medium" | "low";
export type FoundingMemberSignupStatus =
  | "pending_checkout"
  | "paid"
  | "canceled"
  | "payment_failed"
  | "weekly_updates_subscribed";

export interface PilotCluster {
  zipCode: string;
  label: string;
  county: string;
  note: string;
}

export interface RetailerProfile {
  id: RetailerId;
  name: string;
  color: string;
  publicVisibility: "high" | "medium" | "low";
  complianceRisk: "low" | "medium" | "high";
  membershipLabel: string;
  officialDomains: string[];
  notes: string;
}

export interface StoreLocation {
  id: string;
  retailerId: RetailerId;
  zipCode: string;
  label: string;
  addressHint: string;
}

export interface AnchorBasketItem {
  id: string;
  item: string;
  category: "fruit" | "vegetable" | "protein" | "essential";
  canonicalSpec: string;
  comparisonUnit: string;
  normalizationUnit: NormalizationUnit;
  fallbackRule: string;
  targetAmount: number;
  targetAmountLabel: string;
}

export interface PriceObservation {
  id: string;
  canonicalProductId: string;
  retailerId: RetailerId;
  storeId: string;
  zipCode: string;
  channel: ChannelType;
  priceType: PriceType;
  priceAmount: number;
  measurementValue: number;
  measurementUnit: MeasurementUnit;
  packLabel: string;
  comparabilityGrade: ComparabilityGrade;
  sourceUrl: string;
  sourceLabel: string;
  collectedAt: string;
  confidence: ConfidenceLevel;
  notes?: string;
  isEstimatedWeight?: boolean;
  isMembershipRequired?: boolean;
  isCouponRequired?: boolean;
  isClubOnly?: boolean;
  evidenceId?: string | null;
  evidenceOriginalName?: string | null;
  evidenceContentType?: string | null;
  evidenceByteSize?: number | null;
  evidenceUploadedAt?: string | null;
}

export interface SelectedPrice {
  observation: PriceObservation;
  normalizedUnitPrice: number;
  estimatedBasketContribution: number;
}

export interface BasketSummary {
  retailer: RetailerProfile;
  store: StoreLocation;
  selectedPrices: SelectedPrice[];
  total: number;
  comparableCount: number;
  coverageRate: number;
  blockers: string[];
  publishReady: boolean;
}

export interface ItemComparisonRow {
  item: AnchorBasketItem;
  pricesByRetailer: Record<RetailerId, SelectedPrice | null>;
}

export interface PreviewResult {
  normalizedUnitPrice: number;
  estimatedBasketContribution: number;
  blockers: string[];
  publishReady: boolean;
}

export interface ObservationEvidence {
  id: string;
  storagePath: string;
  originalName: string;
  contentType: string;
  byteSize: number;
  uploadedAt: string;
}

export interface FoundingMemberSignup {
  id: string;
  email: string;
  zipCode: string;
  planCode: string;
  status: FoundingMemberSignupStatus;
  stripeCustomerId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeSubscriptionId?: string | null;
  createdAt: string;
  updatedAt: string;
}
