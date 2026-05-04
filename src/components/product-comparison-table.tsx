import { RETAILERS } from "../lib/catalog";
import type { ItemComparisonRow, RetailerId } from "../lib/domain";
import {
  SOURCE_QUALITY_GUIDE_ORDER,
  SOURCE_QUALITY_METADATA,
  sourceLinkLabel,
  sourceQualityClassName,
  sourceQualityLabel
} from "../lib/source-quality";
import { isAllowedSourceUrl } from "../lib/source-policy";

type ProductComparisonTableProps = {
  rows: ItemComparisonRow[];
  exactMatches: number;
  estimatedMatches: number;
  retailerIds: RetailerId[];
};

function unitLabel(unit: string) {
  if (unit === "USD/lb") return "Price per pound";
  if (unit === "USD/oz") return "Price per ounce";
  if (unit === "USD/fl oz") return "Price per fluid ounce";
  if (unit === "USD/egg") return "Price per egg";
  if (unit === "USD/100 sheets") return "Price per 100 sheets";
  return unit;
}

function priceTypeLabel(priceType: string) {
  if (priceType === "regular") return "Standard price";
  if (priceType === "sale") return "Sale price";
  if (priceType === "member") return "Member price";
  if (priceType === "coupon_required") return "Coupon-required price";
  if (priceType === "weekly_ad") return "Weekly ad price";
  return priceType.replaceAll("_", " ");
}

function gradeLabel(grade: string) {
  if (grade === "estimated-weight") return "Estimated fresh-item price";
  if (grade === "near-match") return "Close size match";
  if (grade === "partial") return "Partial";
  if (grade === "non-comparable") return "Non-comparable";
  return "Exact match";
}

export function ProductComparisonTable({
  rows,
  exactMatches,
  estimatedMatches,
  retailerIds
}: ProductComparisonTableProps) {
  const totalItems = rows.length;
  const activeRetailers = RETAILERS.filter((retailer) => retailerIds.includes(retailer.id));

  return (
    <div className="comparison-list">
      <div className="comparison-summary-banner">
        <p>
          {exactMatches} of {totalItems} items matched exactly today.
          {estimatedMatches > 0
            ? ` ${estimatedMatches} items used near-match or estimated pricing.`
            : ""}
        </p>
      </div>
      <div className="source-quality-guide" aria-label="Source quality guide">
        <p className="source-quality-guide__title">Source quality guide</p>
        <div className="source-quality-guide__list">
          {SOURCE_QUALITY_GUIDE_ORDER.map((qualityKey) => {
            const metadata = SOURCE_QUALITY_METADATA[qualityKey];

            return (
              <div key={qualityKey} className="source-quality-guide__item">
                <span className={metadata.className}>{metadata.guideLabel}</span>
                <span>{metadata.guideDescription}</span>
              </div>
            );
          })}
        </div>
      </div>

      {rows.map((row) => (
        <article key={row.item.id} className="comparison-row">
          <div className="comparison-row__heading">
            <h3>{row.item.item}</h3>
            <p>{row.item.canonicalSpec}</p>
            <p>Target basket amount: {row.item.targetAmountLabel}</p>
          </div>

          <div className="comparison-row__grid">
            {activeRetailers.map((retailer) => {
              const price = row.pricesByRetailer[retailer.id];
              const hasSafeSourceLink = price
                ? isAllowedSourceUrl(retailer.id, price.observation.sourceUrl)
                : false;

              return (
                <div key={retailer.id} className="comparison-cell">
                  <div className="comparison-cell__title">
                    <span
                      className="retailer-card__swatch"
                      style={{ backgroundColor: retailer.color }}
                      aria-hidden="true"
                    />
                    <span>{retailer.name}</span>
                  </div>

                  {price ? (
                    <>
                      <p className="comparison-cell__price">
                        ${price.estimatedBasketContribution.toFixed(2)}
                      </p>
                      <p className="comparison-cell__meta">
                        {unitLabel(row.item.comparisonUnit)}: ${price.normalizedUnitPrice.toFixed(2)}
                      </p>
                      <p className="comparison-cell__meta">
                        {priceTypeLabel(price.observation.priceType)} ·{" "}
                        {gradeLabel(price.observation.comparabilityGrade)}
                      </p>
                      <p className={sourceQualityClassName(price.observation.sourceQuality)}>
                        {sourceQualityLabel(price.observation.sourceQuality)}
                      </p>
                      {hasSafeSourceLink ? (
                        <a
                          className="comparison-source-link"
                          href={price.observation.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {sourceLinkLabel(price.observation.sourceQuality)}
                        </a>
                      ) : (
                        <p className="comparison-source-link comparison-source-link--unavailable">
                          Official source unavailable
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="comparison-cell__price">N/A</p>
                      <p className="comparison-cell__meta">Not available today</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="comparison-row__footer">
            <span className="pill pill--quiet">{row.item.fallbackRule}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
