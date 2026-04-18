function readEnv(name: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : null;
}

export const appEnv = {
  supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabasePublishableKey: readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  stripeSecretKey: readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: readEnv("STRIPE_WEBHOOK_SECRET"),
  stripePriceIdFoundingMember: readEnv("STRIPE_PRICE_ID_FOUNDING_MEMBER"),
  appUrl: readEnv("APP_URL") ?? "http://localhost:3000",
  adminAccessToken: readEnv("ADMIN_ACCESS_TOKEN"),
  adminSessionSecret: readEnv("ADMIN_SESSION_SECRET")
};

export const monetizationModel = "donation-and-ads" as const;

export function isSupabaseConfigured() {
  return Boolean(
    appEnv.supabaseUrl &&
      appEnv.supabasePublishableKey &&
      appEnv.supabaseServiceRoleKey
  );
}

export function isStripeConfigured() {
  return Boolean(
    appEnv.stripeSecretKey &&
      appEnv.stripeWebhookSecret &&
      appEnv.stripePriceIdFoundingMember
  );
}

export function isPaymentFlowEnabled() {
  return false;
}
