// Resolves the logged-in user's email from the session cookie, for stamping
// real identity into places that used to say a generic "dashboard" (e.g.
// ApprovalLog.after.actor, lib/matches/actions.ts#decideMatch) — enabled by
// the multi-user accounts change (2026-10 planning session). Node-runtime only
// (route handlers / server components), not importable from middleware.ts.

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

/** Returns the current user's email, or null if there's no valid session
 * (shouldn't normally happen on a route middleware.ts already protected, but
 * never throw over an audit-trail nicety). */
export async function currentUserEmail(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } });
  return user?.email ?? null;
}
