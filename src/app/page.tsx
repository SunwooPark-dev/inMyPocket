import Link from "next/link";

import { PILOT_CLUSTERS, STORES } from "../lib/catalog";
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
import { buildComparisonUnavailableState } from "../lib/comparison-availability";
import { isPaymentFlowEnabled } from "../lib/env";
import { resolveZipRequest } from "../lib/location-context";
import {
  getPublicEffectiveObservations,
  readPublicStoredObservations
} from "../lib/public-observation-server";
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

function formatCoverageLabel(exactMatches: number, estimatedMatches: number) {
  return estimatedMatches > 0
    ? `${exactMatches} exact items, ${estimatedMatches} estimated or near-match`
    : `${exactMatches} exact items checked today`;
}

function hasAnyComparedPrices(rows: Awaited<ReturnType<typeof buildItemRows>>) {
  return rows.some((row) => Object.values(row.pricesByRetailer).some((price) => Boolean(price)));
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
  const cluster = PILOT_CLUSTERS.find((candidate) => candidate.zipCode === zipCode) ?? null;
  let observations = [] as Awaited<ReturnType<typeof getPublicEffectiveObservations>>;
  let rawPublicObservations = [] as Awaited<ReturnType<typeof readPublicStoredObservations>>;
  let comparisonLoadError: string | null = null;

  try {
    observations = await getPublicEffectiveObservations();
    rawPublicObservations = await readPublicStoredObservations();
  } catch (error) {
    comparisonLoadError = error instanceof Error ? error.message : "Unknown comparison load failure.";
  }

  const summaries = getPublishableBasketSummaries(zipCode, scenario, observations);
  const cheapest = summaries[0];
  const nextBest = summaries[1];
  const rowObservations = cheapest ? observations : rawPublicObservations;
  const rows = buildItemRows(zipCode, scenario, rowObservations);
  const activeRetailerIds = STORES.filter((store) => store.zipCode === zipCode).map((store) => store.retailerId);
  const hasAnyPrices = hasAnyComparedPrices(rows);
  const lastCollectedAt = getLastCollectedAt(zipCode, rowObservations);
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
    const unavailableState = buildComparisonUnavailableState({
      reason: comparisonLoadError ? "runtime-config-or-fetch-failure" : "no-published-data-for-this-zip",
      zipCode,
      cluster,
      errorMessage: comparisonLoadError
    });

    return (
      <main className="page-shell">
        <section className="hero">
          <div className="hero__content">
            <p className="hero__eyebrow">Senior-first grocery savings pilot</p>
            <h1>{unavailableState.title}</h1>
            <p className="hero__lede">{unavailableState.detail}</p>
            <ul className="decision-proof-list" aria-label="Comparison unavailable guidance">
              <li>{unavailableState.helper}</li>
              <li>Weekly updates can still notify you when the next verified basket is ready.</li>
              <li>ZIP and print actions stay available so you can try another pilot area.</li>
            </ul>
            <div className="hero__actions">
              <Link className="button button--secondary" href={`/printable?zip=${zipCode}&scenario=${scenario}`}>
                Print a large-text shopping list
              </Link>
              <Link className="button" href="#weekly-updates">
                Get weekly updates
              </Link>
            </div>
          </div>
        </section>
        <LocationAwareStoreExperience
          {...locationExperienceProps}
          summaries={[]}
        />
        {hasAnyPrices ? (
          <SectionCard eyebrow="Verified local prices" title="We have some live prices, but not a full basket yet">
            <p className="hero__lede">
              This area already has verified local item prices, but not enough governed coverage yet to publish a full lowest-total basket answer.
            </p>
            <ProductComparisonTable
              rows={rows}
              exactMatches={rows.filter((row) =>
                Object.values(row.pricesByRetailer).some(
                  (price) => price?.observation.comparabilityGrade === "exact"
                )
              ).length}
              estimatedMatches={rows.filter((row) =>
                Object.values(row.pricesByRetailer).some(
                  (price) => Boolean(price) && price?.observation.comparabilityGrade !== "exact"
                )
              ).length}
              retailerIds={activeRetailerIds}
            />
          </SectionCard>
        ) : null}
        <SectionCard eyebrow="Weekly planning" title="Get this basket answer when it is ready" variant="support">
          <div className="offer-card" id="weekly-updates">
            <p className="hero__lede">
              We will email you when a verified basket is available for this area again.
            </p>
            <ul className="compact-list compact-list--wide">
              <li>Non-payment updates only in the current environment.</li>
              <li>Useful if you shop for yourself or for an older family member.</li>
              <li>We only send the basket answer after a governed published comparison is ready.</li>
            </ul>
            <WaitlistForm defaultZip={zipCode} checkoutEnabled={paymentEnabled} />
          </div>
        </SectionCard>
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
  const coverageLabel = formatCoverageLabel(matchSummary.exactMatches, matchSummary.estimatedMatches);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">Senior-first grocery savings pilot</p>
          <div className="trust-bar" aria-label="Current basket context">
            <span className="pill pill--quiet">{cluster ? `${cluster.label} · ${zipCode}` : `ZIP ${zipCode}`}</span>
            <span className="pill pill--quiet">{checkedLabel}</span>
            <span className="pill pill--quiet">{coverageLabel}</span>
          </div>
          <h1>Where should you shop today for the lowest grocery total?</h1>
          <p className="hero__lede">
            We compare the same 20-item basket across nearby stores, keep the answer tied to your ZIP,
            and show exactly why the recommendation is trustworthy.
          </p>
          <ul className="decision-proof-list" aria-label="Trust signals for today’s answer">
            <li>Same basket at every store, so the total is directly comparable.</li>
            <li>{detailSummary}</li>
            <li>Public price sources only, with estimated items labeled clearly.</li>
          </ul>

          <div className="hero__actions">
            <Link className="button" href="#today-answer">
              See today&apos;s answer
            </Link>
            <Link className="button button--secondary" href={`/printable?zip=${zipCode}&scenario=${scenario}`}>
              Print a large-text shopping list
            </Link>
          </div>
        </div>
      </section>

      <section className="decision-card" id="today-answer">
        <p className="decision-card__eyebrow">Today&apos;s lowest total</p>
        <div className="decision-card__grid">
          <div className="decision-card__content">
            <h2>{cheapest.retailer.name}</h2>
            <p className="decision-card__price">${cheapest.total.toFixed(2)}</p>
            <p className="decision-card__meta">
              {savingsAmount > 0
                ? `Save $${savingsAmount.toFixed(2)} compared with the next best store`
                : "This is the best available option today"}
            </p>
          </div>

          <div className="decision-card__support">
            <ul className="decision-proof-list">
              <li>Area checked: {cluster ? `${cluster.label} (${zipCode})` : zipCode}</li>
              <li>{checkedLabel}</li>
              <li>{reliabilityCopy}</li>
              <li>Designed to be easy to share with a spouse, parent, or caregiver.</li>
            </ul>
            <div className="hero__actions">
              <Link className="button button--secondary" href="#weekly-updates">
                Get this answer each week
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="hero__stats" aria-label="Quick trust summary">
        <article className="stat-card">
          <span>Area</span>
          <strong>{cluster ? cluster.label : zipCode}</strong>
          <p className="toolbar__help">The basket answer stays tied to this ZIP unless you change it.</p>
        </article>
        <article className="stat-card">
          <span>Basket coverage</span>
          <strong>{matchSummary.availableMatches}/20</strong>
          <p className="toolbar__help">Coverage is checked before a basket is shown as publish-ready.</p>
        </article>
        <article className="stat-card">
          <span>Trust note</span>
          <strong>Public sources</strong>
          <p className="toolbar__help">Coupon tricks are separated from the default answer.</p>
        </article>
      </section>

      <LocationAwareStoreExperience
        {...locationExperienceProps}
        summaries={summaries}
      />

      <SectionCard eyebrow="Weekly planning" title="Keep this basket answer each week" variant="support">
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

      <SectionCard eyebrow="Trust" title="Why this answer is easy to trust">
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

      <SectionCard eyebrow="Details" title="Item-by-item prices">
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
              retailerIds={activeRetailerIds}
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
