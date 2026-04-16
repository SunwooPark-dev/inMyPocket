import { BasketSummary } from "../lib/domain";

type RetailerCardProps = {
  summary: BasketSummary;
  cheapestTotal: number;
  rank: number;
};

function recommendationLabel(rank: number) {
  if (rank === 0) return "Best choice";
  if (rank === 1) return "Next best";
  return "Higher today";
}

function membershipLine(summary: BasketSummary) {
  if (summary.retailer.membershipLabel === "No membership") {
    return "Standard public pricing";
  }

  return "Member pricing shown separately";
}

export function RetailerCard({ summary, cheapestTotal, rank }: RetailerCardProps) {
  const savingsGap = Math.max(0, summary.total - cheapestTotal);
  const recommendation = recommendationLabel(rank);
  const membership = membershipLine(summary);
  const showMembershipLine = summary.retailer.membershipLabel !== "No membership";
  const isBest = rank === 0;

  return (
    <article
      className={`retailer-card ${isBest ? "retailer-card--best" : "retailer-card--other"}`}
    >
      <div className="retailer-card__header">
        <div className="retailer-card__heading">
          <span
            className="retailer-card__swatch"
            style={{ backgroundColor: summary.retailer.color }}
            aria-hidden="true"
          />
          <h3>{summary.retailer.name}</h3>
        </div>
        {isBest ? <span className="pill pill--good">{recommendation}</span> : null}
      </div>

      <p className="retailer-card__price">${summary.total.toFixed(2)}</p>
      <p className="retailer-card__meta">
        {savingsGap === 0
          ? "Lowest total today"
          : `Costs $${savingsGap.toFixed(2)} more`}
      </p>
      {showMembershipLine ? (
        <p className="retailer-card__meta">{membership}</p>
      ) : null}
    </article>
  );
}
