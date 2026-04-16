import test from "node:test";
import assert from "node:assert/strict";

import {
  WEEKLY_UPDATES_PLAN_CODE,
  WEEKLY_UPDATES_STATUS,
  buildWaitlistSubmissionRequest,
  captureWeeklyUpdatesLead,
  type WaitlistCaptureStorage
} from "../src/lib/waitlist.ts";

test("captureWeeklyUpdatesLead creates a weekly-updates signup for a valid submission", async () => {
  const created: Array<{ email: string; zipCode: string; planCode: string; status?: string }> = [];
  const storage: WaitlistCaptureStorage = {
    findLatestFoundingMemberSignupByIdentity: async () => null,
    createFoundingMemberSignup: async (input) => {
      created.push(input);
      return {
        id: "signup-1",
        email: input.email,
        zipCode: input.zipCode,
        planCode: input.planCode,
        status: input.status ?? WEEKLY_UPDATES_STATUS,
        stripeCustomerId: null,
        stripeCheckoutSessionId: null,
        stripeSubscriptionId: null,
        createdAt: "2026-04-15T00:00:00.000Z",
        updatedAt: "2026-04-15T00:00:00.000Z"
      };
    },
    updateFoundingMemberSignup: async () => {
      throw new Error("should not update when creating a fresh weekly-updates lead");
    }
  };

  const result = await captureWeeklyUpdatesLead(
    { email: " Person@Example.com ", zipCode: "30328" },
    storage
  );

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.signup.planCode, WEEKLY_UPDATES_PLAN_CODE);
  assert.equal(result.signup.status, WEEKLY_UPDATES_STATUS);
  assert.deepEqual(created, [
    {
      email: "person@example.com",
      zipCode: "30328",
      planCode: WEEKLY_UPDATES_PLAN_CODE,
      status: WEEKLY_UPDATES_STATUS
    }
  ]);
});

test("captureWeeklyUpdatesLead rejects invalid email and invalid ZIP with 400 errors", async () => {
  const storage: WaitlistCaptureStorage = {
    findLatestFoundingMemberSignupByIdentity: async () => null,
    createFoundingMemberSignup: async () => {
      throw new Error("should not create invalid weekly-updates leads");
    },
    updateFoundingMemberSignup: async () => {
      throw new Error("should not update invalid weekly-updates leads");
    }
  };

  for (const email of ["not-an-email", "a@", "@b", "a@b"]) {
    const invalidEmail = await captureWeeklyUpdatesLead(
      { email, zipCode: "30328" },
      storage
    );
    assert.equal(invalidEmail.ok, false);
    assert.equal(invalidEmail.status, 400);
    assert.equal(invalidEmail.error, "A valid email is required.");
  }

  const invalidZip = await captureWeeklyUpdatesLead(
    { email: "person@example.com", zipCode: "3032" },
    storage
  );
  assert.equal(invalidZip.ok, false);
  assert.equal(invalidZip.status, 400);
  assert.equal(invalidZip.error, "A 5-digit ZIP code is required.");
});

test("captureWeeklyUpdatesLead reuses an existing honest weekly-updates signup without creating a pending checkout", async () => {
  let createdCount = 0;
  let updatedId: string | null = null;
  const storage: WaitlistCaptureStorage = {
    findLatestFoundingMemberSignupByIdentity: async () => ({
      id: "signup-2",
      email: "person@example.com",
      zipCode: "30328",
      planCode: WEEKLY_UPDATES_PLAN_CODE,
      status: WEEKLY_UPDATES_STATUS,
      stripeCustomerId: null,
      stripeCheckoutSessionId: null,
      stripeSubscriptionId: null,
      createdAt: "2026-04-15T00:00:00.000Z",
      updatedAt: "2026-04-15T00:00:00.000Z"
    }),
    createFoundingMemberSignup: async () => {
      createdCount += 1;
      throw new Error("should not create a duplicate weekly-updates lead");
    },
    updateFoundingMemberSignup: async (signupId) => {
      updatedId = signupId;
      throw new Error("should not rewrite an already honest weekly-updates lead");
    }
  };

  const result = await captureWeeklyUpdatesLead(
    { email: "person@example.com", zipCode: "30328" },
    storage
  );

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(result.signup.id, "signup-2");
  assert.equal(result.signup.status, WEEKLY_UPDATES_STATUS);
  assert.equal(createdCount, 0);
  assert.equal(updatedId, null);
});

test("captureWeeklyUpdatesLead repairs a misleading pending_checkout weekly-updates lead instead of leaving it pending", async () => {
  const updates: Array<{ signupId: string; patch: { status?: string } }> = [];
  const storage: WaitlistCaptureStorage = {
    findLatestFoundingMemberSignupByIdentity: async () => ({
      id: "signup-3",
      email: "person@example.com",
      zipCode: "30328",
      planCode: WEEKLY_UPDATES_PLAN_CODE,
      status: "pending_checkout",
      stripeCustomerId: null,
      stripeCheckoutSessionId: null,
      stripeSubscriptionId: null,
      createdAt: "2026-04-15T00:00:00.000Z",
      updatedAt: "2026-04-15T00:00:00.000Z"
    }),
    createFoundingMemberSignup: async () => {
      throw new Error("should not create a second weekly-updates lead when one already exists");
    },
    updateFoundingMemberSignup: async (signupId, patch) => {
      updates.push({ signupId, patch });
      return {
        id: signupId,
        email: "person@example.com",
        zipCode: "30328",
        planCode: WEEKLY_UPDATES_PLAN_CODE,
        status: patch.status ?? WEEKLY_UPDATES_STATUS,
        stripeCustomerId: null,
        stripeCheckoutSessionId: null,
        stripeSubscriptionId: null,
        createdAt: "2026-04-15T00:00:00.000Z",
        updatedAt: "2026-04-15T00:01:00.000Z"
      };
    }
  };

  const result = await captureWeeklyUpdatesLead(
    { email: "person@example.com", zipCode: "30328" },
    storage
  );

  assert.equal(result.ok, true);
  assert.equal(result.signup.status, WEEKLY_UPDATES_STATUS);
  assert.deepEqual(updates, [
    {
      signupId: "signup-3",
      patch: {
        status: WEEKLY_UPDATES_STATUS
      }
    }
  ]);
});

test("buildWaitlistSubmissionRequest keeps founding-member checkout intact when payment is enabled", () => {
  assert.deepEqual(
    buildWaitlistSubmissionRequest({
      checkoutEnabled: true,
      email: "person@example.com",
      zipCode: "30328"
    }),
    {
      endpoint: "/api/founding-member/checkout",
      body: {
        email: "person@example.com",
        zipCode: "30328",
        plan: "founding-member"
      },
      expectsCheckoutUrl: true
    }
  );
});

test("buildWaitlistSubmissionRequest uses the non-payment waitlist path when checkout is disabled", () => {
  assert.deepEqual(
    buildWaitlistSubmissionRequest({
      checkoutEnabled: false,
      email: "person@example.com",
      zipCode: "30328"
    }),
    {
      endpoint: "/api/waitlist",
      body: {
        email: "person@example.com",
        zipCode: "30328",
        plan: WEEKLY_UPDATES_PLAN_CODE
      },
      expectsCheckoutUrl: false
    }
  );
});
