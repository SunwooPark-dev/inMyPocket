export type WaitlistAudience = "self" | "caregiver";

export function getWaitlistIntroCopy(checkoutEnabled: boolean, audience: WaitlistAudience) {
  return audience === "caregiver"
    ? "Get one plain-English weekly email you can use while shopping for a parent or older family member."
    : "Get one plain-English weekly email showing where this basket is cheapest in your area.";
}

export function getWaitlistTrustPoints(audience: WaitlistAudience) {
  if (audience === "caregiver") {
    return [
      "Weekly updates only — no payment info required.",
      "Useful if you shop for a parent, grandparent, or older neighbor.",
      "We note estimated items clearly so you can double-check before you go."
    ];
  }

  return [
    "Weekly updates only — no payment info required.",
    "Based on the same basket and trust notes shown above.",
    "Unsubscribe anytime if the updates stop being useful."
  ];
}

export function getWaitlistSubmitLabel(
  status: "idle" | "saving" | "done" | "error",
  checkoutEnabled: boolean
) {
  if (status === "saving") {
    return "Starting weekly updates...";
  }

  return "Get weekly updates";
}

export function normalizeWaitlistMessage(message: string) {
  if (message === "A valid email is required.") {
    return "Please enter a valid email address.";
  }

  if (message === "A 5-digit ZIP code is required.") {
    return "Please enter a 5-digit ZIP code.";
  }

  if (message === "This email already has an active founding member signup.") {
    return "This email is already signed up.";
  }

  return message;
}
