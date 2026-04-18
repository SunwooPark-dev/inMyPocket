import { getSupabaseServiceClient } from "./supabase.ts";
import type {
  FoundingMemberSignup,
  FoundingMemberSignupStatus
} from "./domain.ts";

type SignupInput = {
  email: string;
  zipCode: string;
  planCode: string;
  status?: FoundingMemberSignupStatus;
};

type SignupRecord = Record<string, unknown>;

function requireSupabase() {
  const client = getSupabaseServiceClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  return client;
}

function mapSignupRecord(record: SignupRecord): FoundingMemberSignup {
  return {
    id: String(record.id),
    email: String(record.email),
    zipCode: String(record.zip_code),
    planCode: String(record.plan_code),
    status: String(record.status) as FoundingMemberSignupStatus,
    stripeCustomerId: record.stripe_customer_id ? String(record.stripe_customer_id) : null,
    stripeCheckoutSessionId: record.stripe_checkout_session_id
      ? String(record.stripe_checkout_session_id)
      : null,
    stripeSubscriptionId: record.stripe_subscription_id
      ? String(record.stripe_subscription_id)
      : null,
    createdAt: new Date(String(record.created_at)).toISOString(),
    updatedAt: new Date(String(record.updated_at)).toISOString()
  };
}

export async function createFoundingMemberSignup(input: SignupInput) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("founding_member_signups")
    .insert({
      email: input.email,
      zip_code: input.zipCode,
      plan_code: input.planCode,
      status: input.status ?? "pending_checkout"
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create founding member signup: ${error.message}`);
  }

  return mapSignupRecord(data as SignupRecord);
}

export async function findLatestFoundingMemberSignupByIdentity(input: {
  email: string;
  zipCode: string;
  planCode: string;
}) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("founding_member_signups")
    .select("*")
    .eq("email", input.email)
    .eq("zip_code", input.zipCode)
    .eq("plan_code", input.planCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to find founding member signup: ${error.message}`);
  }

  return data ? mapSignupRecord(data as SignupRecord) : null;
}

export async function deleteFoundingMemberSignupById(signupId: string) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("founding_member_signups")
    .delete()
    .eq("id", signupId);

  if (error) {
    throw new Error(`Failed to delete founding member signup: ${error.message}`);
  }
}

export async function updateFoundingMemberSignup(
  signupId: string,
  patch: Partial<{
    status: FoundingMemberSignupStatus;
    stripeCustomerId: string | null;
    stripeCheckoutSessionId: string | null;
    stripeSubscriptionId: string | null;
  }>
) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("founding_member_signups")
    .update({
      status: patch.status,
      stripe_customer_id: patch.stripeCustomerId,
      stripe_checkout_session_id: patch.stripeCheckoutSessionId,
      stripe_subscription_id: patch.stripeSubscriptionId,
      updated_at: new Date().toISOString()
    })
    .eq("id", signupId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update founding member signup: ${error.message}`);
  }

  return mapSignupRecord(data as SignupRecord);
}

export async function getFoundingMemberSignupByCheckoutSessionId(checkoutSessionId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("founding_member_signups")
    .select("*")
    .eq("stripe_checkout_session_id", checkoutSessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch founding member signup by session: ${error.message}`);
  }

  return data ? mapSignupRecord(data as SignupRecord) : null;
}

export async function getFoundingMemberSignupById(signupId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("founding_member_signups")
    .select("*")
    .eq("id", signupId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch founding member signup: ${error.message}`);
  }

  return data ? mapSignupRecord(data as SignupRecord) : null;
}

export async function getFoundingMemberSignupBySubscriptionId(subscriptionId: string) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("founding_member_signups")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch founding member signup by subscription: ${error.message}`);
  }

  return data ? mapSignupRecord(data as SignupRecord) : null;
}

export async function updateFoundingMemberSignupByCheckoutSessionId(
  checkoutSessionId: string,
  patch: Partial<{
    status: FoundingMemberSignupStatus;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  }>
) {
  const signup = await getFoundingMemberSignupByCheckoutSessionId(checkoutSessionId);

  if (!signup) {
    return null;
  }

  return updateFoundingMemberSignup(signup.id, {
    status: patch.status,
    stripeCustomerId: patch.stripeCustomerId ?? signup.stripeCustomerId ?? null,
    stripeCheckoutSessionId: signup.stripeCheckoutSessionId ?? checkoutSessionId,
    stripeSubscriptionId: patch.stripeSubscriptionId ?? signup.stripeSubscriptionId ?? null
  });
}

export async function updateFoundingMemberSignupBySubscriptionId(
  subscriptionId: string,
  patch: Partial<{
    status: FoundingMemberSignupStatus;
    stripeCustomerId: string | null;
  }>
) {
  const signup = await getFoundingMemberSignupBySubscriptionId(subscriptionId);

  if (!signup) {
    return null;
  }

  return updateFoundingMemberSignup(signup.id, {
    status: patch.status,
    stripeCustomerId: patch.stripeCustomerId ?? signup.stripeCustomerId ?? null,
    stripeCheckoutSessionId: signup.stripeCheckoutSessionId ?? null,
    stripeSubscriptionId: subscriptionId
  });
}

export async function saveImportedWaitlistEntry(rawEntry: {
  email?: string;
  zipCode?: string;
  plan?: string;
  createdAt?: string;
}) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("founding_member_signups").insert({
    email: rawEntry.email ?? "",
    zip_code: rawEntry.zipCode ?? "",
    plan_code: rawEntry.plan ?? "founding-member",
    status: "pending_checkout",
    created_at: rawEntry.createdAt ?? new Date().toISOString(),
    updated_at: rawEntry.createdAt ?? new Date().toISOString()
  });

  if (error) {
    throw new Error(`Failed to import waitlist entry: ${error.message}`);
  }
}
