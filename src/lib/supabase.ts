import { createClient } from "@supabase/supabase-js";

import { appEnv, isSupabaseConfigured } from "./env.ts";

let serviceClient:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ReturnType<typeof createClient<any>>
  | null
  | undefined;
let publicClient:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ReturnType<typeof createClient<any>>
  | null
  | undefined;

export function getSupabaseServiceClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!serviceClient) {
    serviceClient = createClient(
      appEnv.supabaseUrl!,
      appEnv.supabaseServiceRoleKey!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  return serviceClient;
}

export function getSupabasePublicClient() {
  if (!appEnv.supabaseUrl || !appEnv.supabasePublishableKey) {
    return null;
  }

  if (!publicClient) {
    publicClient = createClient(
      appEnv.supabaseUrl,
      appEnv.supabasePublishableKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  return publicClient;
}
