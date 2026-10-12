// POST /api/opportunities/post-facebook-digest — daily scheduled route (6.5, 8).
// Triggered by Vercel Cron (vercel.json, 15:00 UTC = 8pm PKT). The actual
// Graph API call is the "api things" piece left for later until
// FACEBOOK_PAGE_ACCESS_TOKEN is configured — this route and the dedupe logic
// (SystemState) are fully wired and ready for when it is.

import { NextResponse } from "next/server";
import { postDailyFacebookDigest } from "@/lib/opportunities/digest";
import { checkCronSecret } from "@/lib/cron/guard";

export async function POST(req: Request) {
  const unauthorized = checkCronSecret(req);
  if (unauthorized) return unauthorized;

  const result = await postDailyFacebookDigest();
  return NextResponse.json(result);
}
