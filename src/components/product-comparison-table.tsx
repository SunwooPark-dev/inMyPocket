import { RETAILERS } from "../lib/catalog";
import { ItemComparisonRow } from "../lib/domain";

type ProductComparisonTableProps = {
  rows: ItemComparisonRow[];
  exactMatches: number;
  estimatedMatches: number;
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
  estimatedMatches
}: ProductComparisonTableProps) {
  const totalItems = rows.length;

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

      {rows.map((row) => (
        <article key={row.item.id} className="comparison-row">
          <div className="comparison-row__heading">
            <h3>{row.item.item}</h3>
            <p>{row.item.canonicalSpec}</p>
            <p>Target basket amount: {row.item.targetAmountLabel}</p>
          </div>

          <div className="comparison-row__grid">
            {RETAILERS.map((retailer) => {
              const price = row.pricesByRetailer[retailer.id];

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
