import Stripe from "stripe";

import {
  appEnv,
  isStripeConfigured,
  isSupabaseConfigured
} from "../../../../lib/env";
import {
  getFoundingMemberSignupById,
  updateFoundingMemberSignup,
  updateFoundingMemberSignupByCheckoutSessionId,
  updateFoundingMemberSignupBySubscriptionId
} from "../../../../lib/server-storage";
import { getStripeClient } from "../../../../lib/stripe";

async function updateSignupFromCheckoutSession(
  session: Stripe.Checkout.Session,
  status: "paid" | "canceled"
) {
  const metadataSignupId =
    typeof session.metadata?.signup_id === "string" ? session.metadata.signup_id : null;
  const clientReferenceId =
    typeof session.client_reference_id === "string" ? session.client_reference_id : null;
  const signupId = metadataSignupId ?? clientReferenceId;

  if (signupId) {
    const existingSignup = await getFoundingMemberSignupById(signupId);

    if (existingSignup) {
      await updateFoundingMemberSignup(existingSignup.id, {
        status,
        stripeCustomerId: session.customer ? String(session.customer) : null,
        stripeCheckoutSessionId: session.id,
        stripeSubscriptionId: session.subscription ? String(session.subscription) : null
      });
      return;
    }
  }

  await updateFoundingMemberSignupByCheckoutSessionId(session.id, {
    status,
    stripeCustomerId: session.customer ? String(session.customer) : null,
    stripeSubscriptionId: session.subscription ? String(session.subscription) : null
  });
}

export async function POST(request: Request) {
  if (!isStripeConfigured() || !isSupabaseConfigured()) {
    return Response.json({ error: "Stripe or Supabase is not configured." }, { status: 503 });
  }

  const stripe = getStripeClient();

  if (!stripe) {
    return Response.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, appEnv.stripeWebhookSecret!);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe signature.";
    return Response.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await updateSignupFromCheckoutSession(session, "paid");
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await updateSignupFromCheckoutSession(session, "canceled");
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = (
      invoice as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
      }
    ).subscription;

    if (subscriptionId) {
      await updateFoundingMemberSignupBySubscriptionId(String(subscriptionId), {
        status: "paid",
        stripeCustomerId: invoice.customer ? String(invoice.customer) : null
      });
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = (
      invoice as Stripe.Invoice & {
        subscription?: string | Stripe.Subscription | null;
      }
    ).subscription;

    if (subscriptionId) {
      await updateFoundingMemberSignupBySubscriptionId(String(subscriptionId), {
        status: "payment_failed",
        stripeCustomerId: invoice.customer ? String(invoice.customer) : null
      });
    }
  }

  return Response.json({ received: true });
}
