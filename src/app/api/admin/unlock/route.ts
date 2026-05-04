import { NextResponse } from "next/server";

import { recordAdminUnlockIncident } from "../../../../lib/admin-unlock-audit";
import {
  adminCookie,
  createAdminSessionValue,
  isAdminAuthConfigured,
  isValidAdminAccessToken,
  shouldUseSecureAdminCookie
} from "../../../../lib/admin-auth";
import {
  clearAdminUnlockAttempts,
  getAdminUnlockClientKey,
  getAdminUnlockRateLimitStatus,
  recordAdminUnlockFailure
} from "../../../../lib/admin-rate-limit";

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return Response.json({ error: "ADMIN_ACCESS_TOKEN is not configured." }, { status: 503 });
  }

  const clientKey = getAdminUnlockClientKey(request.headers);
  const payload = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = payload?.token?.trim() ?? "";

  if (isValidAdminAccessToken(token)) {
    clearAdminUnlockAttempts(clientKey);
    recordAdminUnlockIncident({
      eventType: "success",
      clientKey,
      attempts: 0,
      remainingAttempts: null,
      retryAfterSeconds: null
    });

    console.warn("[admin-unlock] success", {
      clientKey
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminCookie.name, createAdminSessionValue(), {
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureAdminCookie(),
      path: "/",
      maxAge: adminCookie.maxAge
    });

    return response;
  }

  const rateLimit = getAdminUnlockRateLimitStatus(clientKey);

  if (!rateLimit.allowed) {
    recordAdminUnlockIncident({
      eventType: "throttled",
      clientKey,
      attempts: rateLimit.attempts,
      remainingAttempts: rateLimit.remainingAttempts,
      retryAfterSeconds: rateLimit.retryAfterSeconds
    });
    console.warn("[admin-unlock] throttled", {
      clientKey,
      retryAfterSeconds: rateLimit.retryAfterSeconds
    });

    return Response.json(
      {
        error: "Too many failed attempts. Try again later.",
        attempts: rateLimit.attempts,
        remainingAttempts: rateLimit.remainingAttempts,
        retryAfterSeconds: rateLimit.retryAfterSeconds
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  if (!token) {
    const failure = recordAdminUnlockFailure(clientKey);
    recordAdminUnlockIncident({
      eventType: failure.allowed ? "invalid_token" : "throttled",
      clientKey,
      attempts: failure.attempts,
      remainingAttempts: failure.remainingAttempts,
      retryAfterSeconds: failure.retryAfterSeconds || null
    });
    console.warn("[admin-unlock] invalid token", {
      clientKey,
      attempts: failure.attempts,
      remainingAttempts: failure.remainingAttempts,
      retryAfterSeconds: failure.retryAfterSeconds
    });

    if (!failure.allowed) {
      return Response.json(
        {
          error: "Too many failed attempts. Try again later.",
          attempts: failure.attempts,
          remainingAttempts: failure.remainingAttempts,
          retryAfterSeconds: failure.retryAfterSeconds
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(failure.retryAfterSeconds)
          }
        }
      );
    }

    return Response.json(
      {
        error: "Invalid admin access token.",
        attempts: failure.attempts,
        remainingAttempts: failure.remainingAttempts
      },
      { status: 401 }
    );
  }

  const failure = recordAdminUnlockFailure(clientKey);
  recordAdminUnlockIncident({
    eventType: failure.allowed ? "invalid_token" : "throttled",
    clientKey,
    attempts: failure.attempts,
    remainingAttempts: failure.remainingAttempts,
    retryAfterSeconds: failure.retryAfterSeconds || null
  });
  console.warn("[admin-unlock] invalid token", {
    clientKey,
    attempts: failure.attempts,
    remainingAttempts: failure.remainingAttempts,
    retryAfterSeconds: failure.retryAfterSeconds
  });

  if (!failure.allowed) {
    return Response.json(
      {
        error: "Too many failed attempts. Try again later.",
        attempts: failure.attempts,
        remainingAttempts: failure.remainingAttempts,
        retryAfterSeconds: failure.retryAfterSeconds
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(failure.retryAfterSeconds)
        }
      }
    );
  }

  return Response.json(
    {
      error: "Invalid admin access token.",
      attempts: failure.attempts,
      remainingAttempts: failure.remainingAttempts
    },
    { status: 401 }
  );
}
