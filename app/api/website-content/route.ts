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
  const next = normalizeSiteContent(body);
  // /terms shows "Last updated" — stamp today's date whenever the terms change (2026-10-15).
  const previous = await getSiteContent();
  next.termsUpdatedOn =
    JSON.stringify(previous.terms) === JSON.stringify(next.terms)
      ? previous.termsUpdatedOn
      : new Date().toISOString().slice(0, 10);
  await saveSiteContent(next);
  return NextResponse.json({ ok: true, termsUpdatedOn: next.termsUpdatedOn });
}
