import { createClient } from "@supabase/supabase-js";

import { appEnv, isSupabaseConfigured } from "./env.ts";

let serviceClient:
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
