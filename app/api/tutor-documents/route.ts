// GET /api/tutor-documents?url=<stored document URL> — opens a tutor's CNIC or
// marksheet for logged-in staff only (2026-10-15 security hardening). The
// storage bucket is private; this checks the session (middleware already
// requires a login for anything outside its public paths, and we re-check
// here) and redirects to a signed link that expires after 5 minutes.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { signedUrlFor } from "@/lib/storage/supabase";

export async function GET(req: Request) {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stored = new URL(req.url).searchParams.get("url") ?? "";
  const signed = await signedUrlFor(stored);
  if (!signed) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const res = NextResponse.redirect(signed, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}
