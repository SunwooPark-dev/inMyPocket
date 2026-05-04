import { createHmac, timingSafeEqual } from "node:crypto";

import { appEnv } from "./env.ts";

const COOKIE_NAME = "inmypoket_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getAdminAccessToken() {
  return process.env.ADMIN_ACCESS_TOKEN ?? appEnv.adminAccessToken ?? null;
}

function getAdminSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? appEnv.adminSessionSecret ?? null;
}

function sign(value: string) {
  return createHmac("sha256", getAdminSessionSecret() ?? "missing-session-secret")
    .update(value)
    .digest("hex");
}

function buildPayload(expiresAt: string) {
  return `admin:${expiresAt}`;
}

export function isAdminAuthConfigured() {
  return Boolean(getAdminAccessToken() && getAdminSessionSecret());
}

export function isValidAdminAccessToken(candidate: string | undefined) {
  const expected = getAdminAccessToken();

  if (!expected || !candidate) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function createAdminSessionValue() {
  const expiresAt = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const payload = buildPayload(expiresAt);
  const signature = sign(payload);
  return `${expiresAt}.${signature}`;
}

export function shouldUseSecureAdminCookie(appUrl = process.env.APP_URL ?? appEnv.appUrl) {
  if (!appUrl) {
    return false;
  }

  try {
    return new URL(appUrl).protocol === "https:";
  } catch {
    return false;
  }
}

export function verifyAdminSessionValue(value: string | undefined) {
  if (!value || !isAdminAuthConfigured()) {
    return false;
  }

  const [expiresAt, signature] = value.split(".");

  if (!expiresAt || !signature) {
    return false;
  }

  if (Number(expiresAt) < Date.now()) {
    return false;
  }

  const expected = sign(buildPayload(expiresAt));

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isAdminAuthorized() {
  if (!isAdminAuthConfigured()) {
    return false;
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return verifyAdminSessionValue(cookieStore.get(COOKIE_NAME)?.value);
}

export const adminCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_MAX_AGE_SECONDS
};
