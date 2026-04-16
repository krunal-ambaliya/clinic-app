import { createHmac, timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";

export const ADMIN_SESSION_COOKIE = "admin_portal_session";
const SESSION_DURATION_DAYS = 7;

type AdminSessionPayload = {
  email: string;
  exp: number;
};

export type AdminSessionUser = {
  email: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getAdminEmail() {
  return normalizeEmail(process.env.ADMIN_PORTAL_EMAIL ?? "admin@site.com");
}

function getAdminPassword() {
  return process.env.ADMIN_PORTAL_PASSWORD ?? "admin@123";
}

function getTokenSecret() {
  return process.env.ADMIN_PORTAL_SECRET ?? process.env.NEXTAUTH_SECRET ?? "clinic-admin-secret";
}

function sign(payloadBase64: string) {
  return createHmac("sha256", getTokenSecret()).update(payloadBase64).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

function encodePayload(payload: AdminSessionPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(value: string): AdminSessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      email?: string;
      exp?: number;
    };

    if (!parsed.email || typeof parsed.exp !== "number") {
      return null;
    }

    return {
      email: normalizeEmail(parsed.email),
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

function buildToken(email: string) {
  const payload: AdminSessionPayload = {
    email: normalizeEmail(email),
    exp: Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
  };

  const encodedPayload = encodePayload(payload);
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminCredentials(email: string, password: string) {
  return normalizeEmail(email) === getAdminEmail() && password === getAdminPassword();
}

export function createAdminSession(email: string) {
  return {
    token: buildToken(email),
    maxAgeSeconds: SESSION_DURATION_DAYS * 24 * 60 * 60,
  };
}

export function getAdminUserByToken(token: string): AdminSessionUser | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  const payload = decodePayload(encodedPayload);

  if (!payload) {
    return null;
  }

  if (payload.exp <= Date.now()) {
    return null;
  }

  if (payload.email !== getAdminEmail()) {
    return null;
  }

  return {
    email: payload.email,
  };
}

export function getAdminFromRequest(request: NextRequest): AdminSessionUser | null {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  return getAdminUserByToken(token);
}
