// Shared guard for Vercel Cron-triggered routes (facebook digest,
// notification-delay check). Vercel automatically attaches
// `Authorization: Bearer <CRON_SECRET>` to its own cron requests once that
// env var is set on the project — no other Vercel-side config needed.
//
// Conditional on CRON_SECRET being set, matching this codebase's general
// graceful-degrade philosophy (lib/config.ts's `required()`): the route stays
// open until the operator configures it, rather than hard-blocking first.

import { NextResponse } from "next/server";

/** Returns a 401 response if CRON_SECRET is set and the request's bearer
 * token doesn't match; otherwise null (caller proceeds). */
export function checkCronSecret(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
