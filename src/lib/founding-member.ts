import type Stripe from "stripe";

import type { FoundingMemberSignup } from "./domain.ts";

export function buildFoundingMemberCheckoutParams(input: {
  signup: FoundingMemberSignup;
  priceId: string;
  appUrl: string;
}): Stripe.Checkout.SessionCreateParams {
  const { signup, priceId, appUrl } = input;

  return {
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    customer_email: signup.email,
    client_reference_id: signup.id,
    success_url: `${appUrl}/founding-member/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/founding-member/cancel?signup_id=${signup.id}`,
    allow_promotion_codes: true,
    metadata: {
      signup_id: signup.id,
      zip_code: signup.zipCode,
      plan_code: signup.planCode
    },
    subscription_data: {
      metadata: {
        signup_id: signup.id,
        zip_code: signup.zipCode,
        plan_code: signup.planCode
      }
    }
  };
}
