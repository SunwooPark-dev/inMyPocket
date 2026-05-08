import { getSupabaseServiceClient } from "./supabase.ts";

const WINDOW_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type AdminUnlockAttemptState = {
  firstAttemptAt: number;
  attempts: number;
  lockedUntil: number | null;
};

type AdminUnlockAttemptStore = Map<string, AdminUnlockAttemptState>;

type RateLimitStatus = {
  allowed: boolean;
  attempts: number;
  remainingAttempts: number;
  retryAfterSeconds: number;
};

declare global {
  var __inmypoketAdminUnlockAttempts: AdminUnlockAttemptStore | undefined;
}

const attemptStore: AdminUnlockAttemptStore =
  globalThis.__inmypoketAdminUnlockAttempts ??
  (globalThis.__inmypoketAdminUnlockAttempts = new Map<string, AdminUnlockAttemptState>());

function getInitialState(now: number): AdminUnlockAttemptState {
  return {
    firstAttemptAt: now,
    attempts: 0,
    lockedUntil: null
  };
}

function normalizeState(state: AdminUnlockAttemptState, now: number) {
  if (state.lockedUntil && state.lockedUntil <= now) {
    return getInitialState(now);
  }

  if (now - state.firstAttemptAt > WINDOW_MS) {
    return getInitialState(now);
  }

  return state;
}

function buildStatus(state: AdminUnlockAttemptState, now: number): RateLimitStatus {
  const retryAfterMs = state.lockedUntil ? Math.max(state.lockedUntil - now, 0) : 0;

  return {
    allowed: !state.lockedUntil,
    attempts: state.attempts,
    remainingAttempts: Math.max(MAX_ATTEMPTS - state.attempts, 0),
    retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
  };
}

// ─── Supabase persistence layer ─────────────────────────────────────────────

type SupabaseRateLimitRow = {
  client_key: string;
  first_attempt_at: string;
  attempts: number;
  locked_until: string | null;
};

const TABLE = "admin_rate_limit";

let supabaseAvailable: boolean | null = null;

async function isSupabaseReady(): Promise<boolean> {
  if (supabaseAvailable !== null) return supabaseAvailable;
  const client = getSupabaseServiceClient();
  if (!client) {
    supabaseAvailable = false;
    return false;
  }

  try {
    const { error } = await client.from(TABLE).select("client_key").limit(1);
    supabaseAvailable = !error;
    if (error) {
      console.warn("[admin-rate-limit] Supabase table unavailable, using in-memory fallback:", error.message);
    }
    return supabaseAvailable;
  } catch {
    supabaseAvailable = false;
    return false;
  }
}

function rowToState(row: SupabaseRateLimitRow): AdminUnlockAttemptState {
  return {
    firstAttemptAt: new Date(row.first_attempt_at).getTime(),
    attempts: row.attempts,
    lockedUntil: row.locked_until ? new Date(row.locked_until).getTime() : null
  };
}

async function readFromSupabase(clientKey: string): Promise<AdminUnlockAttemptState | null> {
  if (!(await isSupabaseReady())) return null;

  const client = getSupabaseServiceClient()!;
  const { data, error } = await client
    .from(TABLE)
    .select("*")
    .eq("client_key", clientKey)
    .maybeSingle();

  if (error || !data) return null;
  return rowToState(data as SupabaseRateLimitRow);
}

async function writeToSupabase(clientKey: string, state: AdminUnlockAttemptState): Promise<void> {
  if (!(await isSupabaseReady())) return;

  const client = getSupabaseServiceClient()!;
  const row = {
    client_key: clientKey,
    first_attempt_at: new Date(state.firstAttemptAt).toISOString(),
    attempts: state.attempts,
    locked_until: state.lockedUntil ? new Date(state.lockedUntil).toISOString() : null
  };

  const { error } = await client
    .from(TABLE)
    .upsert(row, { onConflict: "client_key" });

  if (error) {
    console.warn("[admin-rate-limit] Supabase write failed:", error.message);
  }
}

async function deleteFromSupabase(clientKey: string): Promise<void> {
  if (!(await isSupabaseReady())) return;

  const client = getSupabaseServiceClient()!;
  const { error } = await client
    .from(TABLE)
    .delete()
    .eq("client_key", clientKey);

  if (error) {
    console.warn("[admin-rate-limit] Supabase delete failed:", error.message);
  }
}

async function purgeExpiredFromSupabase(): Promise<void> {
  if (!(await isSupabaseReady())) return;

  const client = getSupabaseServiceClient()!;
  const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();

  const { error } = await client
    .from(TABLE)
    .delete()
    .lt("updated_at", cutoff)
    .is("locked_until", null);

  if (error) {
    console.warn("[admin-rate-limit] Supabase purge failed:", error.message);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getAdminUnlockClientKey(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  const cfIp = headers.get("cf-connecting-ip")?.trim();
  const userAgent = headers.get("user-agent")?.trim() ?? "unknown-agent";
  const ip = cfIp || forwardedFor || realIp || "unknown-ip";

  return `${ip}::${userAgent.slice(0, 120)}`;
}

/**
 * Read rate-limit status. Tries Supabase first for cross-instance consistency,
 * falls back to in-memory store when Supabase is unavailable.
 */
export async function getAdminUnlockRateLimitStatus(
  clientKey: string,
  now = Date.now()
): Promise<RateLimitStatus> {
  // Try Supabase first
  const remoteState = await readFromSupabase(clientKey);
  if (remoteState) {
    const normalized = normalizeState(remoteState, now);
    attemptStore.set(clientKey, normalized);
    return buildStatus(normalized, now);
  }

  // Fallback: in-memory
  const current = normalizeState(attemptStore.get(clientKey) ?? getInitialState(now), now);
  attemptStore.set(clientKey, current);
  return buildStatus(current, now);
}

/**
 * Record a failed unlock attempt. Writes to both Supabase and in-memory.
 */
export async function recordAdminUnlockFailure(
  clientKey: string,
  now = Date.now()
): Promise<RateLimitStatus> {
  // Merge Supabase state with local if available
  const remoteState = await readFromSupabase(clientKey);
  const localState = attemptStore.get(clientKey);

  // Use whichever has more attempts (worst case)
  let base: AdminUnlockAttemptState;
  if (remoteState && localState) {
    base = remoteState.attempts >= localState.attempts ? remoteState : localState;
  } else {
    base = remoteState ?? localState ?? getInitialState(now);
  }

  const current = normalizeState(base, now);
  current.attempts += 1;

  if (current.attempts >= MAX_ATTEMPTS) {
    current.lockedUntil = now + LOCKOUT_MS;
  }

  // Write-through: both stores
  attemptStore.set(clientKey, current);
  await writeToSupabase(clientKey, current);

  return buildStatus(current, now);
}

/**
 * Clear rate-limit state for a client (e.g. on successful unlock).
 */
export async function clearAdminUnlockAttempts(clientKey: string): Promise<void> {
  attemptStore.delete(clientKey);
  await deleteFromSupabase(clientKey);
}

/**
 * Reset in-memory store only. Used in tests.
 */
export function resetAdminUnlockAttemptStore() {
  attemptStore.clear();
}

/**
 * Purge expired entries from Supabase. Safe to call periodically.
 */
export async function purgeExpiredRateLimits(): Promise<void> {
  await purgeExpiredFromSupabase();
}

export const adminUnlockRateLimitPolicy = {
  windowMs: WINDOW_MS,
  lockoutMs: LOCKOUT_MS,
  maxAttempts: MAX_ATTEMPTS
};
