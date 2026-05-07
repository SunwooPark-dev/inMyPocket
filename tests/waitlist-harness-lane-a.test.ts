import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  getWaitlistIntroCopy,
  getWaitlistTrustPoints,
  getWaitlistSubmitLabel,
  normalizeWaitlistMessage
} from "../src/lib/waitlist-form-content.ts";
import { WAITLIST_EVENT_NAME, buildWaitlistEventDetail } from "../src/lib/waitlist-events.ts";
import { WEEKLY_UPDATES_PLAN_CODE, buildWaitlistSubmissionRequest } from "../src/lib/waitlist.ts";

test("weekly updates bridge appears immediately after the answer block", () => {
  const pageSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  const answerIndex = pageSource.indexOf('id="today-answer"');
  const bridgeIndex = pageSource.indexOf('id="weekly-updates"', answerIndex);
  const statsIndex = pageSource.indexOf('aria-label="Quick trust summary"', answerIndex);
  const locationIndex = pageSource.indexOf("<LocationAwareStoreExperience", answerIndex);

  assert.ok(answerIndex > -1, "homepage answer block must exist");
  assert.ok(bridgeIndex > answerIndex, "weekly updates bridge must follow the answer block");
  assert.ok(statsIndex > bridgeIndex, "weekly updates bridge must appear before the secondary trust summary");
  assert.ok(locationIndex > bridgeIndex, "weekly updates bridge must appear before location-aware store details");
  assert.match(pageSource, /No payment info is needed|Non-payment updates only/);
});

test("caregiver copy promises trust-first weekly updates", () => {
  assert.match(getWaitlistIntroCopy(false, "caregiver"), /weekly email/i);
  assert.match(getWaitlistIntroCopy(false, "caregiver"), /parent|family member/i);
  assert.ok(getWaitlistTrustPoints("caregiver").some((point) => /no payment info required/i.test(point)));
});

test("submit label stays aligned with weekly updates path", () => {
  assert.equal(getWaitlistSubmitLabel("saving"), "Starting weekly updates...");
  assert.equal(getWaitlistSubmitLabel("idle"), "Get weekly updates");
});

test("known waitlist errors normalize to plain guidance", () => {
  assert.equal(normalizeWaitlistMessage("A valid email is required."), "Please enter a valid email address.");
  assert.equal(normalizeWaitlistMessage("A 5-digit ZIP code is required."), "Please enter a 5-digit ZIP code.");
  assert.equal(normalizeWaitlistMessage("Something else"), "Something else");
});

test("waitlist event detail captures contract without exposing email", () => {
  const detail = buildWaitlistEventDetail({
    eventType: "submit_started",
    checkoutEnabled: false,
    audience: "caregiver",
    zipCode: " 30328 ",
    email: "person@example.com"
  });

  assert.equal(WAITLIST_EVENT_NAME, "inmypoket.waitlist");
  assert.deepEqual(detail, {
    eventType: "submit_started",
    location: "homepage-weekly-updates",
    checkoutEnabled: false,
    audience: "caregiver",
    zipCode: "30328",
    hasEmail: true,
    errorMessage: undefined
  });
});

test("weekly updates submission request still routes to waitlist capture", () => {
  const submission = buildWaitlistSubmissionRequest({
    checkoutEnabled: false,
    email: "person@example.com",
    zipCode: "30328"
  });

  assert.equal(submission.endpoint, "/api/waitlist");
  assert.equal(submission.expectsCheckoutUrl, false);
  assert.equal(submission.body.plan, WEEKLY_UPDATES_PLAN_CODE);
});
