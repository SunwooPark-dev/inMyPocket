import Link from "next/link";

import { PILOT_CLUSTERS } from "../lib/catalog";
import {
  PUBLIC_COMPARISON_SCENARIOS,
  SCENARIO_LABELS,
  getScenarioHelpText,
  resolveComparisonScenario
} from "../lib/comparison-scenarios";
import {
  buildItemRows,
  getLastCollectedAt,
  getPublishableBasketSummaries
} from "../lib/compare";
import { RetailerId } from "../lib/domain";
import { isPaymentFlowEnabled } from "../lib/env";
import { resolveZipRequest } from "../lib/location-context";
import { getPublicEffectiveObservations } from "../lib/server-storage";
import { LocationAwareStoreExperience } from "../components/location-aware-store-experience";
import { ProductComparisonTable } from "../components/product-comparison-table";
import { SectionCard } from "../components/section-card";
import { WaitlistForm } from "../components/waitlist-form";

type HomePageProps = {
  searchParams?: Promise<{
    zip?: string;
    scenario?: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatCheckedLabel(value: string | undefined) {
  if (!value) {
    return "Checked recently";
  }

  const date = new Date(value);
  const now = new Date();
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);

  if (date.toDateString() === now.toDateString()) {
    return `Checked today at ${time}`;
  }

  const monthDay = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric"
  }).format(date);

  return `Checked ${monthDay} at ${time}`;
}

function getMatchSummary(
  rows: Awaited<ReturnType<typeof buildItemRows>>,
  retailerId: RetailerId
) {
  let exactMatches = 0;
  let estimatedMatches = 0;
  let availableMatches = 0;

  rows.forEach((row) => {
    const selected = row.pricesByRetailer[retailerId];

    if (!selected) {
      return;
    }

    availableMatches += 1;

    if (selected.observation.comparabilityGrade === "exact") {
      exactMatches += 1;
      return;
    }

    estimatedMatches += 1;
  });

  return {
    exactMatches,
    estimatedMatches,
    availableMatches
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const zipResolution = resolveZipRequest(params.zip);
  const zipCode = zipResolution.pricingZip;
  const scenario = resolveComparisonScenario(params.scenario);
  const paymentEnabled = isPaymentFlowEnabled();
  const observations = await getPublicEffectiveObservations();
  const summaries = getPublishableBasketSummaries(zipCode, scenario, observations);
  const cheapest = summaries[0];
  const nextBest = summaries[1];
  const rows = buildItemRows(zipCode, scenario, observations);
  const lastCollectedAt = getLastCollectedAt(zipCode, observations);
  const locationExperienceProps = {
    currentZip: zipCode,
    initialZipInput: zipResolution.invalidZip || zipResolution.unsupportedZip ? params.zip?.trim() ?? "" : zipCode,
    scenario,
    hasExplicitZip: zipResolution.hasExplicitZip,
    initialLocationSource: zipResolution.locationSource
  } as const;

  if (zipResolution.invalidZip || zipResolution.unsupportedZip) {
    return (
      <main className="page-shell">
        <section className="hero">
          <div className="hero__content">
            <p className="hero__eyebrow">North Atlanta pilot for older households</p>
            <h1>See which grocery store is cheapest today for your regular basket.</h1>
            <p className="hero__lede">
              {zipResolution.invalidZip
                ? "Enter a valid 5-digit ZIP code to compare pilot-area stores."
                : `We don’t support ${zipResolution.unsupportedZip} yet. Choose one of our pilot areas to continue.`}
            </p>
          </div>
        </section>

        <LocationAwareStoreExperience
          {...locationExperienceProps}
          invalidZip={zipResolution.invalidZip}
          unsupportedZip={zipResolution.unsupportedZip}
        />
      </main>
    );
  }

  if (!cheapest) {
    return (
      <main className="page-shell">
        <section className="hero">
          <div className="hero__content">
            <p className="hero__eyebrow">North Atlanta pilot for older households</p>
            <h1>See which grocery store is cheapest today for your regular basket.</h1>
            <p className="hero__lede">
              We couldn&apos;t compare this basket right now. Please try again in a little while.
            </p>
            <div className="hero__actions">
              <Link className="button button--secondary" href={`/printable?zip=${zipCode}&scenario=${scenario}`}>
                Print a large-text shopping list
              </Link>
            </div>
          </div>
        </section>
        <LocationAwareStoreExperience
          {...locationExperienceProps}
          summaries={[]}
        />
      </main>
    );
  }

  const cheapestRetailerId = cheapest.store.retailerId;
  const matchSummary = getMatchSummary(rows, cheapestRetailerId);
  const checkedLabel = formatCheckedLabel(lastCollectedAt);
  const savingsAmount = nextBest ? Math.max(0, nextBest.total - cheapest.total) : 0;

  const detailSummary =
    matchSummary.estimatedMatches > 0
      ? `${matchSummary.exactMatches} of 20 items matched exactly today. ${matchSummary.estimatedMatches} items used near-match or estimated pricing.`
      : `${matchSummary.exactMatches} of 20 items matched exactly today.`;
  const detailDisclosureCopy =
    matchSummary.estimatedMatches > 0
      ? "Includes item notes and estimated items."
      : "Includes the full item-by-item comparison.";
  const reliabilityCopy =
    matchSummary.availableMatches >= 18
      ? matchSummary.estimatedMatches > 0
        ? "A few items estimated today."
        : "Most items matched closely."
      : "Some items use near-size or estimated pricing today.";

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">North Atlanta pilot for older households</p>
          <h1>See which grocery store is cheapest today for your regular basket.</h1>
          <p className="hero__lede">
            We compare the same basket across nearby stores, show when prices were last checked,
            and avoid coupon tricks.
          </p>
          <ul className="decision-proof-list" aria-label="Trust signals for today’s answer">
            <li>{checkedLabel}</li>
            <li>{detailSummary}</li>
            <li>Uses public prices and labels estimated items clearly.</li>
          </ul>

          <div className="hero__actions">
            <Link className="button" href="#today-answer">
              See today&apos;s cheapest store
            </Link>
            <Link className="button button--secondary" href={`/printable?zip=${zipCode}&scenario=${scenario}`}>
              Print today&apos;s cheapest-store checklist
            </Link>
          </div>
        </div>
      </section>

      <section className="decision-card" id="today-answer">
        <p className="decision-card__eyebrow">Best place to shop today</p>
        <div className="decision-card__grid">
          <div className="decision-card__content">
            <h2>{cheapest.retailer.name}</h2>
            <p className="decision-card__price">${cheapest.total.toFixed(2)}</p>
            <p className="decision-card__meta">
              {savingsAmount > 0
                ? `Save $${savingsAmount.toFixed(2)} vs next best`
                : "This is the best available option today"}
            </p>
          </div>

          <div className="decision-card__support">
            <ul className="decision-proof-list">
              <li>Same 20-item basket.</li>
              <li>{checkedLabel}</li>
              <li>{reliabilityCopy}</li>
            </ul>
            <div className="hero__actions">
              <Link className="button button--secondary" href="#weekly-updates">
                Get weekly updates for this basket
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LocationAwareStoreExperience
        {...locationExperienceProps}
        summaries={summaries}
      />

      <SectionCard title="Keep this basket answer each week" variant="support">
        <div className="offer-card" id="weekly-updates">
          <p className="hero__lede">
            Get one simple weekly email showing where this basket is cheapest before you shop again.
          </p>
          <ul className="compact-list compact-list--wide">
            <li>Non-payment updates only in the current environment.</li>
            <li>Use it for yourself or if you shop for a parent or older family member.</li>
            <li>We keep the same basket and trust notes used in today&apos;s answer.</li>
          </ul>
          <WaitlistForm defaultZip={zipCode} checkoutEnabled={paymentEnabled} />
        </div>
      </SectionCard>

      <SectionCard title="Why you can trust today’s answer">
        <ul className="compact-list compact-list--wide">
          <li>We compare the same basket using public prices and show when prices were last checked.</li>
          <li>Default view avoids coupon tricks and hidden discounts.</li>
          <li>
            {matchSummary.estimatedMatches > 0
              ? "A few items use near-match or estimated pricing today, and we label that clearly."
              : "If a price is estimated or only a close-size match, we label it clearly."}
          </li>
        </ul>
      </SectionCard>

      <SectionCard title="Item-by-item prices">
        <details className="detail-disclosure">
          <summary className="detail-disclosure__summary">
            <span>Open the full item list</span>
            <span className="summary-note">{detailDisclosureCopy}</span>
          </summary>
          <div className="detail-disclosure__body">
            <ProductComparisonTable
              rows={rows}
              exactMatches={matchSummary.exactMatches}
              estimatedMatches={matchSummary.estimatedMatches}
            />
          </div>
        </details>
      </SectionCard>

      <section className="toolbar consumer-toolbar">
        <details className="detail-disclosure detail-disclosure--controls">
          <summary className="detail-disclosure__summary">
            <span>Compare a different area or price view</span>
            <span className="summary-note">Use this only if you want a different comparison.</span>
          </summary>
          <div className="detail-disclosure__body">
            <div className="toolbar__group">
              <span className="toolbar__label">Pilot area</span>
              <div className="chip-row">
                {PILOT_CLUSTERS.map((candidate) => (
                  <Link
                    key={candidate.zipCode}
                    className={`chip ${candidate.zipCode === zipCode ? "chip--active" : ""}`}
                    href={`/?zip=${candidate.zipCode}&scenario=${scenario}`}
                  >
                    {candidate.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="toolbar__group">
              <span className="toolbar__label">Price view</span>
              <div className="chip-row">
                {PUBLIC_COMPARISON_SCENARIOS.map((candidate) => (
                  <Link
                    key={candidate}
                    className={`chip ${candidate === scenario ? "chip--active" : ""}`}
                    href={`/?zip=${zipCode}&scenario=${candidate}`}
                  >
                    {SCENARIO_LABELS[candidate]}
                  </Link>
                ))}
              </div>
              <p className="toolbar__help">{getScenarioHelpText(scenario)}</p>
            </div>
          </div>
        </details>
      </section>

    </main>
  );
}
