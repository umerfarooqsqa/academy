// Password hashing for the User table (multi-user accounts, 2026-10 planning
// session). Node's built-in crypto.scrypt — no new npm dependency, consistent
// with this codebase's minimal-dependency ethos (same reasoning that kept
// lib/auth.ts on Web Crypto instead of a JWT library). This module runs ONLY in
// Next.js API routes (Node runtime) — never import it from middleware.ts, which
// Next.js runs on the Edge Runtime where node:crypto isn't available.

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

/** Stored format: "<saltHex>:<hashHex>". */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(plain, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false; // fail closed on a malformed/empty stored value

  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    // Buffer.from(..., "hex") silently truncates at the first invalid pair
    // rather than throwing — "zz" decodes to a zero-length buffer, which would
    // make an empty derived key compare as "equal" to it (timingSafeEqual on
    // two zero-length buffers is vacuously true). Reject that explicitly.
    if (salt.length === 0 || expected.length === 0) return false;
    const derived = (await scrypt(plain, salt, expected.length)) as Buffer;
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false; // malformed hex, etc. — never throw out of an auth check
  }
}
