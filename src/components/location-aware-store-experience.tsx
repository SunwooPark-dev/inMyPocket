"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { PILOT_CLUSTERS } from "../lib/catalog";
import type {
  BasketSummary,
  Coordinates,
  LocationMode,
  LocationSource
} from "../lib/domain";
import {
  LOCATION_MEMORY_KEYS,
  buildNearestStoreContext,
  buildNearestStoreSummaryCopy,
  getClusterCoordinates,
  isSupportedPilotZip
} from "../lib/location-context";
import { RetailerCard } from "./retailer-card";

type LocationAwareStoreExperienceProps = {
  currentZip: string;
  initialZipInput: string;
  scenario: string;
  hasExplicitZip: boolean;
  initialLocationSource: Exclude<LocationSource, "browser_geo">;
  invalidZip?: string | null;
  unsupportedZip?: string | null;
  summaries?: BasketSummary[];
};

function isLocationMode(value: string | null): value is LocationMode {
  return value === "zip" || value === "gps";
}

function buildDashboardHref(pathname: string, zipCode: string, scenario: string) {
  return `${pathname}?zip=${zipCode}&scenario=${scenario}`;
}

export function LocationAwareStoreExperience({
  currentZip,
  initialZipInput,
  scenario,
  hasExplicitZip,
  initialLocationSource,
  invalidZip = null,
  unsupportedZip = null,
  summaries = []
}: LocationAwareStoreExperienceProps) {
  const pathname = usePathname();
  const router = useRouter();
  const geolocationRequestedRef = useRef(false);
  const hasRequestedGeolocationRef = useRef(false);
  const [zipInput, setZipInput] = useState(initialZipInput);
  const [formMessage, setFormMessage] = useState("");
  const [locationMode, setLocationMode] = useState<LocationMode>(() => {
    if (typeof window === "undefined") {
      return "zip";
    }

    const rememberedMode = window.localStorage.getItem(LOCATION_MEMORY_KEYS.locationMode);
    return isLocationMode(rememberedMode) ? rememberedMode : "zip";
  });
  const [browserCoordinates, setBrowserCoordinates] = useState<Coordinates | null>(null);
  const [geoMessage, setGeoMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!hasExplicitZip) {
      const rememberedZip = window.localStorage.getItem(LOCATION_MEMORY_KEYS.selectedZip);
      if (rememberedZip && isSupportedPilotZip(rememberedZip) && rememberedZip !== currentZip) {
        router.replace(buildDashboardHref(pathname, rememberedZip, scenario));
      }
    }
  }, [currentZip, hasExplicitZip, pathname, router, scenario]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!invalidZip && !unsupportedZip && isSupportedPilotZip(currentZip)) {
      window.localStorage.setItem(LOCATION_MEMORY_KEYS.selectedZip, currentZip);
    }
  }, [currentZip, invalidZip, unsupportedZip]);

  useEffect(() => {
    if (
      locationMode !== "gps" ||
      !hasRequestedGeolocationRef.current ||
      browserCoordinates ||
      geolocationRequestedRef.current ||
      typeof navigator === "undefined" ||
      !("geolocation" in navigator)
    ) {
      return;
    }

    geolocationRequestedRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBrowserCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setGeoMessage("Using your current location for nearest-store distance.");
      },
      () => {
        setLocationMode("zip");
        setGeoMessage("Using ZIP-based distance because browser location was unavailable.");
        if (typeof window !== "undefined") {
          window.localStorage.setItem(LOCATION_MEMORY_KEYS.locationMode, "zip");
        }
      },
      {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 10,
        timeout: 5000
      }
    );
  }, [browserCoordinates, locationMode]);

  const originCoordinates = browserCoordinates ?? getClusterCoordinates(currentZip);
  const effectiveLocationSource: LocationSource =
    browserCoordinates && locationMode === "gps" ? "browser_geo" : initialLocationSource;

  const nearestContext = useMemo(() => {
    if (summaries.length === 0) {
      return null;
    }

    return buildNearestStoreContext({
      pricingZip: currentZip,
      locationSource: effectiveLocationSource,
      distanceSource: browserCoordinates ? "browser-geo" : "zip-centroid",
      summaries,
      origin: originCoordinates
    });
  }, [browserCoordinates, currentZip, effectiveLocationSource, originCoordinates, summaries]);

  const cheapest = summaries[0] ?? null;
  const nearestStore = nearestContext?.nearestOverallStore ?? null;
  const nearestStoreName = nearestStore?.label ?? "";
  const nearestSummary = summaries.find((summary) => summary.store.id === nearestStore?.id) ?? null;
  const cheapestStoreName = cheapest?.retailer.name ?? "";
  const savingsAmount =
    nearestSummary && cheapest ? Math.max(0, nearestSummary.total - cheapest.total) : 0;

  const nearestSummaryCopy =
    nearestStore && cheapest
      ? buildNearestStoreSummaryCopy({
          nearestStoreName,
          nearestDistanceMiles: nearestContext?.nearestOverallDistanceMiles ?? null,
          cheapestStoreName,
          savingsAmount,
          nearestMatchesCheapest: nearestStore.id === cheapest.store.id,
          nearestHasPublishableBasket: Boolean(nearestSummary),
          locationSource: effectiveLocationSource
        })
      : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedZip = zipInput.trim();
    if (!/^\d{5}$/.test(normalizedZip)) {
      setFormMessage("Enter a valid 5-digit ZIP code.");
      return;
    }

    setFormMessage("");
    router.push(buildDashboardHref(pathname, normalizedZip, scenario));
  }

  function handleUseMyLocation() {
    setLocationMode("gps");
    setGeoMessage("");
    hasRequestedGeolocationRef.current = true;
    geolocationRequestedRef.current = false;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCATION_MEMORY_KEYS.locationMode, "gps");
    }
  }

  function handleUseZipOnly() {
    setLocationMode("zip");
    setBrowserCoordinates(null);
    setGeoMessage("Using ZIP-based nearest-store context.");
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCATION_MEMORY_KEYS.locationMode, "zip");
    }
  }

  return (
    <section className="location-experience">
      <form className="location-form" onSubmit={handleSubmit}>
        <label className="location-form__label">
          Enter ZIP code
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}"
            value={zipInput}
            onChange={(event) => setZipInput(event.target.value)}
            placeholder="30328"
            aria-describedby="location-form-help"
          />
        </label>

        <div className="location-form__actions">
          <button type="submit" className="button">
            Update area
          </button>
          <button type="button" className="button button--secondary" onClick={handleUseMyLocation}>
            Use my location
          </button>
          <button type="button" className="button button--secondary" onClick={handleUseZipOnly}>
            Use ZIP only
          </button>
        </div>

        <p className="toolbar__help" id="location-form-help">
          We keep the cheapest-store answer based on your ZIP. Your browser location only helps us show which tracked branch is closest.
        </p>

        <div className="chip-row">
          {PILOT_CLUSTERS.map((cluster) => (
            <Link
              key={cluster.zipCode}
              className={`chip ${cluster.zipCode === currentZip ? "chip--active" : ""}`}
              href={buildDashboardHref(pathname, cluster.zipCode, scenario)}
            >
              {cluster.label}
            </Link>
          ))}
        </div>

        {formMessage ? <p className="form-message form-message--error">{formMessage}</p> : null}
        {invalidZip ? (
          <p className="form-message form-message--error">
            “{invalidZip}” is not a valid 5-digit ZIP code.
          </p>
        ) : null}
        {unsupportedZip ? (
          <p className="form-message form-message--error">
            We don’t support {unsupportedZip} yet. Try one of our current pilot areas instead.
          </p>
        ) : null}
        {geoMessage ? <p className="form-message">{geoMessage}</p> : null}
      </form>

      {nearestContext && cheapest && nearestStore && nearestSummaryCopy ? (
        <>
          <section className="nearest-store-card" id="closest-store">
            <p className="decision-card__eyebrow">Closest store to you</p>
            <h2>{nearestStore.label}</h2>
            <p className="nearest-store-card__meta">{nearestStore.streetAddress}</p>
            <p className="nearest-store-card__meta">
              {nearestContext.nearestOverallDistanceMiles !== null
                ? `About ${nearestContext.nearestOverallDistanceMiles.toFixed(1)} miles away`
                : "Distance unavailable"}
            </p>
            <p className="hero__lede">{nearestSummaryCopy.headline}</p>
            <p className="toolbar__help">{nearestSummaryCopy.detail}</p>
          </section>

          <section className="store-strip">
            <div className="store-strip__header">
              <h2>Compare nearby stores</h2>
              <p className="toolbar__help">
                Cheapest ranking stays price-first for ZIP {currentZip}. Distance is shown only as context.
              </p>
            </div>
            <div className="retailer-grid">
              {summaries.map((summary, index) => (
                <RetailerCard
                  key={summary.store.id}
                  summary={summary}
                  cheapestTotal={cheapest.total}
                  rank={index}
                  distanceMiles={nearestContext.distancesByStoreId[summary.store.id] ?? null}
                  isNearest={summary.store.id === nearestStore.id}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
