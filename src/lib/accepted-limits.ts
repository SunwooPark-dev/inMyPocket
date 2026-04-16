export type AcceptedLimit = {
  key: string;
  title: string;
  status: "accepted" | "deferred";
  detail: string;
  reopenWhen: string;
};

export function getAcceptedLimits() {
  return [
    {
      key: "admin-unlock-local",
      title: "Admin unlock throttling is local-only",
      status: "accepted",
      detail: "Current lockout behavior is process-local and resets when the local runtime restarts.",
      reopenWhen: "The product needs stronger abuse controls across multiple instances or broader exposure."
    },
    {
      key: "supabase-proof-multisource",
      title: "Supabase proof still comes from multiple evidence sources",
      status: "accepted",
      detail: "The operator bundle is reproducible, but the underlying trust-boundary proof still comes from smoke, scripts, and live checks rather than one single runtime-native artifact.",
      reopenWhen: "The operator evidence bundle falls out of sync with the underlying proof steps."
    },
    {
      key: "payment-deferred",
      title: "Stripe payment proof remains deferred",
      status: "deferred",
      detail: "Payment is outside the current merge gate until Stripe test-mode secrets are supplied.",
      reopenWhen: "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and STRIPE_PRICE_ID_FOUNDING_MEMBER are available."
    }
  ] satisfies AcceptedLimit[];
}
