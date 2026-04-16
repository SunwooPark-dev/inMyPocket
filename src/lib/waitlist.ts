import type { FoundingMemberSignup, FoundingMemberSignupStatus } from "./domain";

export const WEEKLY_UPDATES_PLAN_CODE = "weekly-updates";
export const WEEKLY_UPDATES_STATUS = "weekly_updates_subscribed" satisfies FoundingMemberSignupStatus;

type WaitlistPayload = {
  email?: string;
  zipCode?: string;
};

export type WaitlistCaptureStorage = {
  findLatestFoundingMemberSignupByIdentity(input: {
    email: string;
    zipCode: string;
    planCode: string;
  }): Promise<FoundingMemberSignup | null>;
  createFoundingMemberSignup(input: {
    email: string;
    zipCode: string;
    planCode: string;
    status?: FoundingMemberSignupStatus;
  }): Promise<FoundingMemberSignup>;
  updateFoundingMemberSignup(
    signupId: string,
    patch: {
      status?: FoundingMemberSignupStatus;
    }
  ): Promise<FoundingMemberSignup>;
};

export type WaitlistCaptureResult =
  | {
      ok: true;
      status: 200;
      signup: FoundingMemberSignup;
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
  if (input.checkoutEnabled) {
    return {
      endpoint: "/api/founding-member/checkout",
      body: {
        email: input.email,
        zipCode: input.zipCode,
        plan: "founding-member"
      },
      expectsCheckoutUrl: true
    } as const;
  }

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

  const existingSignup = await storage.findLatestFoundingMemberSignupByIdentity({
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
    const repairedSignup = await storage.updateFoundingMemberSignup(existingSignup.id, {
      status: WEEKLY_UPDATES_STATUS
    });

    return {
      ok: true,
      status: 200,
      signup: repairedSignup,
      message: "You’re signed up for weekly updates."
    };
  }

  const signup = await storage.createFoundingMemberSignup({
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
