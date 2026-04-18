import Stripe from "stripe";

import { appEnv, isStripeConfigured } from "./env.ts";

let stripeClient: Stripe | null | undefined;

export function getStripeClient() {
  if (!isStripeConfigured()) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(appEnv.stripeSecretKey!);
  }

  return stripeClient;
}
