import { getSupabaseServiceClient } from "./supabase.ts";
import type { WaitlistLead, WaitlistLeadStatus } from "./domain.ts";

type WaitlistLeadRecord = Record<string, unknown>;

function requireSupabase() {
  const client = getSupabaseServiceClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  return client;
}

function mapWaitlistLeadRecord(record: WaitlistLeadRecord): WaitlistLead {
  return {
    id: String(record.id),
    email: String(record.email),
    zipCode: String(record.zip_code),
    planCode: String(record.plan_code),
    status: String(record.status) as WaitlistLeadStatus,
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

export async function createWaitlistLead(input: {
  email: string;
  zipCode: string;
  planCode: string;
  status?: WaitlistLeadStatus;
}): Promise<WaitlistLead> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("founding_member_signups")
    .insert({
      email: input.email,
      zip_code: input.zipCode,
      plan_code: input.planCode,
      status: input.status ?? "weekly_updates_subscribed"
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create waitlist lead: ${error.message}`);
  }

  return mapWaitlistLeadRecord(data as WaitlistLeadRecord);
}

export async function findLatestWaitlistLeadByIdentity(input: {
  email: string;
  zipCode: string;
  planCode: string;
}): Promise<WaitlistLead | null> {
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
    throw new Error(`Failed to find waitlist lead: ${error.message}`);
  }

  return data ? mapWaitlistLeadRecord(data as WaitlistLeadRecord) : null;
}

export async function updateWaitlistLead(
  leadId: string,
  patch: {
    status?: WaitlistLeadStatus;
  }
): Promise<WaitlistLead> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("founding_member_signups")
    .update({
      status: patch.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", leadId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update waitlist lead: ${error.message}`);
  }

  return mapWaitlistLeadRecord(data as WaitlistLeadRecord);
}

export async function saveImportedWaitlistEntry(rawEntry: {
  email?: string;
  zipCode?: string;
  plan?: string;
  createdAt?: string;
}) {
  const supabase = requireSupabase();
  const createdAt = rawEntry.createdAt ?? new Date().toISOString();
  const { error } = await supabase.from("founding_member_signups").insert({
    email: rawEntry.email ?? "",
    zip_code: rawEntry.zipCode ?? "",
    plan_code: rawEntry.plan ?? "weekly-updates",
    status: "weekly_updates_subscribed",
    created_at: createdAt,
    updated_at: createdAt
  });

  if (error) {
    throw new Error(`Failed to import waitlist entry: ${error.message}`);
  }
}
