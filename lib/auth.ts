// Multi-user credential gate (2026-10 planning session — deliberately
// reversing CLAUDE.md Section 4/12's "single admin, no multi-tenant auth"
// stance at the operator's direct request; see prisma/schema.prisma's User
// model comment). A signed, expiring cookie carries the logged-in user's id
// and role — no server-side session store beyond the cookie itself.
//
// Uses Web Crypto (globalThis.crypto.subtle) rather than node:crypto — this
// module is imported by middleware.ts, which Next.js runs on the Edge Runtime
// (no Node built-ins available there), so Web Crypto keeps auth working in both
// Node routes and Edge middleware without a runtime-specific workaround.
// Password hashing (which DOES need node:crypto) lives separately in
// lib/auth/passwords.ts, imported only from API routes, never from here.

import { config } from "@/lib/config";

export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionIdentity {
  userId: string;
  role: string;
}

const encoder = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function sign(payload: string): Promise<string> {
  const key = await hmacKey(config.sessionSecret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Buffer.from(sig).toString("hex");
}

/** Constant-time string comparison (equal-length inputs only — callers check length first). */
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Builds the cookie value: `<userId>.<role>.<expiry>.<hmac>`. userId/role are
 * trusted once the signature verifies — they can't be tampered with without
 * invalidating the HMAC, same guarantee the old expiry-only token had. */
export async function createSessionToken(userId: string, role: string, now: number = Date.now()): Promise<string> {
  const expiry = String(now + SESSION_TTL_MS);
  const payload = `${userId}.${role}.${expiry}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  now: number = Date.now(),
): Promise<SessionIdentity | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, role, expiry, signature] = parts;
  if (!userId || !role || !expiry || !signature) return null;
  if (Number(expiry) < now) return null;

  const payload = `${userId}.${role}.${expiry}`;
  const expected = await sign(payload);
  if (!timingSafeEqualStr(signature, expected)) return null;
  return { userId, role };
}
