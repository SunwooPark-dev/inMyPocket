import type { SourceQuality } from "./domain.ts";

export type SourceQualityFallback = "official_public_page";
export type SourceQualityGuideKey = SourceQuality | SourceQualityFallback;

export type SourceQualityMetadata = {
  label: string;
  guideLabel: string;
  guideDescription: string;
  printLabel: string;
  className: string;
  linkLabel: string;
};

export const SOURCE_QUALITY_FALLBACK: SourceQualityFallback = "official_public_page";

export const SOURCE_QUALITY_METADATA: Record<SourceQualityGuideKey, SourceQualityMetadata> = {
  item_page: {
    label: "Source: exact item page",
    guideLabel: "Exact item page",
    guideDescription: "Strongest check. This price came from the specific product page.",
    printLabel: "Exact item page",
    className: "comparison-cell__source comparison-cell__source--strong",
    linkLabel: "Open official source"
  },
  category_page: {
    label: "Source: broader official page",
    guideLabel: "Broader official page",
    guideDescription: "Official retailer page, but not always the exact product page.",
    printLabel: "Broader official page",
    className: "comparison-cell__source comparison-cell__source--broad",
    linkLabel: "Open official category page"
  },
  search_page: {
    label: "Source: search result - needs item-page check",
    guideLabel: "Search result",
    guideDescription: "Official retailer search result. Treat as a replacement candidate.",
    printLabel: "Search result - needs item-page check",
    className: "comparison-cell__source comparison-cell__source--needs-review",
    linkLabel: "Open official search result"
  },
  operator_verified: {
    label: "Source: operator verified",
    guideLabel: "Operator check",
    guideDescription: "Manual verification evidence exists in the operator workflow.",
    printLabel: "Operator verified",
    className: "comparison-cell__source comparison-cell__source--strong",
    linkLabel: "Open official source"
  },
  official_public_page: {
    label: "Source type not verified",
    guideLabel: "Type not verified",
    guideDescription: "Official link exists, but the page type still needs review.",
    printLabel: "Source type not verified",
    className: "comparison-cell__source comparison-cell__source--needs-review",
    linkLabel: "Open official source"
  }
};

export const SOURCE_QUALITY_GUIDE_ORDER: SourceQualityGuideKey[] = [
  "item_page",
  "category_page",
  "search_page",
  "operator_verified",
  SOURCE_QUALITY_FALLBACK
];

export function sourceQualityMetadata(sourceQuality: SourceQuality | undefined): SourceQualityMetadata {
  return SOURCE_QUALITY_METADATA[sourceQuality ?? SOURCE_QUALITY_FALLBACK];
}

export function sourceQualityLabel(sourceQuality: SourceQuality | undefined): string {
  return sourceQualityMetadata(sourceQuality).label;
}

export function sourceQualityClassName(sourceQuality: SourceQuality | undefined): string {
  return sourceQualityMetadata(sourceQuality).className;
}

export function sourceLinkLabel(sourceQuality: SourceQuality | undefined): string {
  return sourceQualityMetadata(sourceQuality).linkLabel;
}

export function sourceQualityPrintLabel(sourceQuality: SourceQuality | undefined): string {
  return sourceQualityMetadata(sourceQuality).printLabel;
}
