import Link from "next/link";

import { PILOT_CLUSTERS, RETAILERS } from "../../lib/catalog";
import {
  SCENARIO_LABELS,
  resolveComparisonScenario
} from "../../lib/comparison-scenarios";
import { buildItemRows, getPublishableBasketSummaries } from "../../lib/compare";
import { resolveZipRequest } from "../../lib/location-context";
import { getPublicEffectiveObservations } from "../../lib/server-storage";
import { PrintButton } from "../../components/print-button";

type PrintablePageProps = {
  searchParams?: Promise<{
    zip?: string;
    scenario?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function PrintablePage({ searchParams }: PrintablePageProps) {
  const params = (await searchParams) ?? {};
  const zipResolution = resolveZipRequest(params.zip);
  const zipCode = zipResolution.pricingZip;
  const scenario = resolveComparisonScenario(params.scenario);
  const cluster = PILOT_CLUSTERS.find((candidate) => candidate.zipCode === zipCode) ?? PILOT_CLUSTERS[0];
  const observations = await getPublicEffectiveObservations();
  const summaries = getPublishableBasketSummaries(zipCode, scenario, observations);
  const cheapest = summaries[0];
  const rows = buildItemRows(zipCode, scenario, observations);
  const nextBest = summaries[1];

  if (zipResolution.invalidZip || zipResolution.unsupportedZip) {
    return (
      <main className="page-shell printable-page">
        <section className="print-header">
          <div className="print-summary">
            <p className="hero__eyebrow">Large-print shopping list</p>
            <h1>Pilot area required</h1>
            <p className="print-summary__stat">
              {zipResolution.invalidZip
                ? "Enter a valid 5-digit ZIP code on the homepage first."
                : `We don’t support ${zipResolution.unsupportedZip} yet.`}
            </p>
            <p className="print-summary__note">
              Printable checklists stay cheapest-only for our current pilot ZIPs.
            </p>
          </div>

          <div className="print-header__actions">
            <Link className="print-back-link" href={`/?scenario=${scenario}`}>
              Back to dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!cheapest) {
    return (
      <main className="page-shell printable-page">
        <section className="print-header">
          <div className="print-summary">
            <p className="hero__eyebrow">Large-print shopping list</p>
            <h1>{cluster.label} grocery plan</h1>
            <p className="print-summary__stat">We couldn’t compare this basket right now.</p>
            <p>Please try again later.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell printable-page">
      <section className="print-header">
        <div className="print-summary">
          <p className="hero__eyebrow">Large-print shopping list</p>
          <h1>{cluster.label} grocery plan</h1>
          <p className="print-summary__helper">Price view: {SCENARIO_LABELS[scenario]}</p>
          <p className="print-summary__stat">Shop here today: {cheapest.retailer.name}</p>
          <p className="print-summary__stat">Expected basket total: ${cheapest.total.toFixed(2)}</p>
          <p className="print-summary__helper">
            {nextBest
              ? `Save about $${(nextBest.total - cheapest.total).toFixed(2)} vs next best`
              : "This is the best available option today"}
          </p>
          <p className="print-summary__note">This checklist follows today’s lowest-cost store plan.</p>
          <p className="print-summary__note">
            Closest-store context stays on the homepage so this printable list stays price-first.
          </p>
        </div>

        <div className="print-header__actions">
          <PrintButton />
          <Link className="print-back-link" href={`/?zip=${zipCode}&scenario=${scenario}`}>
            Back to dashboard
          </Link>
        </div>
      </section>

      <section className="print-list">
        {rows.map((row) => {
          const pricedStores = Object.entries(row.pricesByRetailer)
            .filter(([, value]) => value !== null)
            .sort(
              (left, right) =>
                (left[1]?.estimatedBasketContribution ?? 0) -
                (right[1]?.estimatedBasketContribution ?? 0)
            );
          const leader = pricedStores[0];
          const leaderPrice = leader?.[1] ?? null;
          const retailerName =
            RETAILERS.find((retailer) => retailer.id === leader?.[0])?.name ?? "No verified option";
          const shouldShowNote =
            !leaderPrice || leaderPrice.observation.comparabilityGrade !== "exact";

          return (
            <article key={row.item.id} className="print-item">
              <div className="print-item__checkbox" aria-hidden="true" />
              <div className="print-item__content">
                <h2>{row.item.item}</h2>
                <p className="print-item__target">Buy: {row.item.targetAmountLabel}</p>
                <p className="print-item__best">
                  Best today:{" "}
                  {leader
                    ? `${retailerName} · $${leader[1]?.estimatedBasketContribution.toFixed(2)}`
                    : "No verified option"}
                </p>
                {shouldShowNote ? <p className="print-item__note">{row.item.fallbackRule}</p> : null}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
