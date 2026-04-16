import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBasketSummary,
  previewObservation
} from "../src/lib/compare.ts";
import { getAcceptedLimits } from "../src/lib/accepted-limits.ts";
import { getExternalBlockers } from "../src/lib/external-blockers.ts";
import { getExternalProofHandoff } from "../src/lib/external-proof-handoff.ts";
import { getOperatorNextActions } from "../src/lib/operator-next-actions.ts";
import {
  ALL_COMPARISON_SCENARIOS,
  SCENARIO_LABELS,
  getScenarioHelpText,
  resolveComparisonScenario
} from "../src/lib/comparison-scenarios.ts";
import {
  clearAdminUnlockIncidents,
  readRecentAdminUnlockIncidents,
  recordAdminUnlockIncident
} from "../src/lib/admin-unlock-audit.ts";
import {
  adminUnlockRateLimitPolicy,
  clearAdminUnlockAttempts,
  getAdminUnlockClientKey,
  getAdminUnlockRateLimitStatus,
  recordAdminUnlockFailure,
  resetAdminUnlockAttemptStore
} from "../src/lib/admin-rate-limit.ts";
import { formatAdminUnlockFeedback } from "../src/lib/admin-unlock-feedback.ts";
import { validateEvidenceFileDescriptor } from "../src/lib/admin-upload.ts";
import { DEMO_OBSERVATIONS } from "../src/lib/demo-data.ts";
import { buildFoundingMemberCheckoutParams } from "../src/lib/founding-member.ts";
import { createEvidenceDownloadUrl } from "../src/lib/observation-evidence-store.ts";
import { mergeObservations as mergeObservationFeed } from "../src/lib/observation-feed.ts";
import * as observationStorage from "../src/lib/observation-storage.ts";
import { readStoredObservations } from "../src/lib/observation-repository.ts";
import {
  applyReleaseHealthFreshness,
  createOperatorProofSummary,
  createHostedOpsAttestationSummary,
  createReleaseHealthSummary,
  createVisualRegressionSummary,
  getOpsEvidencePathLeaf,
  resolveOpsEvidencePath,
  validateOpsEvidenceContract
} from "../src/lib/ops-evidence.ts";
import { mergeObservations } from "../src/lib/server-storage.ts";
import * as serverStorage from "../src/lib/server-storage.ts";
import { isAllowedSourceUrl } from "../src/lib/source-policy.ts";
import {
  buildWaitlistEventDetail,
  WAITLIST_EVENT_NAME
} from "../src/lib/waitlist-events.ts";
import {
  getWaitlistIntroCopy,
  getWaitlistSubmitLabel,
  getWaitlistTrustPoints,
  normalizeWaitlistMessage
} from "../src/lib/waitlist-form-content.ts";

test("default basket summary keeps coverage above 80 for the pilot ZIP", () => {
  const summaries = buildBasketSummary("30328", "base_regular_total");

  assert.equal(summaries.length, 3);
  assert.equal(summaries.every((summary) => summary.coverageRate >= 80), true);
  assert.equal(summaries[0]?.total <= summaries[1]?.total, true);
});

test("free member scenario can change totals without breaking publish rules", () => {
  const summaries = buildBasketSummary("30328", "free_member_total");
  const kroger = summaries.find((summary) => summary.retailer.name === "Kroger");

  assert.ok(kroger);
  assert.equal(kroger.publishReady, true);
  assert.equal(kroger.total > 0, true);
});

test("preview blocks non-comparable observations", () => {
  const preview = previewObservation({
    canonicalProductId: "apples",
    storeId: "kroger-30328",
    priceAmount: 4.99,
    measurementValue: 3,
    measurementUnit: "lb",
    comparabilityGrade: "non-comparable",
    sourceUrl: "https://www.kroger.com",
    collectedAt: "2026-04-12T06:15:00-07:00",
    priceType: "regular"
  });

  assert.equal(preview.publishReady, false);
  assert.equal(
    preview.blockers.includes("Non-comparable items cannot publish into the default basket"),
    true
  );
});

test("mergeObservations prefers the latest stored observation for the same key", () => {
  const base = DEMO_OBSERVATIONS.find(
    (observation) =>
      observation.storeId === "kroger-30328" &&
      observation.canonicalProductId === "milk" &&
      observation.priceType === "regular"
  );

  assert.ok(base);

  const merged = mergeObservations(DEMO_OBSERVATIONS, [
    {
      ...base,
      id: "stored-1",
      priceAmount: 4.11,
      collectedAt: "2026-04-13T06:15:00-07:00",
      sourceLabel: "Manual operator validation"
    }
  ]);

  const selected = merged.find(
    (observation) =>
      observation.storeId === "kroger-30328" &&
      observation.canonicalProductId === "milk" &&
      observation.priceType === "regular"
  );

  assert.ok(selected);
  assert.equal(selected.priceAmount, 4.11);
  assert.equal(selected.id, "stored-1");
});

test("server-storage compatibility facade preserves the extracted API surface", () => {
  assert.equal(typeof serverStorage.mergeObservations, "function");
  assert.equal(typeof serverStorage.getPublicEffectiveObservations, "function");
  assert.equal(typeof serverStorage.getRecentStoredObservations, "function");
  assert.equal(typeof serverStorage.createEvidenceDownloadUrl, "function");
  assert.equal(typeof serverStorage.createFoundingMemberSignup, "function");
  assert.equal(typeof serverStorage.updateFoundingMemberSignupBySubscriptionId, "function");
  assert.equal(typeof serverStorage.saveImportedWaitlistEntry, "function");
});

test("observation-storage facade re-exports the split observation modules", () => {
  assert.equal(observationStorage.mergeObservations, mergeObservationFeed);
  assert.equal(observationStorage.readStoredObservations, readStoredObservations);
  assert.equal(observationStorage.createEvidenceDownloadUrl, createEvidenceDownloadUrl);
});

test("isAllowedSourceUrl accepts official domains and rejects other hosts", () => {
  assert.equal(isAllowedSourceUrl("kroger", "https://www.kroger.com/p/banana"), true);
  assert.equal(isAllowedSourceUrl("aldi", "https://shop.aldi.us/store/aldi"), true);
  assert.equal(isAllowedSourceUrl("walmart", "https://evil.example.com/walmart"), false);
  assert.equal(isAllowedSourceUrl("walmart", "http://www.walmart.com/ip/item"), false);
});

test("resolveComparisonScenario preserves all supported scenarios", () => {
  for (const scenario of ALL_COMPARISON_SCENARIOS) {
    assert.equal(resolveComparisonScenario(scenario), scenario);
    assert.ok(SCENARIO_LABELS[scenario]);
  }

  assert.equal(resolveComparisonScenario("not-real"), "base_regular_total");
});

test("getScenarioHelpText explains non-default pricing views", () => {
  assert.match(getScenarioHelpText("coupon_required_total"), /coupon-required/i);
  assert.match(getScenarioHelpText("club_only_total"), /club-only/i);
  assert.match(getScenarioHelpText("weekly_ad_partial_total"), /weekly-ad/i);
});

test("waitlist form content adapts to audience and normalizes messages", () => {
  assert.match(getWaitlistIntroCopy(false, "self"), /weekly email/i);
  assert.match(getWaitlistIntroCopy(false, "caregiver"), /parent|family member/i);
  assert.equal(getWaitlistTrustPoints("self").length, 3);
  assert.equal(getWaitlistTrustPoints("caregiver").length, 3);
  assert.equal(getWaitlistSubmitLabel("saving", false), "Starting weekly updates...");
  assert.equal(normalizeWaitlistMessage("A valid email is required."), "Please enter a valid email address.");
});

test("buildWaitlistEventDetail emits the expected homepage telemetry payload", () => {
  const detail = buildWaitlistEventDetail({
    eventType: "submit_failed",
    checkoutEnabled: false,
    audience: "caregiver",
    zipCode: " 30062 ",
    email: "person@example.com",
    errorMessage: "bad zip"
  });

  assert.equal(WAITLIST_EVENT_NAME, "inmypoket.waitlist");
  assert.equal(detail.location, "homepage-weekly-updates");
  assert.equal(detail.audience, "caregiver");
  assert.equal(detail.zipCode, "30062");
  assert.equal(detail.hasEmail, true);
  assert.equal(detail.errorMessage, "bad zip");
});

test("accepted local limits expose the current operator boundaries", () => {
  const limits = getAcceptedLimits();

  assert.equal(limits.length, 3);
  assert.equal(limits.some((limit) => limit.key === "admin-unlock-local" && limit.status === "accepted"), true);
  assert.equal(limits.some((limit) => limit.key === "payment-deferred" && limit.status === "deferred"), true);
});

test("operator next actions prioritize hosted observation and deferred payment follow-up", () => {
  const actions = getOperatorNextActions({
    verifiedAt: "2026-04-16T09:47:28.054Z",
    formattedVerifiedAt: "Apr 16, 2026, 2:47 AM",
    verdict: "green",
    proofLevel: "full",
    verificationScope: "local-simulated",
    proofLabel: "full (local-simulated)",
    freshnessStatus: "current",
    staleReasons: [],
    hostedObservationStatus: "local-simulation",
    visualRegressionStatus: "green",
    bundleName: "ops-evidence-20260415-185147",
    operationsProofStatus: "materially complete",
    paymentStatus: "deferred",
    liveSupabaseProofStatus: "passed",
    errors: []
  });

  assert.equal(actions[0]?.key, "observe-hosted");
  assert.equal(actions.some((action) => action.key === "reopen-payment"), true);
});

test("external blockers expose hosted-proof and payment dependencies", () => {
  const blockers = getExternalBlockers({
    verifiedAt: "2026-04-16T09:47:28.054Z",
    formattedVerifiedAt: "Apr 16, 2026, 2:47 AM",
    verdict: "green",
    proofLevel: "full",
    verificationScope: "local-simulated",
    proofLabel: "full (local-simulated)",
    freshnessStatus: "current",
    staleReasons: [],
    hostedObservationStatus: "local-simulation",
    visualRegressionStatus: "green",
    bundleName: "ops-evidence-20260415-185147",
    operationsProofStatus: "materially complete",
    paymentStatus: "deferred",
    liveSupabaseProofStatus: "passed",
    errors: []
  });

  assert.equal(blockers.some((blocker) => blocker.key === "hosted-proof"), true);
  assert.equal(blockers.some((blocker) => blocker.key === "payment-proof"), true);
});

test("external proof handoff exposes required inputs and expected outputs", () => {
  const handoff = getExternalProofHandoff({
    verifiedAt: "2026-04-16T09:47:28.054Z",
    formattedVerifiedAt: "Apr 16, 2026, 2:47 AM",
    verdict: "green",
    proofLevel: "full",
    verificationScope: "local-simulated",
    proofLabel: "full (local-simulated)",
    freshnessStatus: "current",
    staleReasons: [],
    hostedObservationStatus: "local-simulation",
    visualRegressionStatus: "green",
    bundleName: "ops-evidence-20260415-185147",
    operationsProofStatus: "materially complete",
    paymentStatus: "deferred",
    liveSupabaseProofStatus: "passed",
    errors: []
  });

  assert.equal(handoff.some((item) => item.key === "hosted-proof"), true);
  assert.equal(handoff.some((item) => item.key === "payment-proof"), true);
  assert.equal((handoff[0]?.requiredInputs.length ?? 0) > 0, true);
  assert.equal((handoff[0]?.expectedOutputs.length ?? 0) > 0, true);
});

test("external proof handoff exposes required inputs and expected outputs", () => {
  const handoff = getExternalProofHandoff({
    verifiedAt: "2026-04-16T09:47:28.054Z",
    formattedVerifiedAt: "Apr 16, 2026, 2:47 AM",
    verdict: "green",
    proofLevel: "full",
    verificationScope: "local-simulated",
    proofLabel: "full (local-simulated)",
    freshnessStatus: "current",
    staleReasons: [],
    hostedObservationStatus: "local-simulation",
    visualRegressionStatus: "green",
    bundleName: "ops-evidence-20260415-185147",
    operationsProofStatus: "materially complete",
    paymentStatus: "deferred",
    liveSupabaseProofStatus: "passed",
    errors: []
  });

  assert.equal(handoff.some((item) => item.key === "hosted-proof"), true);
  assert.equal(handoff.some((item) => item.key === "payment-proof"), true);
  assert.equal(handoff[0]?.requiredInputs.length! > 0, true);
  assert.equal(handoff[0]?.expectedOutputs.length! > 0, true);
});

test("validateEvidenceFileDescriptor enforces type and size rules", () => {
  assert.equal(
    validateEvidenceFileDescriptor({ type: "image/png", size: 1024 }),
    null
  );
  assert.equal(
    validateEvidenceFileDescriptor({ type: "application/x-msdownload", size: 1024 }),
    "Evidence file type is not allowed."
  );
  assert.equal(
    validateEvidenceFileDescriptor({ type: "application/pdf", size: 7 * 1024 * 1024 }),
    "Evidence file exceeds the 6MB limit."
  );
});

test("buildFoundingMemberCheckoutParams produces subscription checkout metadata", () => {
  const params = buildFoundingMemberCheckoutParams({
    signup: {
      id: "signup-1",
      email: "member@example.com",
      zipCode: "30328",
      planCode: "founding-member",
      status: "pending_checkout",
      stripeCustomerId: null,
      stripeCheckoutSessionId: null,
      stripeSubscriptionId: null,
      createdAt: "2026-04-13T01:00:00.000Z",
      updatedAt: "2026-04-13T01:00:00.000Z"
    },
    priceId: "price_123",
    appUrl: "https://example.com"
  });

  assert.equal(params.mode, "subscription");
  assert.equal(params.client_reference_id, "signup-1");
  assert.equal(params.customer_email, "member@example.com");
  assert.equal(params.line_items?.[0]?.price, "price_123");
  assert.equal(params.metadata?.signup_id, "signup-1");
  assert.equal(params.subscription_data?.metadata?.zip_code, "30328");
});

test("admin session cookie can be created and verified", async () => {
  process.env.ADMIN_ACCESS_TOKEN = "test-admin-token";
  process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret";
  const adminAuth = await import("../src/lib/admin-auth.ts");
  const session = adminAuth.createAdminSessionValue();

  assert.equal(adminAuth.verifyAdminSessionValue(session), true);
  assert.equal(adminAuth.verifyAdminSessionValue("bad.session"), false);
});

test("admin cookie secure mode follows the app URL scheme", async () => {
  const adminAuth = await import("../src/lib/admin-auth.ts");

  assert.equal(adminAuth.shouldUseSecureAdminCookie("http://localhost:3000"), false);
  assert.equal(adminAuth.shouldUseSecureAdminCookie("https://app.example.com"), true);
  assert.equal(adminAuth.shouldUseSecureAdminCookie("not-a-url"), false);
});

test("admin unlock rate limit locks after repeated failures and clears on success", () => {
  const clientKey = "127.0.0.1::test-agent";
  resetAdminUnlockAttemptStore();

  for (let attempt = 1; attempt < adminUnlockRateLimitPolicy.maxAttempts; attempt += 1) {
    const status = recordAdminUnlockFailure(clientKey, 1_000);
    assert.equal(status.allowed, true);
  }

  const locked = recordAdminUnlockFailure(clientKey, 1_000);
  assert.equal(locked.allowed, false);
  assert.equal(locked.retryAfterSeconds > 0, true);

  clearAdminUnlockAttempts(clientKey);
  const recovered = getAdminUnlockRateLimitStatus(clientKey, 1_000);
  assert.equal(recovered.allowed, true);
  assert.equal(recovered.attempts, 0);
});

test("admin unlock client key prefers forwarded IP headers", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    "user-agent": "test-browser"
  });

  assert.equal(getAdminUnlockClientKey(headers), "203.0.113.7::test-browser");
});

test("formatAdminUnlockFeedback explains remaining attempts and cooldown", () => {
  assert.equal(
    formatAdminUnlockFeedback({
      error: "Invalid admin access token.",
      remainingAttempts: 2
    }),
    "Invalid admin access token. 2 attempts remain before lockout."
  );

  assert.equal(
    formatAdminUnlockFeedback({
      error: "Too many failed attempts. Try again later.",
      retryAfterSeconds: 90
    }),
    "Too many failed attempts. Try again later. Locked for about 2 minutes."
  );
});

test("admin unlock incident log keeps the latest entries for the current runtime", () => {
  clearAdminUnlockIncidents();

  recordAdminUnlockIncident({
    eventType: "invalid_token",
    clientKey: "127.0.0.1::agent",
    attempts: 1,
    remainingAttempts: 4,
    retryAfterSeconds: null
  });
  recordAdminUnlockIncident({
    eventType: "throttled",
    clientKey: "127.0.0.1::agent",
    attempts: 5,
    remainingAttempts: 0,
    retryAfterSeconds: 900
  });

  const incidents = readRecentAdminUnlockIncidents();
  assert.equal(incidents.length, 2);
  assert.equal(incidents[0]?.eventType, "throttled");
  assert.equal(incidents[1]?.eventType, "invalid_token");
});

test("resolveOpsEvidencePath converts Windows absolute paths into WSL mount paths", () => {
  assert.equal(
    resolveOpsEvidencePath(
      "C:\\Users\\sunwo\\workspace\\inMyPoket\\.ops-evidence\\ops-evidence-20260415-004104\\report.md"
    ),
    "/mnt/c/Users/sunwo/workspace/inMyPoket/.ops-evidence/ops-evidence-20260415-004104/report.md"
  );
});

test("resolveOpsEvidencePath resolves repo-relative ops evidence paths against projectRoot", () => {
  assert.equal(
    resolveOpsEvidencePath(
      ".ops-evidence/ops-evidence-20260415-004104/report.md",
      "/mnt/c/Users/sunwo/workspace/inMyPoket"
    ),
    "/mnt/c/Users/sunwo/workspace/inMyPoket/.ops-evidence/ops-evidence-20260415-004104/report.md"
  );
});

test("resolveOpsEvidencePath preserves absolute Unix paths as-is", () => {
  assert.equal(
    resolveOpsEvidencePath("/var/tmp/ops-evidence/report.md"),
    "/var/tmp/ops-evidence/report.md"
  );
});

test("getOpsEvidencePathLeaf extracts the basename from Windows-style paths", () => {
  assert.equal(
    getOpsEvidencePathLeaf(
      "C:\\Users\\sunwo\\workspace\\inMyPoket\\.ops-evidence\\ops-evidence-20260415-004104\\report.md"
    ),
    "report.md"
  );
});

test("validateOpsEvidenceContract accepts a consistent full-proof bundle", () => {
  const latestRun = {
    generatedAt: "2026-04-15T00:00:00.000Z",
    bundleDir: "C:\\bundle",
    reportPath: "C:\\bundle\\report.md",
    uiAssetsDir: "C:\\bundle\\ui-assets",
    manifestPath: "C:\\bundle\\manifest.json",
    operationsProofStatus: "materially complete",
    paymentStatus: "deferred",
    liveSupabaseProofStatus: "passed",
    stepStatus: {
      bootstrap: { succeeded: true, label: "PASS" },
      uiEvidence: { succeeded: true, label: "PASS" },
      localSmoke: { succeeded: true, label: "PASS" },
      liveSupabaseProof: { succeeded: true, label: "passed" }
    }
  };

  const manifest = {
    generatedAt: "2026-04-15T00:00:00.000Z",
    publicUxStatus: "stable enough for the current milestone",
    operationsProofStatus: "materially complete",
    paymentStatus: "deferred",
    paymentReady: false,
    bundleDir: "C:\\bundle",
    reportPath: "C:\\bundle\\report.md",
    uiAssetsDir: "C:\\bundle\\ui-assets",
    stepStatus: latestRun.stepStatus,
    envReadiness: {
      requiredNow: {
        APP_URL: true,
        ADMIN_ACCESS_TOKEN: true,
        ADMIN_SESSION_SECRET: true
      },
      payment: {
        STRIPE_SECRET_KEY: false,
        STRIPE_WEBHOOK_SECRET: false,
        STRIPE_PRICE_ID_FOUNDING_MEMBER: false
      }
    }
  };

  const result = validateOpsEvidenceContract(latestRun, manifest);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("validateOpsEvidenceContract rejects contradictory automation-only proof", () => {
  const latestRun = {
    generatedAt: "2026-04-15T00:00:00.000Z",
    bundleDir: "C:\\bundle",
    reportPath: "C:\\bundle\\report.md",
    uiAssetsDir: "C:\\bundle\\ui-assets",
    manifestPath: "C:\\bundle\\manifest.json",
    operationsProofStatus: "automation-only proof complete; live Supabase proof unavailable in this environment",
    paymentStatus: "deferred",
    liveSupabaseProofStatus: "unavailable in this environment",
    stepStatus: {
      bootstrap: { succeeded: true, label: "PASS" },
      uiEvidence: { succeeded: true, label: "PASS" },
      localSmoke: { succeeded: true, label: "PASS" },
      liveSupabaseProof: { succeeded: true, label: "passed" }
    }
  };

  const manifest = {
    generatedAt: "2026-04-15T00:00:00.000Z",
    publicUxStatus: "stable enough for the current milestone",
    operationsProofStatus: latestRun.operationsProofStatus,
    paymentStatus: "deferred",
    paymentReady: false,
    bundleDir: "C:\\bundle",
    reportPath: "C:\\bundle\\report.md",
    uiAssetsDir: "C:\\bundle\\ui-assets",
    stepStatus: latestRun.stepStatus,
    envReadiness: {
      requiredNow: {
        APP_URL: true
      },
      payment: {}
    }
  };

  const result = validateOpsEvidenceContract(latestRun, manifest);
  assert.equal(result.ok, false);
  assert.equal(
    result.errors.includes("automation-only evidence cannot claim a successful live Supabase proof"),
    true
  );
});

test("validateOpsEvidenceContract allows materially complete proof with unavailable UI evidence", () => {
  const latestRun = {
    generatedAt: "2026-04-15T00:00:00.000Z",
    bundleDir: "C:\\bundle",
    reportPath: "C:\\bundle\\report.md",
    uiAssetsDir: "C:\\bundle\\ui-assets",
    manifestPath: "C:\\bundle\\manifest.json",
    operationsProofStatus: "materially complete",
    paymentStatus: "deferred",
    liveSupabaseProofStatus: "passed",
    stepStatus: {
      bootstrap: { succeeded: true, label: "PASS" },
      uiEvidence: { succeeded: false, label: "unavailable in this environment" },
      localSmoke: { succeeded: true, label: "PASS" },
      liveSupabaseProof: { succeeded: true, label: "passed" }
    }
  };

  const manifest = {
    generatedAt: "2026-04-15T00:00:00.000Z",
    publicUxStatus: "stable enough for the current milestone",
    operationsProofStatus: "materially complete",
    paymentStatus: "deferred",
    paymentReady: false,
    bundleDir: "C:\\bundle",
    reportPath: "C:\\bundle\\report.md",
    uiAssetsDir: "C:\\bundle\\ui-assets",
    stepStatus: latestRun.stepStatus,
    envReadiness: {
      requiredNow: {
        APP_URL: true
      },
      payment: {}
    }
  };

  const result = validateOpsEvidenceContract(latestRun, manifest);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("applyReleaseHealthFreshness stays current when upstream timestamps match", () => {
  const verdict = applyReleaseHealthFreshness(
    {
      verifiedAt: "2026-04-16T01:00:00.000Z",
      verdict: "green",
      proofLevel: "full",
      verificationScope: "local-only",
      freshnessStatus: "current",
      staleReasons: [],
      hostedObservationStatus: "missing",
      latestRunGeneratedAt: "2026-04-16T00:30:00.000Z",
      hostedAttestationGeneratedAt: null,
      visualRegressionGeneratedAt: "2026-04-16T00:45:00.000Z",
      visualRegressionStatus: "green",
      bundleDir: "C:\\bundle",
      reportPath: "C:\\bundle\\report.md",
      manifestPath: "C:\\bundle\\manifest.json",
      operationsProofStatus: "materially complete",
      paymentStatus: "deferred",
      liveSupabaseProofStatus: "passed",
      errors: []
    },
    {
      generatedAt: "2026-04-16T00:30:00.000Z",
      bundleDir: "C:\\bundle",
      reportPath: "C:\\bundle\\report.md",
      uiAssetsDir: "C:\\bundle\\ui-assets",
      manifestPath: "C:\\bundle\\manifest.json",
      operationsProofStatus: "materially complete",
      paymentStatus: "deferred",
      liveSupabaseProofStatus: "passed",
      stepStatus: {}
    },
    null,
    {
      generatedAt: "2026-04-16T00:45:00.000Z",
      verdict: "green",
      threshold: 0.015,
      candidateDir: "C:\\candidate",
      reportDir: "C:\\report"
    }
  );

  assert.equal(verdict.freshnessStatus, "current");
  assert.deepEqual(verdict.staleReasons, []);
  assert.equal(verdict.hostedObservationStatus, "missing");
  assert.equal(verdict.visualRegressionStatus, "green");
});

test("applyReleaseHealthFreshness marks stale when visual advisory is newer", () => {
  const verdict = applyReleaseHealthFreshness(
    {
      verifiedAt: "2026-04-16T01:00:00.000Z",
      verdict: "green",
      proofLevel: "full",
      verificationScope: "local-only",
      freshnessStatus: "current",
      staleReasons: [],
      hostedObservationStatus: "missing",
      latestRunGeneratedAt: "2026-04-16T00:30:00.000Z",
      hostedAttestationGeneratedAt: null,
      visualRegressionGeneratedAt: "2026-04-16T00:45:00.000Z",
      visualRegressionStatus: "green",
      bundleDir: "C:\\bundle",
      reportPath: "C:\\bundle\\report.md",
      manifestPath: "C:\\bundle\\manifest.json",
      operationsProofStatus: "materially complete",
      paymentStatus: "deferred",
      liveSupabaseProofStatus: "passed",
      errors: []
    },
    null,
    null,
    {
      generatedAt: "2026-04-16T01:05:00.000Z",
      verdict: "red",
      threshold: 0.015,
      candidateDir: "C:\\candidate",
      reportDir: "C:\\report"
    }
  );

  assert.equal(verdict.freshnessStatus, "stale");
  assert.equal(verdict.visualRegressionStatus, "red");
  assert.equal(
    verdict.staleReasons.includes(
      "A newer advisory visual regression result exists than the one reflected in release health."
    ),
    true
  );
});

test("applyReleaseHealthFreshness marks stale when hosted provenance is newer", () => {
  const verdict = applyReleaseHealthFreshness(
    {
      verifiedAt: "2026-04-16T01:00:00.000Z",
      verdict: "green",
      proofLevel: "full",
      verificationScope: "local-only",
      freshnessStatus: "current",
      staleReasons: [],
      hostedObservationStatus: "missing",
      latestRunGeneratedAt: "2026-04-16T00:30:00.000Z",
      hostedAttestationGeneratedAt: null,
      visualRegressionGeneratedAt: null,
      visualRegressionStatus: "missing",
      bundleDir: "C:\\bundle",
      reportPath: "C:\\bundle\\report.md",
      manifestPath: "C:\\bundle\\manifest.json",
      operationsProofStatus: "materially complete",
      paymentStatus: "deferred",
      liveSupabaseProofStatus: "passed",
      errors: []
    },
    null,
    {
      commitSha: "abcdef1234567890",
      workflowRunId: "123456",
      workflowRunNumber: "42",
      generatedAt: "2026-04-16T01:05:00.000Z",
      verdict: "green",
      proofLevel: "full",
      verificationScope: "local-simulated",
      operationsProofStatus: "materially complete",
      liveSupabaseProofStatus: "passed",
      paymentStatus: "deferred",
      environment: "local-simulation"
    },
    null
  );

  assert.equal(verdict.freshnessStatus, "stale");
  assert.equal(verdict.hostedObservationStatus, "local-simulation");
  assert.equal(
    verdict.staleReasons.includes(
      "A newer hosted provenance attestation exists than the one reflected in release health."
    ),
    true
  );
});

test("applyReleaseHealthFreshness marks stale when a newer ops bundle exists", () => {
  const verdict = applyReleaseHealthFreshness(
    {
      verifiedAt: "2026-04-16T01:00:00.000Z",
      verdict: "green",
      proofLevel: "full",
      verificationScope: "local-only",
      freshnessStatus: "current",
      staleReasons: [],
      hostedObservationStatus: "missing",
      latestRunGeneratedAt: "2026-04-16T00:30:00.000Z",
      hostedAttestationGeneratedAt: null,
      visualRegressionGeneratedAt: null,
      visualRegressionStatus: "missing",
      bundleDir: "C:\\bundle",
      reportPath: "C:\\bundle\\report.md",
      manifestPath: "C:\\bundle\\manifest.json",
      operationsProofStatus: "materially complete",
      paymentStatus: "deferred",
      liveSupabaseProofStatus: "passed",
      errors: []
    },
    {
      generatedAt: "2026-04-16T01:05:00.000Z",
      bundleDir: "C:\\bundle",
      reportPath: "C:\\bundle\\report.md",
      uiAssetsDir: "C:\\bundle\\ui-assets",
      manifestPath: "C:\\bundle\\manifest.json",
      operationsProofStatus: "materially complete",
      paymentStatus: "deferred",
      liveSupabaseProofStatus: "passed",
      stepStatus: {}
    },
    null,
    null
  );

  assert.equal(verdict.freshnessStatus, "stale");
  assert.equal(verdict.verificationScope, "local-only");
  assert.equal(
    verdict.staleReasons.includes(
      "A newer ops evidence bundle exists than the one reflected in release health."
    ),
    true
  );
});

test("applyReleaseHealthFreshness accumulates stale reasons from multiple newer inputs", () => {
  const verdict = applyReleaseHealthFreshness(
    {
      verifiedAt: "2026-04-16T01:00:00.000Z",
      verdict: "green",
      proofLevel: "full",
      verificationScope: "local-only",
      freshnessStatus: "current",
      staleReasons: [],
      hostedObservationStatus: "missing",
      latestRunGeneratedAt: "2026-04-16T00:30:00.000Z",
      hostedAttestationGeneratedAt: null,
      visualRegressionGeneratedAt: "2026-04-16T00:45:00.000Z",
      visualRegressionStatus: "green",
      bundleDir: "C:\\bundle",
      reportPath: "C:\\bundle\\report.md",
      manifestPath: "C:\\bundle\\manifest.json",
      operationsProofStatus: "materially complete",
      paymentStatus: "deferred",
      liveSupabaseProofStatus: "passed",
      errors: []
    },
    {
      generatedAt: "2026-04-16T01:05:00.000Z",
      bundleDir: "C:\\bundle",
      reportPath: "C:\\bundle\\report.md",
      uiAssetsDir: "C:\\bundle\\ui-assets",
      manifestPath: "C:\\bundle\\manifest.json",
      operationsProofStatus: "materially complete",
      paymentStatus: "deferred",
      liveSupabaseProofStatus: "passed",
      stepStatus: {}
    },
    {
      commitSha: "abcdef1234567890",
      workflowRunId: "123456",
      workflowRunNumber: "42",
      generatedAt: "2026-04-16T01:06:00.000Z",
      verdict: "green",
      proofLevel: "full",
      verificationScope: "local-simulated",
      operationsProofStatus: "materially complete",
      liveSupabaseProofStatus: "passed",
      paymentStatus: "deferred",
      environment: "local-simulation"
    },
    {
      generatedAt: "2026-04-16T01:07:00.000Z",
      verdict: "red",
      threshold: 0.015,
      candidateDir: "C:\\candidate",
      reportDir: "C:\\report"
    }
  );

  assert.equal(verdict.freshnessStatus, "stale");
  assert.equal(verdict.verificationScope, "local-simulated");
  assert.equal(verdict.staleReasons.length, 3);
});

test("createReleaseHealthSummary formats a canonical operator verdict", () => {
  const summary = createReleaseHealthSummary({
    verifiedAt: "2026-04-15T07:41:21.274Z",
    verdict: "green",
    proofLevel: "full",
    verificationScope: "local-only",
    freshnessStatus: "current",
    staleReasons: [],
    hostedObservationStatus: "missing",
    latestRunGeneratedAt: "2026-04-15T07:30:00.000Z",
    hostedAttestationGeneratedAt: null,
    visualRegressionGeneratedAt: "2026-04-15T07:35:00.000Z",
    visualRegressionStatus: "green",
    bundleDir: "C:\\ops\\ops-evidence-20260415-004104",
    reportPath: "C:\\ops\\ops-evidence-20260415-004104\\report.md",
    manifestPath: "C:\\ops\\ops-evidence-20260415-004104\\manifest.json",
    operationsProofStatus: "materially complete",
    paymentStatus: "deferred",
    liveSupabaseProofStatus: "passed",
    errors: []
  });

  assert.ok(summary);
  assert.equal(summary.verdict, "green");
  assert.equal(summary.proofLevel, "full");
  assert.equal(summary.verificationScope, "local-only");
  assert.equal(summary.proofLabel, "full (local-only)");
  assert.equal(summary.freshnessStatus, "current");
  assert.equal(summary.hostedObservationStatus, "missing");
  assert.equal(summary.visualRegressionStatus, "green");
  assert.equal(summary.bundleName, "ops-evidence-20260415-004104");
  assert.equal(summary.paymentStatus, "deferred");
  assert.equal(summary.liveSupabaseProofStatus, "passed");
});

test("createHostedOpsAttestationSummary formats hosted provenance for operators", () => {
  const summary = createHostedOpsAttestationSummary({
    commitSha: "abcdef1234567890",
    workflowRunId: "123456789",
    workflowRunNumber: "42",
    generatedAt: "2026-04-15T08:00:00.000Z",
    verdict: "green",
    proofLevel: "full",
    verificationScope: "hosted-observed",
    operationsProofStatus: "materially complete",
    liveSupabaseProofStatus: "passed",
    paymentStatus: "deferred",
    environment: "hosted-ci"
  });

  assert.ok(summary);
  assert.equal(summary.commitShaShort, "abcdef1");
  assert.equal(summary.workflowRunId, "123456789");
  assert.equal(summary.workflowRunNumber, "42");
  assert.equal(summary.verdict, "green");
  assert.equal(summary.proofLevel, "full");
  assert.equal(summary.verificationScope, "hosted-observed");
  assert.equal(summary.proofLabel, "full (hosted-observed)");
  assert.equal(summary.isObservedHostedRun, true);
  assert.equal(summary.provenanceLabel, "Observed hosted CI run");
});

test("createHostedOpsAttestationSummary marks local simulations honestly", () => {
  const summary = createHostedOpsAttestationSummary({
    commitSha: "abcdef1234567890",
    workflowRunId: "123456789",
    workflowRunNumber: "42",
    generatedAt: "2026-04-15T08:00:00.000Z",
    verdict: "green",
    proofLevel: "full",
    verificationScope: "local-simulated",
    operationsProofStatus: "materially complete",
    liveSupabaseProofStatus: "passed",
    paymentStatus: "deferred",
    environment: "local-simulation"
  });

  assert.ok(summary);
  assert.equal(summary.verificationScope, "local-simulated");
  assert.equal(summary.proofLabel, "full (local-simulated)");
  assert.equal(summary.isObservedHostedRun, false);
  assert.equal(summary.provenanceLabel, "Local simulation of hosted CI provenance");
});

test("createVisualRegressionSummary formats the latest advisory visual verdict", () => {
  const summary = createVisualRegressionSummary({
    generatedAt: "2026-04-15T20:07:28.860857Z",
    verdict: "green",
    threshold: 0.015,
    candidateDir: "C:\\ops\\visual-candidate-20260415-130724",
    reportDir: "C:\\ops\\visual-regression-20260415-130724"
  });

  assert.ok(summary);
  assert.equal(summary.verdict, "green");
  assert.equal(summary.threshold, 0.015);
  assert.equal(summary.candidateName, "visual-candidate-20260415-130724");
  assert.equal(summary.reportName, "visual-regression-20260415-130724");
});

test("createOperatorProofSummary packages operator-facing checklist and pointers", () => {
  const summary = createOperatorProofSummary(
    {
      verifiedAt: "2026-04-16T09:17:24.817Z",
      verdict: "green",
      proofLevel: "full",
      verificationScope: "local-simulated",
      freshnessStatus: "current",
      staleReasons: [],
      hostedObservationStatus: "local-simulation",
      latestRunGeneratedAt: "2026-04-15T18:52:35.7145733-07:00",
      hostedAttestationGeneratedAt: "2026-04-16T09:17:19.102Z",
      visualRegressionGeneratedAt: "2026-04-16T08:55:12.129771Z",
      bundleDir: ".ops-evidence/ops-evidence-20260415-185147",
      reportPath: ".ops-evidence/ops-evidence-20260415-185147/report.md",
      manifestPath: ".ops-evidence/ops-evidence-20260415-185147/manifest.json",
      operationsProofStatus: "materially complete",
      paymentStatus: "deferred",
      liveSupabaseProofStatus: "passed",
      visualRegressionStatus: "green",
      errors: []
    },
    {
      generatedAt: "2026-04-15T18:52:35.7145733-07:00",
      bundleDir: ".ops-evidence/ops-evidence-20260415-185147",
      reportPath: ".ops-evidence/ops-evidence-20260415-185147/report.md",
      uiAssetsDir: ".ops-evidence/ops-evidence-20260415-185147/ui-assets",
      manifestPath: ".ops-evidence/ops-evidence-20260415-185147/manifest.json",
      operationsProofStatus: "materially complete",
      paymentStatus: "deferred",
      liveSupabaseProofStatus: "passed",
      stepStatus: {
        bootstrap: { succeeded: true, label: "PASS" },
        uiEvidence: { succeeded: true, label: "passed" },
        localSmoke: { succeeded: true, label: "PASS" },
        liveSupabaseProof: { succeeded: true, label: "passed" }
      }
    },
    {
      generatedAt: "2026-04-16T08:55:12.129771Z",
      verdict: "green",
      threshold: 0.015,
      candidateDir: ".ops-evidence/visual-candidate-20260416-015507",
      reportDir: ".ops-evidence/visual-regression-20260416-015507"
    }
  );

  assert.ok(summary);
  assert.equal(summary.proofLabel, "full (local-simulated)");
  assert.equal(summary.artifactPointers.latestPointerPath, ".ops-evidence/LATEST.md");
  assert.equal(summary.artifactPointers.releaseHealthJsonPath, ".ops-evidence/release-health.json");
  assert.equal(summary.artifactPointers.externalProofHandoffJsonPath, ".ops-evidence/external-proof-handoff.json");
  assert.equal(summary.artifactPointers.visualReportDir, ".ops-evidence/visual-regression-20260416-015507");
  assert.equal(summary.items.some((item) => item.key === "admin-access" && item.status === "proved"), true);
  assert.equal(summary.acceptedLimits.some((limit) => limit.key === "admin-unlock-local"), true);
  assert.equal(summary.externalBlockers.some((blocker) => blocker.key === "hosted-proof"), true);
  assert.equal(summary.externalProofHandoff.some((item) => item.key === "hosted-proof"), true);
  assert.equal(summary.nextActions.some((action) => action.key === "observe-hosted"), true);
});
