// Route protection for the multi-user dashboard (2026-10 planning session —
// admin + staff roles; see prisma/schema.prisma's User model comment).
// Public, unauthenticated routes: /login, /opportunities (Section 7 — "public,
// not behind admin auth"), the public opportunities API, the two inbound
// webhooks (Meta and JazzCash need to reach us without a browser session),
// and the three Vercel Cron-triggered routes (vercel.json) — Cron requests
// carry no session cookie either; each has its own CRON_SECRET bearer check
// (lib/cron/guard.ts) once that env var is configured.
//
// Beyond plain authentication, a second check gates admin-only paths — the
// "money" pages (Payments, Finance, Campaigns, Marketing) plus user management
// itself — from a verified-but-staff session.

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/opportunities",
  "/api/auth/login",
  "/api/opportunities",
  "/api/whatsapp/webhook",
  "/api/payments/webhook",
  "/api/matches/check-notification-delay",
  "/api/parents/check-neglected",
];

const ADMIN_ONLY_PATHS = [
  "/payments",
  "/finance",
  "/campaigns",
  "/marketing",
  "/users",
  "/api/payments",
  "/api/finance",
  "/api/campaigns",
  "/api/marketing",
  "/api/marketing-spend",
  "/api/subscriptions",
  "/api/users",
];

function matches(pathname: string, list: string[]): boolean {
  return list.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (matches(pathname, PUBLIC_PATHS)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role !== "admin" && matches(pathname, ADMIN_ONLY_PATHS)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
