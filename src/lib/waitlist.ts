import type { WaitlistLead, WaitlistLeadStatus } from "./domain";

export const WEEKLY_UPDATES_PLAN_CODE = "weekly-updates";
export const WEEKLY_UPDATES_STATUS = "weekly_updates_subscribed" satisfies WaitlistLeadStatus;

type WaitlistPayload = {
  email?: string;
  zipCode?: string;
};

export type WaitlistCaptureStorage = {
  findLatestWaitlistLeadByIdentity(input: {
    email: string;
    zipCode: string;
    planCode: string;
  }): Promise<WaitlistLead | null>;
  createWaitlistLead(input: {
    email: string;
    zipCode: string;
    planCode: string;
    status?: WaitlistLeadStatus;
  }): Promise<WaitlistLead>;
  updateWaitlistLead(
    signupId: string,
    patch: {
      status?: WaitlistLeadStatus;
    }
  ): Promise<WaitlistLead>;
};

export type WaitlistCaptureResult =
  | {
      ok: true;
      status: 200;
      signup: WaitlistLead;
      message: string;
    }
  | {
      ok: false;
      status: 400;
      error: string;
    };

export function buildWaitlistSubmissionRequest(input: {
  checkoutEnabled: boolean;
  email: string;
  zipCode: string;
}) {
  return {
    endpoint: "/api/waitlist",
    body: {
      email: input.email,
      zipCode: input.zipCode,
      plan: WEEKLY_UPDATES_PLAN_CODE
    },
    expectsCheckoutUrl: false
  } as const;
}

function normalizeEmail(email: string | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

function normalizeZipCode(zipCode: string | undefined) {
  return zipCode?.trim() ?? "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function captureWeeklyUpdatesLead(
  payload: WaitlistPayload,
  storage: WaitlistCaptureStorage
): Promise<WaitlistCaptureResult> {
  const email = normalizeEmail(payload.email);
  const zipCode = normalizeZipCode(payload.zipCode);

  if (!email || !isValidEmail(email)) {
    return {
      ok: false,
      status: 400,
      error: "A valid email is required."
    };
  }

  if (!/^\d{5}$/.test(zipCode)) {
    return {
      ok: false,
      status: 400,
      error: "A 5-digit ZIP code is required."
    };
  }

  const existingSignup = await storage.findLatestWaitlistLeadByIdentity({
    email,
    zipCode,
    planCode: WEEKLY_UPDATES_PLAN_CODE
  });

  if (existingSignup?.status === WEEKLY_UPDATES_STATUS) {
    return {
      ok: true,
      status: 200,
      signup: existingSignup,
      message: "You’re signed up for weekly updates."
    };
  }

  if (existingSignup) {
    const repairedSignup = await storage.updateWaitlistLead(existingSignup.id, {
      status: WEEKLY_UPDATES_STATUS
    });

    return {
      ok: true,
      status: 200,
      signup: repairedSignup,
      message: "You’re signed up for weekly updates."
    };
  }

  const signup = await storage.createWaitlistLead({
    email,
    zipCode,
    planCode: WEEKLY_UPDATES_PLAN_CODE,
    status: WEEKLY_UPDATES_STATUS
  });

  return {
    ok: true,
    status: 200,
    signup,
    message: "You’re signed up for weekly updates."
  };
}
