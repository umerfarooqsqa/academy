// Simple database-backed rate limiting (2026-10-15 security hardening) for the
// public doors an attacker would hammer: admin login (password guessing), the
// "I'm interested" button (probing which phone numbers belong to tutors) and
// the public forms (spam floods). One RateLimitHit row per attempt; a key is
// allowed `limit` attempts per rolling `windowMs`. Old rows are pruned now and
// then. Fails OPEN (allows) if the database check itself errors, so a DB blip
// never locks the operator out — the limits are a brake, not the only lock.

import { prisma } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The caller's IP — Cloudflare sets cf-connecting-ip on every request. */
export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Records an attempt for `key`; returns false when the key is over its limit
 * (the attempt is then not recorded, so waiting it out works). */
export async function allowAttempt(key: string, limit: number, windowMs: number, now: Date = new Date()): Promise<boolean> {
  try {
    const recent = await prisma.rateLimitHit.count({
      where: { key, createdAt: { gte: new Date(now.getTime() - windowMs) } },
    });
    if (recent >= limit) return false;
    await prisma.rateLimitHit.create({ data: { key } });
    if (Math.random() < 0.02) {
      await prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - DAY_MS) } } });
    }
    return true;
  } catch (err) {
    console.error("[rate-limit] check failed, allowing:", (err as Error).message);
    return true;
  }
}

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
