// Admin-only (authenticated, staff-accessible — not admin-only, same tier as
// /import). Backs the /website-content dashboard page (2026-10-13 public
// website feature).

import { NextResponse } from "next/server";
import { getSiteContent, normalizeSiteContent, saveSiteContent } from "@/lib/siteContent";

export async function GET() {
  const content = await getSiteContent();
  return NextResponse.json({ content });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }
  await saveSiteContent(normalizeSiteContent(body));
  return NextResponse.json({ ok: true });
}
