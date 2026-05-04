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
      key: "monetization-nonpayment",
      title: "Payment is not part of the current business model",
      status: "accepted",
      detail: "The current public product runs on a non-payment path while donation and advertising support are being considered.",
      reopenWhen: "The product intentionally decides to reactivate direct payment or paid membership."
    }
  ] satisfies AcceptedLimit[];
}
