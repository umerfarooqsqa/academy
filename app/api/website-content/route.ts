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
  // /terms and /tutor-agreement show "Last updated" — stamp today's date
  // whenever their text changes (2026-10-15, tutor agreement 2026-10-19).
  const previous = await getSiteContent();
  const today = new Date().toISOString().slice(0, 10);
  next.termsUpdatedOn =
    JSON.stringify(previous.terms) === JSON.stringify(next.terms) ? previous.termsUpdatedOn : today;
  next.tutorAgreementUpdatedOn =
    JSON.stringify(previous.tutorAgreement) === JSON.stringify(next.tutorAgreement)
      ? previous.tutorAgreementUpdatedOn
      : today;
  await saveSiteContent(next);
  return NextResponse.json({
    ok: true,
    termsUpdatedOn: next.termsUpdatedOn,
    tutorAgreementUpdatedOn: next.tutorAgreementUpdatedOn,
  });
}
