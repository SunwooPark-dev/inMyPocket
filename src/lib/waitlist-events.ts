import type { WaitlistAudience } from "./waitlist-form-content";

export const WAITLIST_EVENT_NAME = "inmypoket.waitlist";

export type WaitlistEventDetail = {
  eventType: "viewed" | "audience_selected" | "submit_started" | "submit_succeeded" | "submit_failed";
  location: "homepage-weekly-updates";
  checkoutEnabled: boolean;
  audience: WaitlistAudience;
  zipCode: string;
  hasEmail: boolean;
  errorMessage?: string;
};

export function buildWaitlistEventDetail(input: {
  eventType: WaitlistEventDetail["eventType"];
  checkoutEnabled: boolean;
  audience: WaitlistAudience;
  zipCode: string;
  email?: string;
  errorMessage?: string;
}): WaitlistEventDetail {
  return {
    eventType: input.eventType,
    location: "homepage-weekly-updates",
    checkoutEnabled: input.checkoutEnabled,
    audience: input.audience,
    zipCode: input.zipCode.trim(),
    hasEmail: Boolean(input.email?.trim()),
    errorMessage: input.errorMessage
  };
}

export function trackWaitlistEvent(detail: WaitlistEventDetail) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }

  window.dispatchEvent(new CustomEvent(WAITLIST_EVENT_NAME, { detail }));
}
