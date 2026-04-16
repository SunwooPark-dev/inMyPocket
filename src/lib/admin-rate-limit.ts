const WINDOW_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type AdminUnlockAttemptState = {
  firstAttemptAt: number;
  attempts: number;
  lockedUntil: number | null;
};

type AdminUnlockAttemptStore = Map<string, AdminUnlockAttemptState>;

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

export function getAdminUnlockClientKey(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  const cfIp = headers.get("cf-connecting-ip")?.trim();
  const userAgent = headers.get("user-agent")?.trim() ?? "unknown-agent";
  const ip = cfIp || forwardedFor || realIp || "unknown-ip";

  return `${ip}::${userAgent.slice(0, 120)}`;
}

export function getAdminUnlockRateLimitStatus(clientKey: string, now = Date.now()) {
  const current = normalizeState(attemptStore.get(clientKey) ?? getInitialState(now), now);
  attemptStore.set(clientKey, current);

  const retryAfterMs = current.lockedUntil ? Math.max(current.lockedUntil - now, 0) : 0;

  return {
    allowed: !current.lockedUntil,
    attempts: current.attempts,
    remainingAttempts: Math.max(MAX_ATTEMPTS - current.attempts, 0),
    retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
  };
}

export function recordAdminUnlockFailure(clientKey: string, now = Date.now()) {
  const current = normalizeState(attemptStore.get(clientKey) ?? getInitialState(now), now);
  current.attempts += 1;

  if (current.attempts >= MAX_ATTEMPTS) {
    current.lockedUntil = now + LOCKOUT_MS;
  }

  attemptStore.set(clientKey, current);

  return {
    allowed: !current.lockedUntil,
    attempts: current.attempts,
    remainingAttempts: Math.max(MAX_ATTEMPTS - current.attempts, 0),
    retryAfterSeconds: current.lockedUntil
      ? Math.ceil((current.lockedUntil - now) / 1000)
      : 0
  };
}

export function clearAdminUnlockAttempts(clientKey: string) {
  attemptStore.delete(clientKey);
}

export function resetAdminUnlockAttemptStore() {
  attemptStore.clear();
}

export const adminUnlockRateLimitPolicy = {
  windowMs: WINDOW_MS,
  lockoutMs: LOCKOUT_MS,
  maxAttempts: MAX_ATTEMPTS
};
