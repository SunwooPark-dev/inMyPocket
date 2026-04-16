export type AdminUnlockErrorPayload = {
  error?: string;
  attempts?: number;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
};

function formatRetryAfter(retryAfterSeconds: number) {
  if (retryAfterSeconds < 60) {
    return `${retryAfterSeconds} seconds`;
  }

  const minutes = Math.ceil(retryAfterSeconds / 60);
  return minutes === 1 ? "about 1 minute" : `about ${minutes} minutes`;
}

export function formatAdminUnlockFeedback(payload: AdminUnlockErrorPayload | null) {
  const error = payload?.error ?? "Could not unlock admin.";

  if (payload?.retryAfterSeconds && payload.retryAfterSeconds > 0) {
    return `${error} Locked for ${formatRetryAfter(payload.retryAfterSeconds)}.`;
  }

  if (
    typeof payload?.remainingAttempts === "number" &&
    payload.remainingAttempts >= 0 &&
    error === "Invalid admin access token."
  ) {
    if (payload.remainingAttempts === 0) {
      return "Invalid admin access token. No attempts remain before lockout.";
    }

    if (payload.remainingAttempts === 1) {
      return "Invalid admin access token. 1 attempt remains before lockout.";
    }

    return `Invalid admin access token. ${payload.remainingAttempts} attempts remain before lockout.`;
  }

  return error;
}
