// Periodic route (CLAUDE.md 6.5 step 7, Section 8) — triggered by Vercel Cron
// every 15 minutes (vercel.json), no queue service. Publishes any approved
// Match whose notifyAt deadline has passed with no confirmed tutor interest yet.

import { NextResponse } from "next/server";
import { publishDueOpportunities } from "@/lib/matches/actions";
import { checkCronSecret } from "@/lib/cron/guard";

export async function POST(req: Request) {
  const unauthorized = checkCronSecret(req);
  if (unauthorized) return unauthorized;

  const published = await publishDueOpportunities();
  return NextResponse.json({ published: published.length, matchIds: published });
}
