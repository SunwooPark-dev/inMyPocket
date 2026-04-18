import { appEnv, isPaymentFlowEnabled } from "../../../../lib/env";
import { buildFoundingMemberCheckoutParams } from "../../../../lib/founding-member";
import {
  createFoundingMemberSignup,
  deleteFoundingMemberSignupById,
  findLatestFoundingMemberSignupByIdentity,
  updateFoundingMemberSignup
} from "../../../../lib/server-storage";
import { getStripeClient } from "../../../../lib/stripe";

type CheckoutPayload = {
  email?: string;
  zipCode?: string;
  plan?: string;
};

export async function POST(request: Request) {
  if (!isPaymentFlowEnabled()) {
    return Response.json(
      { error: "Payment-based membership is not part of the current product model." },
      { status: 410 }
    );
  }

  const payload = (await request.json().catch(() => null)) as CheckoutPayload | null;
  const email = payload?.email?.trim().toLowerCase() ?? "";
  const zipCode = payload?.zipCode?.trim() ?? "";
  const planCode = payload?.plan?.trim() ?? "founding-member";

  if (!email || !email.includes("@")) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (!/^\d{5}$/.test(zipCode)) {
    return Response.json({ error: "A 5-digit ZIP code is required." }, { status: 400 });
  }

  const reusableSignup = await findLatestFoundingMemberSignupByIdentity({
    email,
    zipCode,
    planCode
  });

  if (reusableSignup?.status === "paid") {
    return Response.json(
      { error: "This email already has an active founding member signup." },
      { status: 409 }
    );
  }

  const signup =
    reusableSignup &&
    (reusableSignup.status === "pending_checkout" ||
      reusableSignup.status === "payment_failed")
      ? reusableSignup
      : await createFoundingMemberSignup({
          email,
          zipCode,
          planCode
        });

  const stripe = getStripeClient();

  if (!stripe) {
    return Response.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  let session;

  try {
    session = await stripe.checkout.sessions.create(
      buildFoundingMemberCheckoutParams({
        signup,
        priceId: appEnv.stripePriceIdFoundingMember!,
        appUrl: appEnv.appUrl
      }),
      {
        idempotencyKey: `founding-member:${signup.id}`
      }
    );
  } catch (error) {
    if (!reusableSignup) {
      await deleteFoundingMemberSignupById(signup.id).catch(() => null);
    }

    throw error;
  }

  await updateFoundingMemberSignup(signup.id, {
    stripeCheckoutSessionId: session.id
  });

  return Response.json({
    checkoutUrl: session.url
  });
}
